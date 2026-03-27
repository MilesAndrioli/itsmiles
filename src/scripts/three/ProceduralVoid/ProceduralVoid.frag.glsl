// ============================================================================
// BACKGROUND FRAGMENT SHADER — Domain-Warped Ridge Noise
// ============================================================================
//
// This shader produces a dark, moody, procedural noise background by
// combining three classic techniques from the world of procedural graphics:
//
//   1. FBM (Fractal Brownian Motion) — layered noise for natural detail
//   2. Ridge Noise — sharp creases from abs() folding
//   3. Domain Warping — feeding noise back as coordinates for organic flow
//
// Each technique builds on the previous one. Together they produce organic,
// landscape-like patterns that evoke depth and movement — all computed
// per-pixel with pure math, no textures needed.
//
// REFERENCES:
// - Inigo Quilez: https://iquilezles.org/articles/warp/
// - The Book of Shaders: https://thebookofshaders.com/13/
// - cineshader.com for visual inspiration
// ============================================================================

// --- UNIFORMS (from JavaScript via ShaderMaterial) ---
uniform float uTime;
uniform vec2 uResolution;

// Color palette
uniform vec3 uColorBase;      // Darkest color (the "background of the background")
uniform vec3 uColorMid;       // Mid-tone for the noise ridges
uniform vec3 uColorHighlight; // Brightest accent on the sharpest ridges

// FBM parameters
uniform float uFbmLacunarity; // Frequency multiplier per octave (typically 2.0)
uniform float uFbmGain;       // Amplitude multiplier per octave (typically 0.5)

// Ridge noise parameters
uniform float uRidgeSharpness; // Controls how sharp/narrow the ridges are
uniform float uRidgeOffset;    // Shifts the ridge threshold

// Domain warp parameters
uniform float uWarpStrength;   // How much the coordinates get displaced
uniform float uWarpScale;      // Scale of the warp offset vectors
uniform vec2 uDriftDirection;  // Direction of time-driven coordinate shift

// Scroll reactivity parameters — all of these multiply uScroll (0..1) by
// their respective shift value, so at scroll=0 (top of page) they have no
// effect, and at scroll=1 (bottom) they apply the full shift amount.
uniform float uScroll;                 // Lenis scroll progress (0 = top, 1 = bottom)
uniform float uScrollWarpShift;        // Displaces the warp starting coordinates
uniform float uScrollRidgeShift;       // Changes ridge sharpness
uniform float uScrollTimeShift;        // Advances the time animation
uniform float uScrollWarpStrengthShift; // Changes domain warp intensity
uniform float uScrollGainShift;        // Changes FBM gain (fine detail)
uniform float uScrollScaleShift;       // Changes noise zoom level
uniform float uScrollColorShift;       // Shifts palette toward highlight
uniform float uScrollVelocity;        // Smoothed Lenis scroll speed (signed)
uniform float uScrollChromaticStrength; // RGB split driven by scroll velocity

// Mouse interaction parameters
uniform float uMouseEnabled;           // Toggle: 1.0 = on, 0.0 = off
uniform vec2 uMouse;                   // Smoothed cursor position in UV space (0..1)
uniform float uMouseRadius;            // Size of the influence zone
uniform float uMouseWarpInfluence;     // Localized coordinate displacement
uniform float uMouseBrightnessInfluence; // Localized brightness shift
uniform float uMouseRidgeShift;        // Localized ridge sharpness change
uniform float uMouseScaleShift;        // Localized noise zoom change
uniform float uMouseTimeShift;         // Localized animation speed change
uniform float uMouseGainShift;         // Localized FBM detail change
uniform float uMouseChromaticStrength; // RGB channel separation (chromatic aberration)
uniform float uMouseSpeed;            // Smoothed cursor movement speed (0 = still)

// Deformation parameters
uniform float uScrollRidgeOffsetShift; // Scroll-driven ridge offset change
uniform float uVortexStrength;        // Static swirl intensity

uniform float uRippleAmplitude;       // Global ripple displacement
uniform float uRippleFreq;            // Ripple ring density
uniform float uScrollRippleShift;     // Scroll-driven ripple change
uniform float uMouseRippleAmplitude;  // Mouse-centered ripple displacement

uniform float uMouseRevealStrength;   // 0 = always visible, 1 = hidden until mouse reveals
uniform float uMouseRevealFalloff;    // Reveal edge sharpness (1 = linear, >1 = tighter)

// --- VARYINGS (from Vertex Shader) ---
varying vec2 vUv;


// ============================================================================
// PER-PIXEL MODIFIERS
// ============================================================================
//
// These "global" variables act as per-pixel overrides for uniform values.
// main() computes them from the mouse influence before calling the noise
// functions. This avoids passing extra parameters through every function
// in the chain while still allowing localized mouse effects.
//
// Without this pattern, we'd need to thread mouseInfluence through
// domainWarp → ridgeFbm → fbm, which would clutter every function
// signature. Instead, main() sets these once and the noise functions
// read them as if they were uniforms.
float gGain;              // Effective FBM gain (base + scroll + mouse)
float gRidgeSharpness;    // Effective ridge sharpness (base + scroll + mouse)
float gTimeOffset;        // Extra time offset from mouse proximity
float gRidgeOffset;       // Effective ridge offset (base + scroll)
float gScrollColorBlend;  // Precomputed scroll color shift


// ============================================================================
// 1. HASH & VALUE NOISE
// ============================================================================
//
// The foundation of all procedural noise is a hash function — a way to get
// a "random-looking" number from any input coordinate. It's not truly random;
// the same input always gives the same output (deterministic). This is crucial
// because the noise must be continuous — neighboring pixels should get similar
// values, creating smooth patterns rather than TV static.
//
// We use "value noise": random values at integer grid points, smoothly
// interpolated between them. Think of it like a grid of random heights with
// a smooth surface draped over them.

// Hash function: takes a 2D coordinate, returns a pseudo-random float 0..1.
// The magic numbers (127.1, 311.7, 43758.5453123) are chosen to produce
// a good distribution of values without obvious patterns. They have no
// deeper mathematical meaning — they're empirically "good enough" constants
// that the shader community has converged on.
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise: smooth, continuous noise from the hash function.
// For any input point p:
//   1. Find which grid cell it's in (floor) and where within that cell (fract)
//   2. Get random values at all 4 corners of the cell
//   3. Smoothly blend between them using a curve (smoothstep)
//
// The smoothstep curve (3t^2 - 2t^3) is essential — linear interpolation
// would create visible grid lines at cell boundaries. Smoothstep has zero
// derivatives at 0 and 1, so the transitions are seamless.
float noise(vec2 p) {
    vec2 i = floor(p); // Integer part: which grid cell
    vec2 f = fract(p); // Fractional part: where within the cell (0..1)

    // Smoothstep interpolation curve.
    // This could also be written as: f * f * (3.0 - 2.0 * f)
    // Some shaders use quintic (6t^5 - 15t^4 + 10t^3) for even smoother
    // results, but smoothstep is sufficient for our purposes.
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Sample the 4 corners of the grid cell and bilinearly interpolate.
    // (i + vec2(0,0)) = bottom-left,  (i + vec2(1,0)) = bottom-right
    // (i + vec2(0,1)) = top-left,     (i + vec2(1,1)) = top-right
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Bilinear interpolation using the smoothed coordinates.
    // First lerp along x (bottom edge, top edge), then lerp along y.
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}


// ============================================================================
// 2. FRACTAL BROWNIAN MOTION (FBM)
// ============================================================================
//
// A single layer of noise looks blobby and boring. Nature has detail at
// every scale — a mountain range has peaks, ridges, rocks, and pebbles.
// FBM mimics this by layering multiple "octaves" of noise:
//
//   Octave 1: low frequency, high amplitude  (big shapes)
//   Octave 2: 2x frequency, 0.5x amplitude   (medium detail)
//   Octave 3: 4x frequency, 0.25x amplitude  (fine detail)
//   ...and so on
//
// "Lacunarity" is the frequency multiplier (typically 2.0).
// "Gain" (or "persistence") is the amplitude multiplier (typically 0.5).
//
// The name "Fractal Brownian Motion" comes from its resemblance to
// Brownian motion (random particle movement) — the frequency spectrum
// follows a 1/f pattern, just like many natural phenomena.

float fbm(vec2 p) {
    float value = 0.0;      // Accumulated noise value
    float amplitude = 0.5;  // Current octave's contribution strength

    // 5 octaves is the sweet spot: enough detail to look rich,
    // not so many that we waste GPU cycles on invisible sub-pixel detail.
    // Each octave roughly doubles the computation cost.
    //
    // gGain is set by main() before the noise chain runs. It combines
    // the base uFbmGain with scroll and mouse modifiers, so the
    // effective detail level can vary per-pixel (mouse) and per-scroll.
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= uFbmLacunarity;   // Increase frequency (zoom into finer detail)
        amplitude *= gGain;    // Decrease amplitude (finer details are subtler)
    }

    return value;
}


// ============================================================================
// 3. RIDGE NOISE
// ============================================================================
//
// Standard FBM produces smooth, rolling hills. Ridge noise creates sharp
// creases — like mountain ridges, river valleys, or cracked earth.
//
// The trick is beautifully simple:
//   1. Take the noise value (which ranges roughly 0..1)
//   2. Apply abs() — this "folds" the wave, creating a V-shape at zero crossings
//   3. Invert it (1.0 - abs) — now the folds become sharp peaks
//   4. Raise to a power — this narrows the peaks into crisp ridges
//
// Think of it like folding a piece of paper: the crease is the ridge.
// The "sharpness" parameter controls how tight that crease is.
// Higher sharpness = thinner, more dramatic ridges.
//
// The "offset" parameter shifts where the ridges form. Tweaking it can
// make the pattern feel more or less dense.

float ridgeFbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
        // The core ridge operation:
        // noise(p) returns ~0..1, centered around 0.5
        // Subtract offset to center it, then fold with abs()
        // Invert so folds become peaks, then sharpen with pow()
        //
        // gRidgeSharpness is set by main() and combines the base
        // uRidgeSharpness with scroll and mouse modifiers.
        // gGain is also set by main() for the same reason.
        float n = noise(p);
        n = pow(1.0 - abs(n - gRidgeOffset), gRidgeSharpness);
        value += amplitude * n;

        p *= uFbmLacunarity;
        amplitude *= gGain;
    }

    return value;
}


// ============================================================================
// 4. DOMAIN WARPING (Inigo Quilez technique)
// ============================================================================
//
// This is the technique that makes everything look organic and otherworldly.
//
// The idea: instead of evaluating noise at the original coordinates,
// use NOISE ITSELF to displace the coordinates before evaluation.
// Feed the output back as input — like audio feedback, but controlled.
//
// Mathematically:
//   Pass 1: q = fbm(p + offset1)
//   Pass 2: r = ridgeFbm(p + warpStrength * q + offset2)
//   Pass 3: f = fbm(p + warpStrength * r)
//
// Each pass creates another layer of distortion. The offsets (vec2 constants)
// break symmetry — without them, the pattern would be too regular.
//
// The result looks like marble, smoke, geological strata, or alien landscapes.
// This is the technique behind most of what you see on cineshader.com.
//
// Reference: https://iquilezles.org/articles/warp/
//
float domainWarp(vec2 p, float time) {
    // --- Scroll-driven coordinate shift ---
    // uScroll (0..1) multiplied by uScrollWarpShift offsets the starting
    // coordinates. This creates a gentle "panning" effect through the noise
    // landscape as the user scrolls — like the camera is drifting through
    // a fog bank. The vec2(1.0, 0.7) direction is arbitrary; it just means
    // the pan isn't purely horizontal or vertical.
    p += uScroll * uScrollWarpShift * vec2(1.0, 0.7);

    // --- Time with scroll and mouse offsets ---
    // gTimeOffset is set by main() and includes the mouse's localized
    // time shift. Scroll's time shift is added here globally.
    // Together they mean: scrolling nudges time forward for the whole
    // screen, while the mouse creates a localized pocket of faster
    // or slower animation.
    float t = time + uScroll * uScrollTimeShift + gTimeOffset;

    // --- First warp pass ---
    // Evaluate FBM at two offset positions to get a displacement vector (q).
    // The offsets (0.0, 0.0) and (5.2, 1.3) are arbitrary but chosen to
    // prevent the two components from being correlated. Time shifts at
    // slightly different speeds to break temporal symmetry.
    vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + uDriftDirection * t * 0.6),
        fbm(p + vec2(5.2, 1.3) + uDriftDirection * t * 0.5)
    );

    // --- Effective warp strength ---
    // Combines the base value with a scroll-proportional shift.
    // This lets the distortion intensity evolve as the user scrolls —
    // e.g., calm at the top, more chaotic at the bottom.
    float warpStr = uWarpStrength + uScroll * uScrollWarpStrengthShift;

    // --- Second warp pass ---
    // Now displace p by q, and evaluate RIDGE noise this time.
    // This is where the sharp, dramatic features come from.
    // The ridge noise uses gRidgeSharpness (set by main() with scroll
    // + mouse modifiers already baked in).
    vec2 r = vec2(
        ridgeFbm(p + warpStr * q + vec2(1.7, 9.2) + uDriftDirection * t * 0.3),
        ridgeFbm(p + warpStr * q + vec2(8.3, 2.8) + uDriftDirection * t * 0.4)
    );

    // --- Final evaluation ---
    // Displace once more by r and evaluate smooth FBM.
    // This final layer smooths out the result slightly while preserving
    // the complex structure from the previous warps.
    return fbm(p + warpStr * r);
}


// ============================================================================
// COLOR MAPPING
// ============================================================================
//
// Maps a single noise float to an RGB color using the three-stop palette.
// Extracted into a function so chromatic aberration can map each channel
// independently from a different noise sample.
//
// The pow() curves control brightness distribution:
//   f * f (quadratic) — pushes mid-values darker, keeps the image moody
//   pow(f, 3.0) (cubic) — highlights only at the sharpest peaks

vec3 colorMap(float f) {
    vec3 c = mix(uColorBase, uColorMid, clamp(f * f, 0.0, 1.0));
    c = mix(c, uColorHighlight, clamp(pow(f, 3.0), 0.0, 1.0));
    c = mix(c, uColorHighlight, gScrollColorBlend);
    return c;
}


// ============================================================================
// MAIN — Putting it all together
// ============================================================================

void main() {
    // --- Coordinate setup ---
    // Start with UV coordinates (0..1), then correct for aspect ratio.
    // Without aspect correction, the noise would stretch horizontally
    // on wide screens and vertically on tall screens.
    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    // Scale the coordinates to control the "zoom level" of the noise.
    // uWarpScale acts as an overall zoom — higher values = more zoomed in
    // (seeing finer detail), lower values = more zoomed out (bigger shapes).
    //
    // Scroll-driven scale shift: the effective scale combines the base
    // value with a scroll-proportional shift. Positive values zoom in as
    // the user scrolls deeper into the page. We clamp to a minimum of
    // 0.1 to prevent the scale from hitting zero or going negative
    // (which would flip/collapse the coordinate space).
    float scale = max(uWarpScale + uScroll * uScrollScaleShift, 0.1);
    // ================================================================
    // MOUSE INFLUENCE — Per-Pixel Modifier Computation
    // ================================================================
    //
    // The mouse creates a localized "force field" in the noise.
    // We compute the distance from the current pixel to the cursor
    // (in UV space), then use smoothstep to create a smooth falloff.
    //
    // smoothstep(edge0, edge1, x) returns:
    //   0.0 when x >= edge0 (outside the radius)
    //   1.0 when x <= edge1 (at the center)
    //   smooth interpolation in between
    //
    // We reverse it (radius → 0.0) so the effect is strongest at the
    // cursor and fades to nothing at the edge of the radius.
    //
    // The mouse influence modulates multiple noise parameters locally:
    //   - Coordinate displacement (warp push)
    //   - Ridge sharpness
    //   - FBM gain (detail level)
    //   - Time speed
    //   - Scale (zoom)
    //   - Brightness (applied after color mapping)
    //
    // The aspect-corrected mouse position is needed because we
    // corrected uv.x earlier — without this, the influence zone
    // would be an ellipse instead of a circle on non-square screens.
    float mouseInfluence = 0.0;
    vec2 mouseDir = vec2(0.0);

    // Aspect-correct the mouse position to match our corrected UV space.
    vec2 mouseUV = uMouse;
    mouseUV.x *= uResolution.x / uResolution.y;

    // --- Set per-pixel global modifiers ---
    // Start with base uniform + scroll contribution. Mouse adds on top.
    gGain = clamp(uFbmGain + uScroll * uScrollGainShift, 0.0, 1.0);
    gRidgeSharpness = uRidgeSharpness + uScroll * uScrollRidgeShift;
    gRidgeOffset = uRidgeOffset + uScroll * uScrollRidgeOffsetShift;
    gTimeOffset = 0.0;

    float effectiveScale = scale;

    if (uMouseEnabled > 0.5) {
        float dist = distance(uv, mouseUV);
        mouseInfluence = smoothstep(uMouseRadius, 0.0, dist);
        mouseDir = dist > 0.001 ? normalize(uv - mouseUV) : vec2(0.0);

        // Modulate per-pixel globals with mouse influence.
        // Each modifier is scaled by mouseInfluence, so the effect
        // fades smoothly from full strength at the cursor to zero
        // at the edge of the radius.
        gGain = clamp(gGain + mouseInfluence * uMouseGainShift, 0.0, 1.0);
        gRidgeSharpness += mouseInfluence * uMouseRidgeShift;
        gTimeOffset = mouseInfluence * uMouseTimeShift;
        effectiveScale += mouseInfluence * uMouseScaleShift;
    }

    vec2 p = uv * max(effectiveScale, 0.1);

    // --- Coordinate center (screen center in scaled UV space) ---
    vec2 coordCenter = vec2(0.5 * uResolution.x / uResolution.y, 0.5) * max(effectiveScale, 0.1);

    // --- Vortex / Swirl (distance-dependent rotation) ---
    float vortexStr = uVortexStrength;
    if (abs(vortexStr) > 0.001) {
        vec2 vd = p - coordCenter;
        float vr = length(vd);
        float va = atan(vd.y, vd.x) + vortexStr / (vr + 0.5);
        p = coordCenter + vr * vec2(cos(va), sin(va));
    }

    // --- Ripple / Wave displacement ---
    float rippleAmp = uRippleAmplitude + uScroll * uScrollRippleShift;
    if (abs(rippleAmp) > 0.001) {
        vec2 rc = p - coordCenter;
        float rd = length(rc);
        p += normalize(rc + 0.0001) * sin(rd * uRippleFreq - uTime * 4.0) * rippleAmp;
    }

    // --- Mouse-localized deformations ---
    if (uMouseEnabled > 0.5 && mouseInfluence > 0.0) {
        vec2 scaledMouseUV = mouseUV * max(effectiveScale, 0.1);

        // Mouse ripple (concentric waves from cursor)
        if (uMouseRippleAmplitude > 0.001) {
            vec2 mrc = p - scaledMouseUV;
            float mrd = length(mrc);
            p += normalize(mrc + 0.0001) * sin(mrd * uRippleFreq - uTime * 6.0)
                 * uMouseRippleAmplitude * mouseInfluence;
        }

        // Mouse warp push (existing behavior)
        p += mouseDir * mouseInfluence * uMouseWarpInfluence;
    }

    // Precompute scroll color blend once — colorMap() reads gScrollColorBlend
    // instead of recomputing per call (saves 2 redundant clamp+mix during CA).
    gScrollColorBlend = clamp(uScroll * uScrollColorShift, -0.5, 0.5);

    // --- Compute the warped noise ---
    float f = domainWarp(p, uTime);

    // --- Color mapping (with optional chromatic aberration) ---
    // Two CA sources combine into a single offset vector:
    //   Mouse CA: radial from cursor, strength from proximity
    //   Scroll CA: vertical, strength from scroll velocity
    // When both are active, their offsets add — the prismatic effect
    // shifts in the combined direction. When only one is active,
    // the other contributes zero. Cost: 2 extra domainWarp() calls
    // only when there's actual offset.
    vec3 color;
    vec2 caOffset = vec2(0.0);

    // Mouse contribution — radial from cursor, only while moving.
    // uMouseSpeed is 0 when the cursor is still, so CA fades out
    // naturally when movement stops (same behavior as scroll CA).
    if (uMouseEnabled > 0.5 && uMouseChromaticStrength > 0.0 && mouseInfluence > 0.0 && uMouseSpeed > 0.0001) {
        caOffset += mouseDir * mouseInfluence * uMouseChromaticStrength * uMouseSpeed;
    }

    // Scroll contribution — vertical split proportional to velocity.
    // The sign of uScrollVelocity determines the split direction:
    // scrolling down pushes red up / blue down, scrolling up reverses.
    if (uScrollChromaticStrength > 0.0 && abs(uScrollVelocity) > 0.001) {
        caOffset += vec2(0.0, uScrollVelocity * uScrollChromaticStrength);
    }

    if (dot(caOffset, caOffset) > 0.0) {
        float fR = domainWarp(p + caOffset, uTime);
        float fB = domainWarp(p - caOffset, uTime);

        color.r = colorMap(fR).r;
        color.g = colorMap(f).g;
        color.b = colorMap(fB).b;
    } else {
        color = colorMap(f);
    }

    // --- Mouse brightness influence ---
    // Apply a localized brightness shift around the cursor.
    // Positive uMouseBrightnessInfluence creates a spotlight — the area
    // near the cursor glows brighter, revealing hidden noise detail.
    // Negative creates a shadow — the cursor darkens the area.
    // The mouseInfluence falloff (from smoothstep) keeps this natural.
    if (uMouseEnabled > 0.5) {
        color += mouseInfluence * uMouseBrightnessInfluence;
        float reveal = pow(mouseInfluence, uMouseRevealFalloff);
        color *= mix(1.0, reveal, uMouseRevealStrength);
    }

    gl_FragColor = vec4(color, 1.0);
}
