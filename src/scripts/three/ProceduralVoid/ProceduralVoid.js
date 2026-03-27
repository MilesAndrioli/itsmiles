// ============================================================================
// ProceduralVoid — Fullscreen procedural noise background
// ============================================================================
// Fullscreen quad technique: OrthographicCamera + PlaneGeometry(2,2) +
// fragment shader. The geometry just invokes the shader on every pixel.
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

import vertexShader from "./ProceduralVoid.vert.glsl?raw";
import fragmentShader from "./ProceduralVoid.frag.glsl?raw";
import presets from "./presets/index.js";

const SOFTWARE_RENDERERS = [
    "swiftshader",
    "llvmpipe",
    "microsoft basic render driver",
    "software",
];

export default class ProceduralVoid {
    static canRun() {
        if (new URLSearchParams(window.location.search).has("forceShader"))
            return true;

        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl");

        if (!gl) return false;

        let capable = true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");

        if (ext) {
            const renderer = gl
                .getParameter(ext.UNMASKED_RENDERER_WEBGL)
                .toLowerCase();

            if (SOFTWARE_RENDERERS.some((name) => renderer.includes(name))) {
                console.warn(
                    `[ProceduralVoid] Shader disabled — software renderer: "${renderer}"`,
                );
                capable = false;
            }
        }

        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return capable;
    }

    constructor(preset) {
        this.settings = {};
        this.applyPreset(preset);

        this.scene = new Scene();
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = this._createRenderer();
        this.clock = new Clock();

        // Mouse: raw input + smoothed (lerped) position, both in UV space
        this.mouseRaw = new Vector2(0.5, 0.5);
        this.mouseSmoothed = new Vector2(0.5, 0.5);
        this.mousePrevRaw = new Vector2(0.5, 0.5);
        this.mouseSpeedSmoothed = 0.0;
        this.scrollVelocitySmoothed = 0.0;

        this.quad = this._createQuad();
        this.scene.add(this.quad);

        this._devToolsActive = false;
        if (new URLSearchParams(window.location.search).has("devtools"))
            this._toggleDevTools();

        this._onResize();
        this._addEventListeners();
        this._startAnimationLoop();
    }

    // ========================================================================
    // SETTINGS
    // ========================================================================

    _defineSettings() {
        return {
            timeScale: 0.14,

            // Colors — {r,g,b} floats (0–1) for Tweakpane + GLSL vec3
            colorBase: { r: 0.0, g: 0.0, b: 0.0 },
            colorMid: { r: 0.01, g: 0.07, b: 0.13 },
            colorHighlight: { r: 0.15, g: 0.15, b: 0.15 },

            // FBM (fractal brownian motion)
            fbmLacunarity: 1.5,
            fbmGain: 0.56,

            // Ridge noise
            ridgeSharpness: 1.0,
            ridgeOffset: 0.0,

            // Domain warp
            warpStrength: 4.0,
            warpScale: 2.0,
            driftAngle: 75,

            // Scroll reactivity — driven by Lenis progress (0..1)
            scrollEnabled: true,
            scrollWarpShift: 0,
            scrollRidgeShift: 1.0,
            scrollRidgeOffsetShift: 0.0,
            scrollTimeShift: 0.0,
            scrollWarpStrengthShift: -0.5,
            scrollGainShift: -0.1,
            scrollScaleShift: 0.0,
            scrollColorShift: 0.0,
            scrollChromaticStrength: 0.002,

            // Mouse interaction — UV space (0..1)
            mouseEnabled: true,
            mouseRadius: 0.54,
            mouseWarpInfluence: 0.0,
            mouseBrightnessInfluence: 0.0,
            mouseEase: 0.02,
            mouseRidgeShift: 0.5,
            mouseScaleShift: 0.0,
            mouseTimeShift: 0.0,
            mouseGainShift: 0.05,
            mouseChromaticStrength: 0.04,

            // Deformations
            vortexStrength: 0.0,

            rippleAmplitude: 0.0,
            rippleFreq: 8.0,
            scrollRippleShift: 0.0,
            mouseRippleAmplitude: 0.0,

            mouseRevealStrength: 0.0,
            mouseRevealFalloff: 1.0,
        };
    }

    // ========================================================================
    // SETUP
    // ========================================================================

    _createRenderer() {
        const renderer = new WebGLRenderer({ antialias: false });
        const canvas = renderer.domElement;

        canvas.id = "three-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            inset: "0",
            zIndex: "-1",
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        document.body.appendChild(canvas);
        return renderer;
    }

    _createQuad() {
        // Uniform values are set by _updateUniforms() before each render.
        // Only types matter here (Color, Vector2 vs float).
        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new Vector2() },

                uColorBase: { value: new Color() },
                uColorMid: { value: new Color() },
                uColorHighlight: { value: new Color() },

                uFbmLacunarity: { value: 0 },
                uFbmGain: { value: 0 },
                uRidgeSharpness: { value: 0 },
                uRidgeOffset: { value: 0 },
                uWarpStrength: { value: 0 },
                uWarpScale: { value: 0 },
                uDriftDirection: { value: new Vector2() },

                uScroll: { value: 0 },
                uScrollWarpShift: { value: 0 },
                uScrollRidgeShift: { value: 0 },
                uScrollRidgeOffsetShift: { value: 0 },
                uScrollTimeShift: { value: 0 },
                uScrollWarpStrengthShift: { value: 0 },
                uScrollGainShift: { value: 0 },
                uScrollScaleShift: { value: 0 },
                uScrollColorShift: { value: 0 },
                uScrollVelocity: { value: 0 },
                uScrollChromaticStrength: { value: 0 },

                uMouseEnabled: { value: 0 },
                uMouse: { value: new Vector2(0.5, 0.5) },
                uMouseRadius: { value: 0 },
                uMouseWarpInfluence: { value: 0 },
                uMouseBrightnessInfluence: { value: 0 },
                uMouseRidgeShift: { value: 0 },
                uMouseScaleShift: { value: 0 },
                uMouseTimeShift: { value: 0 },
                uMouseGainShift: { value: 0 },
                uMouseChromaticStrength: { value: 0 },
                uMouseSpeed: { value: 0 },

                uVortexStrength: { value: 0 },

                uRippleAmplitude: { value: 0 },
                uRippleFreq: { value: 0 },
                uScrollRippleShift: { value: 0 },
                uMouseRippleAmplitude: { value: 0 },

                uMouseRevealStrength: { value: 0 },
                uMouseRevealFalloff: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            depthWrite: false,
            depthTest: false,
        });

        return new Mesh(new PlaneGeometry(2, 2), material);
    }

    // ========================================================================
    // DEV TOOLING
    // ========================================================================

    async _toggleDevTools() {
        if (this._devToolsActive) {
            this.stats?.dom.remove();
            this.stats = null;
            this.pane?.dispose();
            this.pane = null;
            document.getElementById("tweakpane-container")?.remove();
            this._devToolsActive = false;
            return;
        }

        const [{ default: StatsGL }, { Pane }] = await Promise.all([
            import("stats-gl"),
            import("tweakpane"),
        ]);
        this.stats = this._createStats(StatsGL);
        this.pane = this._createPane(Pane);
        this._devToolsActive = true;
    }

    _createStats(StatsGL) {
        const stats = new StatsGL({ trackGPU: true, trackCPU: true });
        stats.init(this.renderer);
        document.body.appendChild(stats.dom);
        return stats;
    }

    _createPane(Pane) {
        const container = document.createElement("div");
        container.id = "tweakpane-container";
        container.style.cssText =
            "position:fixed;bottom:8px;left:8px;z-index:1000";
        document.body.appendChild(container);

        const pane = new Pane({
            title: "Procedural Void",
            container,
            expanded: false,
        });

        // --- General ---
        const general = pane.addFolder({ title: "General", expanded: false });
        general.addBinding(this.settings, "timeScale", {
            label: "Time Speed",
            min: 0.0,
            max: 0.5,
            step: 0.001,
        });
        general.addBinding(this.settings, "warpScale", {
            label: "Scale (zoom level)",
            min: 0.5,
            max: 10.0,
            step: 0.1,
        });
        general.addBinding(this.settings, "driftAngle", {
            label: "Drift Angle (direction)",
            min: 0,
            max: 360,
            step: 1,
        });
        general.addBinding(this.settings, "colorBase", {
            label: "Base (darkest)",
            color: { type: "float" },
        });
        general.addBinding(this.settings, "colorMid", {
            label: "Mid (ridges)",
            color: { type: "float" },
        });
        general.addBinding(this.settings, "colorHighlight", {
            label: "Highlight (peaks)",
            color: { type: "float" },
        });

        // --- FBM ---
        const fbm = pane.addFolder({ title: "FBM", expanded: false });
        fbm.addBinding(this.settings, "fbmLacunarity", {
            label: "Lacunarity (freq jump)",
            min: 1.0,
            max: 4.0,
            step: 0.01,
        });
        fbm.addBinding(this.settings, "fbmGain", {
            label: "Gain",
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });

        // --- Ridge ---
        const ridge = pane.addFolder({ title: "Ridge", expanded: false });
        ridge.addBinding(this.settings, "ridgeSharpness", {
            label: "Sharpness (edge width)",
            min: 0.5,
            max: 8.0,
            step: 0.1,
        });

        // --- Domain Warp ---
        const warp = pane.addFolder({ title: "Domain Warp", expanded: false });
        warp.addBinding(this.settings, "warpStrength", {
            label: "Strength (displacement)",
            min: 0.0,
            max: 10.0,
            step: 0.1,
        });

        // --- Vortex ---
        const vortex = pane.addFolder({ title: "Vortex", expanded: false });
        vortex.addBinding(this.settings, "vortexStrength", {
            label: "Strength (swirl)",
            min: -10.0,
            max: 10.0,
            step: 0.1,
        });

        // --- Ripple ---
        const ripple = pane.addFolder({ title: "Ripple", expanded: false });
        ripple.addBinding(this.settings, "rippleAmplitude", {
            label: "Amplitude",
            min: 0.0,
            max: 2.0,
            step: 0.01,
        });
        ripple.addBinding(this.settings, "rippleFreq", {
            label: "Frequency",
            min: 1.0,
            max: 30.0,
            step: 0.1,
        });

        // --- Scroll ---
        const scroll = pane.addFolder({ title: "Scroll", expanded: false });
        scroll.addBinding(this.settings, "scrollEnabled", { label: "Enabled" });
        scroll.addBinding(this.settings, "scrollWarpShift", {
            label: "Warp Shift (pan amount)",
            min: 0.0,
            max: 5.0,
            step: 0.1,
        });
        scroll.addBinding(this.settings, "scrollRidgeShift", {
            label: "Sharpness",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });
        scroll.addBinding(this.settings, "scrollRidgeOffsetShift", {
            label: "Ridge Offset",
            min: -0.5,
            max: 0.5,
            step: 0.01,
        });
        scroll.addBinding(this.settings, "scrollTimeShift", {
            label: "Time",
            min: 0.0,
            max: 3.0,
            step: 0.1,
        });
        scroll.addBinding(this.settings, "scrollWarpStrengthShift", {
            label: "Warp Strength",
            min: -5.0,
            max: 5.0,
            step: 0.1,
        });
        scroll.addBinding(this.settings, "scrollGainShift", {
            label: "Gain",
            min: -0.3,
            max: 0.3,
            step: 0.01,
        });
        scroll.addBinding(this.settings, "scrollScaleShift", {
            label: "Scale",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });
        scroll.addBinding(this.settings, "scrollColorShift", {
            label: "Color",
            min: -1.0,
            max: 1.0,
            step: 0.01,
        });
        scroll.addBinding(this.settings, "scrollChromaticStrength", {
            label: "Chromatic (RGB split)",
            min: 0.0,
            max: 0.05,
            step: 0.001,
        });
        scroll.addBinding(this.settings, "scrollRippleShift", {
            label: "Ripple",
            min: -1.0,
            max: 1.0,
            step: 0.01,
        });

        // --- Mouse ---
        const mouse = pane.addFolder({ title: "Mouse", expanded: false });
        mouse.addBinding(this.settings, "mouseEnabled", { label: "Enabled" });
        mouse.addBinding(this.settings, "mouseRadius", {
            label: "Radius (influence zone)",
            min: 0.05,
            max: 1.0,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseWarpInfluence", {
            label: "Warp (distortion push)",
            min: 0.0,
            max: 5.0,
            step: 0.1,
        });
        mouse.addBinding(this.settings, "mouseBrightnessInfluence", {
            label: "Brightness (light/dark)",
            min: -0.5,
            max: 0.5,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseEase", {
            label: "Easing (follow speed)",
            min: 0.01,
            max: 1.0,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseRidgeShift", {
            label: "Sharpness",
            min: -4.0,
            max: 4.0,
            step: 0.1,
        });
        mouse.addBinding(this.settings, "mouseScaleShift", {
            label: "Scale",
            min: -3.0,
            max: 3.0,
            step: 0.1,
        });
        mouse.addBinding(this.settings, "mouseTimeShift", {
            label: "Time",
            min: -2.0,
            max: 2.0,
            step: 0.1,
        });
        mouse.addBinding(this.settings, "mouseGainShift", {
            label: "Gain",
            min: -0.3,
            max: 0.3,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseChromaticStrength", {
            label: "Chromatic (RGB split)",
            min: 0.0,
            max: 0.15,
            step: 0.001,
        });
        mouse.addBinding(this.settings, "mouseRippleAmplitude", {
            label: "Ripple",
            min: 0.0,
            max: 1.5,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseRevealStrength", {
            label: "Reveal Strength",
            min: 0.0,
            max: 1.0,
            step: 0.01,
        });
        mouse.addBinding(this.settings, "mouseRevealFalloff", {
            label: "Reveal Falloff (edge)",
            min: 0.5,
            max: 5.0,
            step: 0.1,
        });

        // --- Preset Manager ---
        const presetActions = pane.addFolder({ title: "Preset Manager" });

        const presetOpts = { "(defaults)": "" };
        for (const name of Object.keys(presets)) {
            presetOpts[name] = name;
        }
        presetActions.addBinding(this, "_currentPreset", {
            label: "Preset",
            options: presetOpts,
        }).on("change", (ev) => {
            this.applyPreset(ev.value || undefined);
        });

        presetActions.addButton({ title: "Save" }).on("click", () => {
            const state = pane.exportState();
            localStorage.setItem("proceduralVoid", JSON.stringify(state));
        });

        presetActions.addButton({ title: "Load" }).on("click", () => {
            this._loadPreset(pane);
        });

        presetActions.addButton({ title: "Reset" }).on("click", () => {
            localStorage.removeItem("proceduralVoid");
            const marker = document.querySelector("[data-procedural-void]");
            this.applyPreset(marker?.dataset.proceduralVoid || undefined);
        });

        presetActions.addButton({ title: "Export" }).on("click", () => {
            navigator.clipboard.writeText(
                JSON.stringify(this.settings, null, 2),
            );
        });

        this._loadPreset(pane);
        return pane;
    }

    _loadPreset(pane) {
        const saved = localStorage.getItem("proceduralVoid");
        if (!saved) return;

        try {
            pane.importState(JSON.parse(saved));
        } catch (e) {
            console.warn("Failed to load shader preset:", e);
            localStorage.removeItem("proceduralVoid");
        }
    }

    // ========================================================================
    // EVENTS
    // ========================================================================

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.quad.material.uniforms.uResolution.value.set(width, height);
    }

    _addEventListeners() {
        this._boundResize = this._onResize.bind(this);
        this._boundMouseMove = (event) => {
            this.mouseRaw.x = event.clientX / window.innerWidth;
            this.mouseRaw.y = 1.0 - event.clientY / window.innerHeight;
        };

        this._boundKeyDown = (event) => {
            if (event.shiftKey && event.code === "KeyD") this._toggleDevTools();
        };

        window.addEventListener("resize", this._boundResize);
        window.addEventListener("mousemove", this._boundMouseMove);
        window.addEventListener("keydown", this._boundKeyDown);
    }

    // ========================================================================
    // PRESET / LIFECYCLE
    // ========================================================================

    applyPreset(preset) {
        const defaults = this._defineSettings();
        if (preset) {
            const values =
                typeof preset === "string" ? presets[preset] : preset;
            if (values) Object.assign(defaults, values);
        }
        Object.assign(this.settings, defaults);
        this._currentPreset = typeof preset === "string" ? preset : "";
        this.pane?.refresh();
    }

    pause() {
        cancelAnimationFrame(this._rafId);
        this.renderer.domElement.style.visibility = "hidden";
    }

    resume() {
        this.renderer.domElement.style.visibility = "visible";
        this._startAnimationLoop();
    }

    dispose() {
        cancelAnimationFrame(this._rafId);
        this.renderer.dispose();
        this.quad.geometry.dispose();
        this.quad.material.dispose();
        this.renderer.domElement.remove();
        this.stats?.dom.remove();
        this.pane?.dispose();
        document.getElementById("tweakpane-container")?.remove();
        window.removeEventListener("resize", this._boundResize);
        window.removeEventListener("mousemove", this._boundMouseMove);
        window.removeEventListener("keydown", this._boundKeyDown);
    }

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    _startAnimationLoop() {
        cancelAnimationFrame(this._rafId);

        const update = () => {
            this.stats?.begin();

            this._updateUniforms();
            this.renderer.render(this.scene, this.camera);

            this.stats?.end();
            this.stats?.update();

            this._rafId = requestAnimationFrame(update);
        };

        this._rafId = requestAnimationFrame(update);
    }

    _updateUniforms() {
        const u = this.quad.material.uniforms;
        const s = this.settings;

        // Time
        u.uTime.value = this.clock.getElapsedTime() * s.timeScale;

        // Colors
        u.uColorBase.value.setRGB(s.colorBase.r, s.colorBase.g, s.colorBase.b);
        u.uColorMid.value.setRGB(s.colorMid.r, s.colorMid.g, s.colorMid.b);
        u.uColorHighlight.value.setRGB(
            s.colorHighlight.r,
            s.colorHighlight.g,
            s.colorHighlight.b,
        );

        // Noise
        u.uFbmLacunarity.value = s.fbmLacunarity;
        u.uFbmGain.value = s.fbmGain;
        u.uRidgeSharpness.value = s.ridgeSharpness;
        u.uRidgeOffset.value = s.ridgeOffset;
        u.uWarpStrength.value = s.warpStrength;
        u.uWarpScale.value = s.warpScale;

        const rad = s.driftAngle * (Math.PI / 180);
        u.uDriftDirection.value.set(
            Math.cos(rad) * Math.SQRT2,
            Math.sin(rad) * Math.SQRT2,
        );

        // Scroll — Lenis progress (0..1) + smoothed velocity
        if (s.scrollEnabled && window.__LENIS__) {
            u.uScroll.value = window.__LENIS__.progress;
            this.scrollVelocitySmoothed +=
                (window.__LENIS__.velocity - this.scrollVelocitySmoothed) * 0.1;
        } else {
            u.uScroll.value = 0.0;
            this.scrollVelocitySmoothed = 0.0;
        }

        u.uScrollWarpShift.value = s.scrollWarpShift;
        u.uScrollRidgeShift.value = s.scrollRidgeShift;
        u.uScrollRidgeOffsetShift.value = s.scrollRidgeOffsetShift;
        u.uScrollTimeShift.value = s.scrollTimeShift;
        u.uScrollWarpStrengthShift.value = s.scrollWarpStrengthShift;
        u.uScrollGainShift.value = s.scrollGainShift;
        u.uScrollScaleShift.value = s.scrollScaleShift;
        u.uScrollColorShift.value = s.scrollColorShift;
        u.uScrollVelocity.value = this.scrollVelocitySmoothed;
        u.uScrollChromaticStrength.value = s.scrollChromaticStrength;

        // Mouse — lerp smoothed position toward raw, track speed
        this.mouseSmoothed.lerp(this.mouseRaw, s.mouseEase);

        const rawSpeed = this.mouseRaw.distanceTo(this.mousePrevRaw);
        this.mouseSpeedSmoothed +=
            (Math.min(rawSpeed / 0.01, 1.0) - this.mouseSpeedSmoothed) * 0.1;
        this.mousePrevRaw.copy(this.mouseRaw);

        u.uMouseEnabled.value = s.mouseEnabled ? 1.0 : 0.0;
        u.uMouse.value.copy(this.mouseSmoothed);
        u.uMouseSpeed.value = this.mouseSpeedSmoothed;
        u.uMouseRadius.value = s.mouseRadius;
        u.uMouseWarpInfluence.value = s.mouseWarpInfluence;
        u.uMouseBrightnessInfluence.value = s.mouseBrightnessInfluence;
        u.uMouseRidgeShift.value = s.mouseRidgeShift;
        u.uMouseScaleShift.value = s.mouseScaleShift;
        u.uMouseTimeShift.value = s.mouseTimeShift;
        u.uMouseGainShift.value = s.mouseGainShift;
        u.uMouseChromaticStrength.value = s.mouseChromaticStrength;

        // Deformations
        u.uVortexStrength.value = s.vortexStrength;

        u.uRippleAmplitude.value = s.rippleAmplitude;
        u.uRippleFreq.value = s.rippleFreq;
        u.uScrollRippleShift.value = s.scrollRippleShift;
        u.uMouseRippleAmplitude.value = s.mouseRippleAmplitude;

        u.uMouseRevealStrength.value = s.mouseRevealStrength;
        u.uMouseRevealFalloff.value = s.mouseRevealFalloff;
    }
}
