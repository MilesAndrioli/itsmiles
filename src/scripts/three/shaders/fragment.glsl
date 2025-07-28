// --- UNIFORMS ---
// IMPORTANT: These uniforms are declared here but are NOT being sent from your
// JavaScript `material.uniforms` object. Therefore, their values will be 0,
// and they won't have any effect until you add them to the JS side.
uniform float uOpacity;
uniform float uDeepPurple;
 
// --- VARYING ---
// This receives the interpolated distortion value that was sent from the vertex shader.
// For a pixel in the middle of a triangle, this value will be an average
// of the `vDistortion` values from the triangle's three corner vertices.
varying float vDistortion;

// This is a helper function for generating beautiful color gradients.
// It creates a color based on cosine waves, which gives a very smooth, natural look.
// It takes a single float `t` (our distortion value) and returns a vec3 (R,G,B) color.
// a = brightness, b = contrast, c = oscillation speed, d = phase offset
vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d)); // 6.28318 is 2 * PI
}     
 
void main() {
  // We take the incoming distortion value and multiply it to make the color effect more intense.
  float distort = vDistortion * 3.0;

  // Define the parameters for our color palette function.
  // By tweaking these vectors, you can create entirely new color schemes.
  vec3 brightness = vec3(0.1, 0.1, 0.9); // Overall brightness and color tint (adds blue)
  vec3 contrast = vec3(0.3, 0.3, 0.3);   // The amplitude of the color wave (less contrast = more muted)
  vec3 oscilation = vec3(0.5, 0.5, 0.9); // How quickly the colors cycle
  vec3 phase = vec3(0.9, 0.1, 0.8);      // The starting point for each color channel's wave

  // Call the function to get the final base color for this pixel.
  vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);
  
  // --- THE FIX ---
  // We set the alpha component (the 4th value) to 1.0.
  // This makes every pixel fully opaque, preventing any part of the sphere
  // from being discarded due to negative or zero alpha.
  gl_FragColor = vec4(color, 1.0);
  
  // This second line is kept for completeness, but since its alpha component (uOpacity)
  // is not being sent from JavaScript, it will default to 0 and have no effect on the final alpha.
  // For this to work, you would need to add `uOpacity` and `uDeepPurple` to your JS uniforms.
  gl_FragColor += vec4(min(uDeepPurple, 1.0), 0.0, 0.5, min(uOpacity, 1.0));
}

// void main() {
//   // We take the incoming distortion value and multiply it to make the color effect more intense.
//   float distort = vDistortion * 3.0;

//   // Define the parameters for our color palette function.
//   vec3 brightness = vec3(0.1, 0.1, 0.9);
//   vec3 contrast = vec3(0.3, 0.3, 0.3);
//   vec3 oscilation = vec3(0.5, 0.5, 0.9);
//   vec3 phase = vec3(0.9, 0.1, 0.8);

//   // Call the function to get the final base color for this pixel.
//   vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);
  
//   // --- THE FIX ---
//   // The 'abs()' function takes the absolute value of vDistortion.
//   // This maps its original range of [-1.0, 1.0] to a new range of [0.0, 1.0],
//   // which is perfect for an alpha channel.
//   // The parts of the sphere with the most distortion will be the most opaque (alpha near 1.0),
//   // and the parts with zero distortion will be fully transparent (alpha = 0.0).
//   float alpha = abs(vDistortion);

//   // We now use our calculated `alpha` value for the final output.
//   gl_FragColor = vec4(color, alpha);
  
//   // Similar to Option 1, this line won't have a visible effect until the
//   // corresponding uniforms are added to your JavaScript material.
//   gl_FragColor += vec4(min(uDeepPurple, 1.0), 0.0, 0.5, min(uOpacity, 1.0));
// }