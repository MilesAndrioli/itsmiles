// --- VARYINGS (Input from Vertex Shader) ---
// These MUST match the declarations in the vertex shader.
varying vec2 vUv;
varying float vDistortion;

// Helper function to generate smooth color gradients.
vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d)); // 2 * PI
}

void main() {
  // Use the distortion value to create variance in the color.
  float colorDistort = vDistortion * 3.0;

  // These parameters define the color palette.
  vec3 brightness = vec3(0.1, 0.1, 0.9);
  vec3 contrast = vec3(0.3, 0.3, 0.3);
  vec3 oscilation = vec3(0.5, 0.5, 0.9);
  vec3 phase = vec3(0.9, 0.1, 0.8);

  // Calculate the final color based on the palette and distortion.
  vec3 color = cosPalette(colorDistort, brightness, contrast, oscilation, phase);
  
  // Final Output: Set the color and a fixed alpha of 1.0 for a solid object.
  gl_FragColor = vec4(color, 1.0);

  // REMOVED: The redundant `gl_FragColor += ...` line has been deleted.
}