// ============================================================================
// ProceduralVoid — Fullscreen Procedural Noise Background
// ============================================================================
//
// This class renders a fullscreen shader quad behind all page content.
// OrthographicCamera + flat quad + fragment shader does everything
//
// The "fullscreen quad" technique is the standard way to run a fragment shader
// across every pixel on screen. It's how Shadertoy, cineshader, and most
// post-processing effects work. The geometry is just a vehicle to invoke the
// fragment shader — all the visual complexity lives in the GLSL code.
//
// DEBUG TOOLING:
// - stats-gl: GPU/CPU performance monitoring (draw calls, triangles, GPU time)
// - Tweakpane: Interactive parameter panel with all uniforms exposed
// ============================================================================

import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    Clock,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    Vector2,
    Color,
} from "three";

import vertexShader from "./shaders/ProceduralVoid.vert.glsl?raw";
import fragmentShader from "./shaders/ProceduralVoid.frag.glsl?raw";

export default class ProceduralVoid {
    constructor() {
        this.settings = this._defineSettings();

        // --- Core Three.js objects ---
        this.scene = new Scene();

        // OrthographicCamera(-1, 1, 1, -1, 0, 1) creates a camera whose
        // view volume is exactly a 2x2x1 box centered at the origin.
        // Combined with a PlaneGeometry(2, 2), this maps the plane's corners
        // directly to the screen corners — a perfect fullscreen quad.
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer = this._createRenderer();
        this.clock = new Clock();

        // --- Mouse state ---
        // We track two positions: the raw input and a smoothed version.
        // The raw position updates instantly on mousemove. The smoothed
        // position lerps toward it each frame, creating the eased motion.
        // Both are in UV space: (0,0) = bottom-left, (1,1) = top-right,
        // matching the shader's vUv coordinates for easy distance math.
        this.mouseRaw = new Vector2(0.5, 0.5);
        this.mouseSmoothed = new Vector2(0.5, 0.5);

        // --- The fullscreen quad ---
        this.quad = this._createQuad();
        this.scene.add(this.quad);

        // --- Debug tooling ---
        if (import.meta.env.DEV) {
            this._initDevTools();
        }

        // --- Initialize ---
        this._onResize();
        this._addEventListeners();
        this._startAnimationLoop();
    }

    // ========================================================================
    // SETTINGS
    // ========================================================================
    //
    // All tunable parameters live here. Tweakpane binds directly to this
    // object, so changes in the GUI automatically update these values.
    // The animation loop reads from here to push values into shader uniforms.
    //
    // Each parameter is documented with:
    //   - What it controls visually
    //   - What range of values produces interesting results
    //   - How it interacts with other parameters

    _defineSettings() {
        return {
            // ----------------------------------------------------------------
            // TIME SCALE
            // ----------------------------------------------------------------
            // Controls how fast the shader's internal clock ticks relative
            // to real time. This drives all animation in the noise.
            //
            // At 0.05, one "shader second" takes 20 real seconds — the noise
            // drifts so slowly it feels geological. At 0.5, movement becomes
            // clearly visible, like smoke or flowing water.
            //
            // Sweet spot: 0.03–0.08 for a subtle background that doesn't
            // distract from content.
            timeScale: 0.2,

            // ----------------------------------------------------------------
            // COLOR PALETTE
            // ----------------------------------------------------------------
            // Three color stops define the visual tone of the noise.
            // The shader maps noise values across these stops:
            //   low noise  -> colorBase      (darkest, most area)
            //   mid noise  -> colorMid       (ridges and creases)
            //   high noise -> colorHighlight  (brightest peaks, least area)
            //
            // Using {r,g,b} objects so Tweakpane can bind them as float-mode
            // color pickers (0-1 range, matching GLSL's vec3 expectations).

            // Base: the dominant color covering most of the background.
            // Keep this very dark — it's the "sky" between the noise features.
            colorBase: { r: 0.0, g: 0.0, b: 0.0 },

            // Mid: appears in the bulk of the noise ridges and warp creases.
            // Slightly brighter than base — this is where the texture lives.
            colorMid: { r: 0.0, g: 0.07, b: 0.14 },

            // Highlight: only visible at the sharpest ridge peaks.
            // The brightest tone — use sparingly. Even small increases
            // here dramatically change the perceived contrast.
            colorHighlight: { r: 0.15, g: 0.15, b: 0.15 },

            // ----------------------------------------------------------------
            // FBM (Fractal Brownian Motion) PARAMETERS
            // ----------------------------------------------------------------
            // FBM layers multiple octaves of noise, each at higher frequency
            // and lower amplitude. These two parameters control that layering.

            // Lacunarity: the frequency multiplier between octaves.
            // 2.0 is the classic "double the frequency each octave" setting.
            // Higher values (3-4) skip intermediate scales, making the jump
            // between detail levels more abrupt — a harsher, grittier look.
            // Lower values (1.5) pack octaves closer, giving a smoother blend.
            fbmLacunarity: 1.0,

            // Gain (persistence): the amplitude multiplier between octaves.
            // At 0.5, each octave contributes half the previous one's energy.
            // Higher gain (0.6-0.8) makes fine detail louder — noisier,
            // more turbulent. Lower gain (0.3-0.4) suppresses detail,
            // leaving only the broad, smooth shapes.
            //
            // Gain and lacunarity together define the noise's "character":
            //   High lacunarity + low gain  = smooth with occasional sharp detail
            //   Low lacunarity + high gain  = dense, busy, everywhere-detail
            fbmGain: 0.62,

            // ----------------------------------------------------------------
            // RIDGE NOISE PARAMETERS
            // ----------------------------------------------------------------
            // Ridge noise transforms smooth FBM into sharp creases by folding
            // the noise values through abs(). These parameters control
            // how that fold behaves.

            // Sharpness: the exponent applied after the abs() fold.
            // Higher values (4-8) produce thin, razor-sharp ridges with lots
            // of dark space between them — like veins or cracks.
            // Lower values (1-2) produce broader, hill-like features.
            // At exactly 1.0, it's a simple absolute-value fold.
            ridgeSharpness: 0.5,

            // Offset: shifts the threshold where the fold happens.
            // At 0.5 (midpoint of the noise range), ridges form at the
            // average noise level — evenly distributed.
            // Lower offset (0.2-0.3): fewer, more prominent ridges.
            // Higher offset (0.6-0.8): more frequent, thinner ridges.
            ridgeOffset: 0.0,

            // ----------------------------------------------------------------
            // DOMAIN WARP PARAMETERS
            // ----------------------------------------------------------------
            // Domain warping feeds noise output back as coordinate input,
            // creating flowing, organic distortions. This is the technique
            // that makes the pattern look like marble, smoke, or alien terrain
            // rather than plain noise.

            // Strength: how far (in noise-space units) the coordinates get
            // displaced. This is the "intensity" of the warping effect.
            // At 0, you see raw FBM — regular, boring blobs.
            // At 2-4, shapes start flowing and curving organically.
            // At 6-10, the pattern becomes deeply distorted — marble-like
            // swirls and alien geological formations.
            // Beyond 10, it can become chaotic and lose structure.
            warpStrength: 4.0,

            // Scale: the overall zoom level of the noise coordinate space.
            // This sets how "close" you are to the noise pattern.
            // Low scale (1-2): big, broad shapes filling the screen.
            // Mid scale (3-5): a good balance of shape and detail.
            // High scale (6-10): tighter, more intricate patterns —
            // you see more ridges but each one is smaller.
            //
            // Scale and warpStrength interact strongly:
            //   High scale + high warp = dense, complex, potentially chaotic
            //   Low scale + low warp = calm, minimal, contemplative
            warpScale: 2.5,

            // ----------------------------------------------------------------
            // SCROLL REACTIVITY
            // ----------------------------------------------------------------
            // Lenis smooth scroll exposes a progress value (0..1) on
            // window.__LENIS__.progress. We feed this into the shader
            // to subtly shift noise parameters as the user scrolls.

            // Enabled: master toggle for scroll reactivity.
            // When off, uScroll stays at 0 so all shift values have no effect.
            scrollEnabled: false,

            // Warp shift: how much scroll displaces the domain warp offset.
            // This makes the noise pattern "drift" as you scroll, as if
            // you're panning through a landscape. Subtle values (0.5-2.0)
            // feel natural; high values (3+) make the shift obvious.
            scrollWarpShift: 0.5,

            // Ridge shift: how much scroll changes the ridge sharpness.
            // Positive values sharpen ridges as you scroll down, making
            // the texture progressively more dramatic. Negative values
            // soften ridges as you scroll.
            scrollRidgeShift: 1.0,

            // Time shift: adds scroll-proportional offset to the time
            // uniform. This means scrolling "fast forwards" the noise
            // animation slightly, creating a connection between scroll
            // velocity and the background's movement.
            scrollTimeShift: 0.0,

            // Warp strength shift: how much scroll changes the domain warp
            // intensity. Positive values increase distortion as you scroll
            // down — the pattern becomes more alien and complex toward the
            // bottom. Negative values calm the pattern as you scroll.
            // At 0, warp strength stays constant regardless of scroll.
            scrollWarpStrengthShift: -1.0,

            // Gain shift: how much scroll changes FBM gain (fine detail).
            // Positive values reveal more high-frequency noise toward the
            // bottom of the page — the texture gets grittier, more detailed.
            // Negative values smooth it out as you scroll.
            scrollGainShift: -0.1,

            // Scale shift: how much scroll changes the noise zoom level.
            // Positive values zoom in as you scroll (finer, tighter patterns).
            // Negative values zoom out (broader, simpler shapes).
            // Even small values (0.5-1.0) have a noticeable effect since
            // scale directly multiplies the UV coordinates.
            scrollScaleShift: 0.0,

            // Color shift: how much scroll blends the palette toward the
            // highlight color. At 0, no change. Positive values brighten
            // the overall image as you scroll, as if light is slowly
            // revealing the texture. Negative values darken it.
            scrollColorShift: 0.0,

            // ----------------------------------------------------------------
            // MOUSE INTERACTION
            // ----------------------------------------------------------------
            // The mouse position (normalized 0..1 UV space) is passed to
            // the shader as a vec2 uniform. The shader uses it to create
            // a localized influence zone around the cursor.

            // Enabled: master toggle for mouse interaction.
            // When off, the mouse uniform still updates but the shader
            // ignores it — no GPU cost from the extra distance calculation.
            mouseEnabled: false,

            // Radius: size of the mouse influence zone in UV space.
            // At 0.1, the effect is a tight spotlight around the cursor.
            // At 0.3-0.5, it's a broad, ambient influence.
            // At 1.0+, it affects most of the screen.
            mouseRadius: 1.0,

            // Warp influence: how much the mouse displaces the noise
            // coordinates within its radius. This creates a localized
            // "push" effect — the noise bends around the cursor like
            // a magnet under iron filings.
            // Subtle values (0.5-1.5) feel like a gentle breeze.
            // High values (3+) feel like the cursor is drilling into the noise.
            mouseWarpInfluence: 0.0,

            // Brightness influence: how much the mouse brightens or
            // darkens the noise within its radius. Positive values create
            // a spotlight effect — the cursor reveals hidden detail.
            // Negative values create a shadow — the cursor darkens the area.
            mouseBrightnessInfluence: 0.0,

            // Easing: how quickly the shader's internal mouse position
            // catches up to the actual cursor. Lower values create a
            // sluggish, dreamy follow. Higher values snap to the cursor.
            // 0.05 = heavy lag (smooth, cinematic).
            // 0.2 = moderate lag (responsive but soft).
            // 1.0 = instant (no smoothing, raw input).
            mouseEase: 0.04,

            // Ridge shift: how much the cursor changes ridge sharpness
            // within its radius. Positive = sharper ridges near cursor,
            // revealing intricate crease detail. Negative = smooths
            // ridges, creating a calming zone around the cursor.
            mouseRidgeShift: -0.5,

            // Scale shift: how much the cursor changes the noise zoom
            // within its radius. Positive = zooms in near cursor (finer
            // detail under the lens). Negative = zooms out (broader
            // shapes appear, like defocusing a camera).
            mouseScaleShift: 0.0,

            // Time shift: how much the cursor speeds up or slows the
            // noise animation within its radius. Positive = time flows
            // faster near cursor (local turbulence). Negative = time
            // slows or reverses (a pocket of stillness).
            mouseTimeShift: 0.0,

            // Gain shift: how much the cursor changes FBM detail level
            // within its radius. Positive = reveals fine-grained noise
            // near cursor. Negative = suppresses it for a smoother look.
            mouseGainShift: 0.05,

            // Chromatic aberration: splits RGB channels spatially near
            // the cursor, simulating a lens that can't focus all wavelengths
            // to the same point. Creates colored fringes at noise edges.
            // At 0, disabled (no extra GPU cost). At 0.05-0.1, subtle
            // prismatic fringing. At 0.15, dramatic color split.
            // Cost: 2 extra domainWarp() evaluations when active.
            mouseChromaticStrength: 0.0,
        };
    }

    // ========================================================================
    // SETUP METHODS
    // ========================================================================

    _createRenderer() {
        const renderer = new WebGLRenderer({
            // antialias: false — The output is procedural noise, which is
            // inherently soft and organic. Anti-aliasing would waste GPU cycles
            // smoothing edges that don't exist. Compare with ThreeExperience
            // which uses antialias: true for its hard geometric edges.
            antialias: false,

            // alpha: false (default) — The shader fills every pixel with a
            // solid color. No transparency needed. This also gives the GPU a
            // slight optimization hint since it doesn't need to composite.
        });

        // Reuse the same canvas ID as ThreeExperience so the existing CSS
        // in app.css (#three-canvas) applies: position:fixed, inset:0, z:-1.
        renderer.domElement.id = "three-canvas";

        // Cap pixel ratio at 1.5. The noise pattern is low-frequency and
        // soft — rendering at full 2x or 3x retina resolution wastes GPU
        // without any visible improvement. This is a significant performance
        // win on high-DPI screens (1.5 vs 2.0 = ~44% fewer pixels).
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _createQuad() {
        // PlaneGeometry(2, 2) creates a quad from (-1,-1) to (1,1).
        // With our orthographic camera, this exactly fills the viewport.
        // Three.js automatically generates UV coordinates from (0,0) to (1,1).
        const geometry = new PlaneGeometry(2, 2);

        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 },
                uResolution: {
                    value: new Vector2(window.innerWidth, window.innerHeight),
                },

                // --- Color palette uniforms ---
                uColorBase: {
                    value: new Color(
                        this.settings.colorBase.r,
                        this.settings.colorBase.g,
                        this.settings.colorBase.b,
                    ),
                },
                uColorMid: {
                    value: new Color(
                        this.settings.colorMid.r,
                        this.settings.colorMid.g,
                        this.settings.colorMid.b,
                    ),
                },
                uColorHighlight: {
                    value: new Color(
                        this.settings.colorHighlight.r,
                        this.settings.colorHighlight.g,
                        this.settings.colorHighlight.b,
                    ),
                },

                // --- Noise parameter uniforms ---
                uFbmLacunarity: { value: this.settings.fbmLacunarity },
                uFbmGain: { value: this.settings.fbmGain },
                uRidgeSharpness: { value: this.settings.ridgeSharpness },
                uRidgeOffset: { value: this.settings.ridgeOffset },
                uWarpStrength: { value: this.settings.warpStrength },
                uWarpScale: { value: this.settings.warpScale },

                // --- Scroll reactivity uniforms ---
                uScroll: { value: 0.0 },
                uScrollWarpShift: { value: this.settings.scrollWarpShift },
                uScrollRidgeShift: { value: this.settings.scrollRidgeShift },
                uScrollTimeShift: { value: this.settings.scrollTimeShift },
                uScrollWarpStrengthShift: {
                    value: this.settings.scrollWarpStrengthShift,
                },
                uScrollGainShift: { value: this.settings.scrollGainShift },
                uScrollScaleShift: { value: this.settings.scrollScaleShift },
                uScrollColorShift: { value: this.settings.scrollColorShift },

                // --- Mouse interaction uniforms ---
                uMouseEnabled: { value: 0.0 },
                uMouse: { value: new Vector2(0.5, 0.5) },
                uMouseRadius: { value: this.settings.mouseRadius },
                uMouseWarpInfluence: {
                    value: this.settings.mouseWarpInfluence,
                },
                uMouseBrightnessInfluence: {
                    value: this.settings.mouseBrightnessInfluence,
                },
                uMouseRidgeShift: { value: this.settings.mouseRidgeShift },
                uMouseScaleShift: { value: this.settings.mouseScaleShift },
                uMouseTimeShift: { value: this.settings.mouseTimeShift },
                uMouseGainShift: { value: this.settings.mouseGainShift },
                uMouseChromaticStrength: {
                    value: this.settings.mouseChromaticStrength,
                },
            },
            vertexShader,
            fragmentShader,
            depthWrite: false,
            depthTest: false,
        });

        return new Mesh(geometry, material);
    }

    // ========================================================================
    // DEBUG TOOLING
    // ========================================================================

    async _initDevTools() {
        const [{ default: StatsGL }, { Pane }] = await Promise.all([
            import("stats-gl"),
            import("tweakpane"),
        ]);
        this.stats = this._createStats(StatsGL);
        this.pane = this._createPane(Pane);
    }

    _createStats(StatsGL) {
        // stats-gl provides GPU-aware performance monitoring.
        // Unlike the basic stats.js used in ThreeExperience, stats-gl can
        // show GPU timings, draw calls, and triangle counts — critical for
        // understanding shader performance.
        const stats = new StatsGL({
            trackGPU: true,
            trackCPU: true,
        });

        // Attach to the renderer so it can read WebGL metrics.
        stats.init(this.renderer);
        document.body.appendChild(stats.dom);

        return stats;
    }

    _createPane(Pane) {
        // Tweakpane is a modern alternative to dat.gui / lil-gui.
        // It binds directly to our settings object, so any change in
        // the GUI immediately updates the value we read in the render loop.
        //
        // By default, Tweakpane appends to document.body with position:fixed
        // at top-right. But it scrolls away if the page is long. Using the
        // `container` option, we mount it inside our own fixed-position div
        // so it stays pinned regardless of scroll position.
        const container = document.createElement("div");
        container.id = "tweakpane-container";
        container.style.cssText =
            "position: fixed; top: 8px; right: 8px; z-index: 1000;";
        document.body.appendChild(container);

        const pane = new Pane({
            title: "Procedural Void",
            container,
        });

        // ----------------------------------------------------------------
        // GENERAL
        // ----------------------------------------------------------------
        const general = pane.addFolder({ title: "General" });

        // How fast the noise drifts. Low values (0.03) = geological.
        // High values (0.3+) = smoke-like.
        general.addBinding(this.settings, "timeScale", {
            label: "Time Speed",
            min: 0.0,
            max: 0.5,
            step: 0.001,
        });

        // ----------------------------------------------------------------
        // COLORS
        // ----------------------------------------------------------------
        // Float-mode color pickers (0-1 range) matching GLSL vec3.
        const colors = pane.addFolder({ title: "Colors" });

        // Darkest tone — covers most of the screen.
        colors.addBinding(this.settings, "colorBase", {
            label: "Base (darkest)",
            color: { type: "float" },
        });

        // Mid-range — fills the noise ridges and creases.
        colors.addBinding(this.settings, "colorMid", {
            label: "Mid (ridges)",
            color: { type: "float" },
        });

        // Brightest accent — only at the sharpest peaks.
        colors.addBinding(this.settings, "colorHighlight", {
            label: "Highlight (peaks)",
            color: { type: "float" },
        });

        // ----------------------------------------------------------------
        // FBM (Fractal Brownian Motion)
        // ----------------------------------------------------------------
        const fbm = pane.addFolder({ title: "FBM (Noise Layering)" });

        // Frequency jump between octaves. 2.0 = double each layer.
        // Higher = grittier jumps. Lower = smoother blending.
        fbm.addBinding(this.settings, "fbmLacunarity", {
            label: "Lacunarity (freq jump)",
            min: 1.0,
            max: 4.0,
            step: 0.01,
        });

        // How much each octave contributes. 0.5 = half the previous.
        // Higher = noisier. Lower = smoother, broad shapes only.
        fbm.addBinding(this.settings, "fbmGain", {
            label: "Gain (detail weight)",
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });

        // ----------------------------------------------------------------
        // RIDGE NOISE
        // ----------------------------------------------------------------
        const ridge = pane.addFolder({ title: "Ridge (Crease Shape)" });

        // Exponent on the abs() fold. High = thin razor ridges.
        // Low = broad hills. 1.0 = raw fold.
        ridge.addBinding(this.settings, "ridgeSharpness", {
            label: "Sharpness (edge width)",
            min: 0.5,
            max: 8.0,
            step: 0.1,
        });

        // Where in the noise range the fold occurs.
        // 0.5 = midpoint (even distribution). Lower = fewer, bolder ridges.
        ridge.addBinding(this.settings, "ridgeOffset", {
            label: "Offset (fold threshold)",
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });

        // ----------------------------------------------------------------
        // DOMAIN WARP
        // ----------------------------------------------------------------
        const warp = pane.addFolder({ title: "Domain Warp (Distortion)" });

        // How far coordinates get displaced by noise feedback.
        // 0 = raw FBM. 4 = flowing organic. 8+ = alien marble.
        warp.addBinding(this.settings, "warpStrength", {
            label: "Strength (displacement)",
            min: 0.0,
            max: 10.0,
            step: 0.1,
        });

        // Overall zoom into the noise space.
        // Low = big shapes. High = tight, intricate patterns.
        warp.addBinding(this.settings, "warpScale", {
            label: "Scale (zoom level)",
            min: 0.5,
            max: 10.0,
            step: 0.1,
        });

        // ----------------------------------------------------------------
        // SCROLL REACTIVITY
        // ----------------------------------------------------------------
        const scroll = pane.addFolder({ title: "Scroll (Lenis)" });

        scroll.addBinding(this.settings, "scrollEnabled", {
            label: "Enabled",
        });

        // How much scrolling shifts the warp offset — creates a
        // panning effect through the noise landscape.
        scroll.addBinding(this.settings, "scrollWarpShift", {
            label: "Warp Shift (pan amount)",
            min: 0.0,
            max: 5.0,
            step: 0.1,
        });

        // How much scrolling changes ridge sharpness — the texture
        // gets progressively sharper or softer as you scroll down.
        scroll.addBinding(this.settings, "scrollRidgeShift", {
            label: "Ridge Shift (sharpen)",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });

        // How much scrolling advances the time animation — ties
        // scroll velocity to noise movement.
        scroll.addBinding(this.settings, "scrollTimeShift", {
            label: "Time Shift (scroll speed)",
            min: 0.0,
            max: 3.0,
            step: 0.1,
        });

        // How much scroll changes the domain warp distortion intensity.
        // Positive = more chaotic toward bottom. Negative = calmer.
        scroll.addBinding(this.settings, "scrollWarpStrengthShift", {
            label: "Warp Strength (distort)",
            min: -5.0,
            max: 5.0,
            step: 0.1,
        });

        // How much scroll changes FBM gain (fine detail level).
        // Positive = grittier toward bottom. Negative = smoother.
        scroll.addBinding(this.settings, "scrollGainShift", {
            label: "Gain (detail shift)",
            min: -0.3,
            max: 0.3,
            step: 0.01,
        });

        // How much scroll changes the noise zoom level.
        // Positive = zooms in as you scroll. Negative = zooms out.
        scroll.addBinding(this.settings, "scrollScaleShift", {
            label: "Scale (zoom shift)",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });

        // How much scroll brightens or darkens the overall palette.
        // Positive = light emerges as you scroll deeper.
        // Negative = fades to darkness.
        scroll.addBinding(this.settings, "scrollColorShift", {
            label: "Color (brightness shift)",
            min: -1.0,
            max: 1.0,
            step: 0.01,
        });

        // ----------------------------------------------------------------
        // MOUSE INTERACTION
        // ----------------------------------------------------------------
        const mouse = pane.addFolder({ title: "Mouse (Cursor Influence)" });

        // Master toggle. When off, the shader ignores the mouse uniform.
        mouse.addBinding(this.settings, "mouseEnabled", {
            label: "Enabled",
        });

        // Size of the influence zone around the cursor.
        // 0.1 = tight spotlight. 0.5 = broad glow. 1.0+ = most of screen.
        mouse.addBinding(this.settings, "mouseRadius", {
            label: "Radius (influence zone)",
            min: 0.05,
            max: 1.0,
            step: 0.01,
        });

        // How much the cursor pushes the noise coordinates.
        // Creates a localized distortion, like a magnet under the surface.
        mouse.addBinding(this.settings, "mouseWarpInfluence", {
            label: "Warp (distortion push)",
            min: 0.0,
            max: 5.0,
            step: 0.1,
        });

        // How much the cursor brightens or darkens the area.
        // Positive = spotlight. Negative = shadow.
        mouse.addBinding(this.settings, "mouseBrightnessInfluence", {
            label: "Brightness (light/dark)",
            min: -0.5,
            max: 0.5,
            step: 0.01,
        });

        // How quickly the smoothed position follows the cursor.
        // Low = dreamy, trailing motion. High = snappy, responsive.
        mouse.addBinding(this.settings, "mouseEase", {
            label: "Easing (follow speed)",
            min: 0.01,
            max: 1.0,
            step: 0.01,
        });

        // How much the cursor sharpens or softens ridges in its zone.
        // Positive = intricate detail revealed. Negative = calming smooth.
        mouse.addBinding(this.settings, "mouseRidgeShift", {
            label: "Ridge (sharpen near)",
            min: -4.0,
            max: 4.0,
            step: 0.1,
        });

        // How much the cursor zooms the noise in its zone.
        // Positive = lens effect (finer detail). Negative = defocus.
        mouse.addBinding(this.settings, "mouseScaleShift", {
            label: "Scale (zoom near)",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });

        // How much the cursor speeds up or slows animation in its zone.
        // Positive = local turbulence. Negative = stillness pocket.
        mouse.addBinding(this.settings, "mouseTimeShift", {
            label: "Time (speed near)",
            min: -2.0,
            max: 2.0,
            step: 0.1,
        });

        // How much the cursor reveals or hides fine noise detail.
        // Positive = grittier near cursor. Negative = smoother.
        mouse.addBinding(this.settings, "mouseGainShift", {
            label: "Gain (detail near)",
            min: -0.3,
            max: 0.3,
            step: 0.01,
        });

        // RGB channel separation near cursor. Simulates lens chromatic
        // aberration — noise edges get colored fringes. Costs 2 extra
        // domainWarp() calls when active; 0 = disabled, no cost.
        mouse.addBinding(this.settings, "mouseChromaticStrength", {
            label: "Chromatic (RGB split)",
            min: 0.0,
            max: 0.15,
            step: 0.001,
        });

        // ----------------------------------------------------------------
        // PRESETS — Save / Load via localStorage
        // ----------------------------------------------------------------
        // Tweakpane v4 provides exportState() and importState() methods.
        // exportState() captures the full UI state (all blade values,
        // folder open/closed status, etc.) as a serializable object.
        // importState() restores it. We persist to localStorage so
        // settings survive page reloads.
        //
        // The workflow:
        //   1. Dial in values using the sliders
        //   2. Click "Save Preset" — writes to localStorage
        //   3. Reload the page — preset auto-loads if it exists
        //   4. Click "Reset Defaults" — clears localStorage and reloads
        const presets = pane.addFolder({ title: "Presets" });

        presets.addButton({ title: "Save Preset" }).on("click", () => {
            const state = pane.exportState();
            localStorage.setItem("proceduralVoid", JSON.stringify(state));
        });

        presets.addButton({ title: "Load Preset" }).on("click", () => {
            this._loadPreset(pane);
        });

        presets.addButton({ title: "Reset Defaults" }).on("click", () => {
            localStorage.removeItem("proceduralVoid");
            window.location.reload();
        });

        // Auto-load saved preset on startup.
        this._loadPreset(pane);

        return pane;
    }

    _loadPreset(pane) {
        // Attempt to restore a saved state from localStorage.
        // importState() updates the Tweakpane UI, and because all
        // bindings are wired to this.settings, the settings object
        // gets updated too — the render loop picks up the new values
        // on the next frame automatically.
        const saved = localStorage.getItem("proceduralVoid");
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            pane.importState(state);
        } catch (e) {
            // If the saved state is corrupted or incompatible with
            // the current pane structure (e.g., after adding new controls),
            // fail silently and use defaults.
            console.warn("Failed to load shader preset:", e);
            localStorage.removeItem("proceduralVoid");
        }
    }

    // ========================================================================
    // EVENT HANDLING
    // ========================================================================

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update renderer to match new viewport dimensions.
        this.renderer.setSize(width, height);

        // Update the uResolution uniform so the fragment shader can
        // correct for aspect ratio. Without this, the noise pattern
        // would stretch when the window isn't square.
        this.quad.material.uniforms.uResolution.value.set(width, height);
    }

    _addEventListeners() {
        this._boundResize = this._onResize.bind(this);
        this._boundMouseMove = (event) => {
            this.mouseRaw.x = event.clientX / window.innerWidth;
            this.mouseRaw.y = 1.0 - event.clientY / window.innerHeight;
        };

        window.addEventListener("resize", this._boundResize);
        window.addEventListener("mousemove", this._boundMouseMove);
    }

    dispose() {
        this.renderer.dispose();
        this.quad.geometry.dispose();
        this.quad.material.dispose();
        this.renderer.domElement.remove();
        this.stats?.dom.remove();
        this.pane?.dispose();
        document.getElementById("tweakpane-container")?.remove();
        window.removeEventListener("resize", this._boundResize);
        window.removeEventListener("mousemove", this._boundMouseMove);
    }

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    _startAnimationLoop() {
        // Using an arrow function preserves `this` context without .bind().
        const update = () => {
            this.stats?.begin();

            this._updateUniforms();
            this.renderer.render(this.scene, this.camera);

            this.stats?.end();
            this.stats?.update();

            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    }

    _updateUniforms() {
        const uniforms = this.quad.material.uniforms;
        const s = this.settings;

        // --- Time ---
        // Multiply elapsed time by the time scale.
        // At timeScale 0.05, one "unit" of shader time passes every 20 seconds.
        uniforms.uTime.value = this.clock.getElapsedTime() * s.timeScale;

        // --- Colors ---
        // Sync color uniforms with Tweakpane-controlled settings every frame.
        uniforms.uColorBase.value.setRGB(
            s.colorBase.r,
            s.colorBase.g,
            s.colorBase.b,
        );
        uniforms.uColorMid.value.setRGB(
            s.colorMid.r,
            s.colorMid.g,
            s.colorMid.b,
        );
        uniforms.uColorHighlight.value.setRGB(
            s.colorHighlight.r,
            s.colorHighlight.g,
            s.colorHighlight.b,
        );

        // --- Noise parameters ---
        uniforms.uFbmLacunarity.value = s.fbmLacunarity;
        uniforms.uFbmGain.value = s.fbmGain;
        uniforms.uRidgeSharpness.value = s.ridgeSharpness;
        uniforms.uRidgeOffset.value = s.ridgeOffset;
        uniforms.uWarpStrength.value = s.warpStrength;
        uniforms.uWarpScale.value = s.warpScale;

        // --- Scroll ---
        // Read Lenis scroll progress (0 at top, 1 at bottom).
        // window.__LENIS__ is set by gsapLenis.js during DOMContentLoaded.
        // Before Lenis initializes, progress defaults to 0.
        if (s.scrollEnabled && window.__LENIS__) {
            uniforms.uScroll.value = window.__LENIS__.progress;
        } else {
            uniforms.uScroll.value = 0.0;
        }
        uniforms.uScrollWarpShift.value = s.scrollWarpShift;
        uniforms.uScrollRidgeShift.value = s.scrollRidgeShift;
        uniforms.uScrollTimeShift.value = s.scrollTimeShift;
        uniforms.uScrollWarpStrengthShift.value = s.scrollWarpStrengthShift;
        uniforms.uScrollGainShift.value = s.scrollGainShift;
        uniforms.uScrollScaleShift.value = s.scrollScaleShift;
        uniforms.uScrollColorShift.value = s.scrollColorShift;

        // --- Mouse ---
        // Lerp the smoothed position toward the raw input each frame.
        // This creates the eased, trailing follow effect. The lerp factor
        // (mouseEase) controls how much of the gap is closed per frame:
        //   0.08 = closes 8% of the remaining distance each frame
        //   At 60fps, this takes ~40 frames (~0.7s) to reach 95% of target
        //   At 0.5, it takes ~5 frames (~0.08s) — much snappier
        this.mouseSmoothed.lerp(this.mouseRaw, s.mouseEase);
        uniforms.uMouseEnabled.value = s.mouseEnabled ? 1.0 : 0.0;
        uniforms.uMouse.value.copy(this.mouseSmoothed);
        uniforms.uMouseRadius.value = s.mouseRadius;
        uniforms.uMouseWarpInfluence.value = s.mouseWarpInfluence;
        uniforms.uMouseBrightnessInfluence.value = s.mouseBrightnessInfluence;
        uniforms.uMouseRidgeShift.value = s.mouseRidgeShift;
        uniforms.uMouseScaleShift.value = s.mouseScaleShift;
        uniforms.uMouseTimeShift.value = s.mouseTimeShift;
        uniforms.uMouseGainShift.value = s.mouseGainShift;
        uniforms.uMouseChromaticStrength.value = s.mouseChromaticStrength;
    }
}
