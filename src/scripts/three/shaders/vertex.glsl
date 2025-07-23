uniform float uTime;
uniform float uStrength;
// --- Add the new frequency uniform ---
uniform vec2 uFrequency;

varying float vDistortion;

void main() {
    // --- Use the new frequency values in the sine wave calculation ---
    float distortion = sin(position.y * uFrequency.y + uTime) *
                       sin(position.x * uFrequency.x + uTime) *
                       uStrength;

    vec3 newPosition = position + normal * distortion;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    vDistortion = distortion;
}