import * as THREE from "three";
// --- 1. IMPORT LIL-GUI ---
import GUI from "lil-gui";

// --- Import Shaders (no changes here) ---
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// --- MAIN FUNCTION ---
export default function threeScene() {
    // --- 2. INITIALIZE THE GUI ---
    // This will create a small floating panel on your page.
    const gui = new GUI({ width: 300 });

    // --- Scene, Camera, Renderer (no changes here) ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const clock = new THREE.Clock();

    // --- The Object & Shader Material ---
    const geometry = new THREE.IcosahedronGeometry(1.2, 64);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            // Let's give our strength a more interesting default value to start.
            uStrength: { value: 0.3 },
            // Let's also add a frequency uniform to play with.
            uFrequency: { value: new THREE.Vector2(5.0, 3.0) },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        wireframe: true,
    });

    // --- 3. CONNECT THE GUI TO THE UNIFORMS ---
    // Each '.add()' method creates a new controller in the GUI panel.

    // This creates a slider for the 'uStrength' uniform.
    // Arguments:
    // 1. The object to control: material.uniforms.uStrength
    // 2. The property to control on that object: 'value'
    gui.add(material.uniforms.uStrength, "value")
        .min(0) // Minimum slider value
        .max(1) // Maximum slider value
        .step(0.01) // Slider increment step
        .name("Distortion Strength"); // Label in the GUI

    // We can use folders to organize our controls.
    const frequencyFolder = gui.addFolder("Distortion Frequency");

    // lil-gui can't edit a Vector2 directly, but it can edit its x and y properties.
    frequencyFolder
        .add(material.uniforms.uFrequency.value, "x")
        .min(0)
        .max(20)
        .step(0.1)
        .name("Frequency X");
    frequencyFolder
        .add(material.uniforms.uFrequency.value, "y")
        .min(0)
        .max(20)
        .step(0.1)
        .name("Frequency Y");

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // --- Animation Loop (no changes here) ---
    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        material.uniforms.uTime.value = elapsedTime;

        sphere.rotation.y = elapsedTime * 0.1;

        renderer.render(scene, camera);
    }

    animate();
}
