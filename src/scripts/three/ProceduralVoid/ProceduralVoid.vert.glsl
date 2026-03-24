// ============================================================================
// BACKGROUND VERTEX SHADER — Fullscreen Quad Pass-through
// ============================================================================
//
// PURPOSE:
// This is a minimal vertex shader for a fullscreen quad technique.
// Unlike the icosahedron shader (vertex.glsl), this one does NO vertex
// displacement. Its only job is to position a flat plane that covers
// the entire screen and pass UV coordinates to the fragment shader,
// where all the visual magic happens.
//
// HOW THE FULLSCREEN QUAD WORKS:
// We use a PlaneGeometry(2, 2) centered at the origin, combined with an
// OrthographicCamera(-1, 1, 1, -1, 0, 1). This means:
//   - The plane's corners are at (-1,-1), (1,-1), (1,1), (-1,1)
//   - The ortho camera maps those directly to clip space (screen corners)
//   - The result: every pixel on screen gets a fragment shader invocation
//   - The projectionMatrix * modelViewMatrix transform is essentially identity
//     but we keep it for Three.js ShaderMaterial compatibility
//
// The fragment shader receives vUv (0,0 at bottom-left to 1,1 at top-right)
// and uses it as the starting coordinate for all procedural noise generation.
// ============================================================================

// --- VARYINGS (Output to Fragment Shader) ---
// UV coordinates interpolated across the quad's surface.
// These become the "canvas coordinates" for our procedural noise.
varying vec2 vUv;

void main() {
    // Pass the built-in UV attribute straight through.
    // Three.js PlaneGeometry provides UVs from (0,0) to (1,1) automatically.
    vUv = uv;

    // Transform position to clip space using Three.js built-in matrices.
    // For our ortho setup this is effectively a no-op, but it keeps the
    // shader compatible with Three.js's ShaderMaterial uniform injection.
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
