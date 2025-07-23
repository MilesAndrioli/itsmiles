import * as THREE from "three";

// We will define our shader programs right here as strings.
// In larger projects, these would be in their own .glsl files.

// === VERTEX SHADER ===
// The "Architect". Its job is to calculate the final 3D position of every vertex.
const vertexShader = /* glsl */ `
    // A 'uniform' is a variable we pass from JavaScript into the shader.
    // We'll use it to pass in the elapsed time and the effect's strength.
    uniform float uTime;
    uniform float uStrength;

    // 'varying' is a special variable type that lets us pass data
    // from the Vertex Shader to the Fragment Shader.
    varying float vDistortion;

    // 'normal' is a pre-calculated vector that points directly outwards
    // from the surface of the vertex.
    // 'position' is the original, static position of the vertex from the geometry.
    void main() {
        // 1. Calculate the distortion amount for this specific vertex.
        // We use sine waves based on the vertex's original position and the elapsed time
        // to create a smooth, organic, wave-like motion.
        float distortion = sin(position.y * 4.0 + uTime) * uStrength;

        // 2. Create the new, displaced position.
        // We push the vertex outwards along its normal vector by the distortion amount.
        vec3 newPosition = position + normal * distortion;
        
        // 3. This is the mandatory final output for any vertex shader.
        // It converts the 3D world position into the 2D position on the screen.
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

        // 4. Pass the calculated distortion value over to the Fragment Shader.
        vDistortion = distortion;
    }
`;

// === FRAGMENT SHADER ===
// The "Painter". After the vertices are positioned, its job is to calculate
// the final color for every single pixel on the object's surface.
const fragmentShader = /* glsl */ `
    // This varying must have the same name as the one in the vertex shader.
    // It receives the interpolated distortion value for this specific pixel.
    varying float vDistortion;

    void main() {
        // We can use the distortion value to affect color.
        // abs() makes sure the value is always positive. A stronger distortion will be brighter green.
        float green = abs(vDistortion) * 2.0;

        // The final color output is a 'vec4' -> (Red, Green, Blue, Alpha).
        gl_FragColor = vec4(0.0, green, 0.0, 1.0);
    }
`;

// --- MAIN FUNCTION ---
export default function threeScene() {
    // 1. Scene: The container (same as before).
    const scene = new THREE.Scene();

    // 2. Camera: Our viewpoint (same as before).
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.z = 3;

    // 3. Renderer: The drawing engine (same as before).
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        // Make the canvas background transparent so we can see the website behind it.
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Add the canvas to the DOM. Your CSS will handle its positioning.
    document.body.appendChild(renderer.domElement);

    // 4. A Clock to keep track of time, essential for animation.
    const clock = new THREE.Clock();

    // 5. The Object (Now a Shader-Powered Sphere)
    // Use an IcosahedronGeometry. It's a sphere-like shape with many vertices,
    // which is great for showing smooth distortion. (Vertices, Detail Level)
    const geometry = new THREE.IcosahedronGeometry(1.2, 64);

    // This is the custom, programmable material.
    const material = new THREE.ShaderMaterial({
        // These are the "dials" we can control from JavaScript.
        // The names must match the 'uniform' names in the shader code.
        uniforms: {
            uTime: { value: 0.0 }, // The current time
            uStrength: { value: 0.15 }, // The intensity of the distortion
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        wireframe: true, // Show the vertices, looks cool!
    });

    // The final object, combining the shape and the material.
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 6. The Animation Loop
    function animate() {
        // Tell the browser we want to animate on the next frame.
        requestAnimationFrame(animate);

        // --- UPDATE UNIFORMS ---
        // On each frame, get the elapsed time from our clock...
        const elapsedTime = clock.getElapsedTime();
        // ...and pass it into our shader's 'uTime' uniform.
        // This is what drives the animation!
        material.uniforms.uTime.value = elapsedTime;

        // Optional: Keep it slowly rotating.
        sphere.rotation.y = elapsedTime * 0.1;

        // Render the scene from the camera's perspective.
        renderer.render(scene, camera);
    }

    // Start the animation loop!
    animate();
}
