// --- UNIFORMS ---
// These are the variables passed in from our JavaScript `uniforms` object.
// The names and types MUST match exactly.
uniform float uTime;      // The current time, used for animation.
uniform float uStrength;  // The overall intensity of the distortion.
uniform vec2 uFrequency;   // The x and y frequencies for the wave patterns.

// --- VARYING ---
// A 'varying' is a special variable used to pass data from the Vertex Shader
// to the Fragment Shader. The GPU will smoothly interpolate its value
// across the surface of each triangle.
varying float vDistortion;

// The main function that gets executed for each vertex.
void main() {
    // --- DISTORTION CALCULATION ---
    // This is the core formula for the visual effect.
    // We create two sine waves: one based on the vertex's x-position and one on its y-position.
    // Multiplying them together creates a more complex, interwoven pattern.
    // We add `uTime` to make the pattern move and animate over time.
    // Finally, we multiply by `uStrength` to control how strong the effect is.
    float distortion = sin(position.y * uFrequency.y + uTime) *
                       sin(position.x * uFrequency.x + uTime) *
                       uStrength;

    // --- POSITION CALCULATION ---
    // `position` is the vertex's original, static position.
    // `normal` is a vector that points directly "out" from the vertex's surface.
    // By multiplying the normal by our `distortion` value, we push the vertex
    // outwards or inwards along its natural direction, creating the bulge effect.
    vec3 newPosition = position + normal * distortion;
    
    // --- FINAL OUTPUT ---
    // `gl_Position` is a special, built-in output variable.
    // We must assign the final calculated position to it.
    // The `projectionMatrix` and `modelViewMatrix` are provided by Three.js
    // to correctly project our 3D world position into 2D screen space.
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    // Pass the calculated distortion value to the fragment shader.
    // This will allow us to base the pixel's color on how much it was distorted.
    vDistortion = distortion;
}