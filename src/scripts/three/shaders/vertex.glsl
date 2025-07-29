// --- UNIFORMS (from JavaScript) ---
uniform float uTime;
uniform float uStrength;
uniform vec2 uFrequency;
uniform vec3 uMousePosition;
uniform float uMouseStrength;
uniform float uMouseRadius;

// --- VARYINGS (Output to Fragment Shader) ---
varying vec2 vUv;
varying float vDistortion;

void main() {
    vUv = uv;

    // --- 1. Calculate the base distortion from time and scroll ---
    // This creates the underlying "wobble" of the sphere.
    float timeDistortion = sin(position.y * uFrequency.y + uTime) *
                           sin(position.x * uFrequency.x + uTime) *
                           uStrength;

    // --- 2. Calculate the mouse-based distortion independently ---
    // First, find the distance between this vertex and the 3D mouse position.
    float mouseDistance = distance(position, uMousePosition);

    // Now, create the "magnet" falloff effect using smoothstep.
    float mouseIntensity = 1.0 - smoothstep(0.0, uMouseRadius, mouseDistance);

    // The final mouse distortion is this intensity multiplied by its own strength setting.
    float mouseDistortion = mouseIntensity * uMouseStrength;

    // --- THE FIX: Combine distortions by ADDING them together ---
    // This makes the two effects independent. The mouse will always add its
    // force on top of the base wobble, regardless of the uStrength value.
    float finalDistortion = timeDistortion + mouseDistortion;

    // --- 4. Apply the final, combined distortion to the position ---
    vec3 newPosition = position + normal * finalDistortion;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    // Pass the final distortion value to the fragment shader for coloring.
    vDistortion = finalDistortion;
}