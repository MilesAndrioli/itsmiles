import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Clock,
    IcosahedronGeometry,
    ShaderMaterial,
    Vector2,
    Mesh,
    Vector3,
    MathUtils,
} from "three";

import GUI from "lil-gui";
import Stats from "stats.js";

import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// --- MAIN FUNCTION ---
export default function initThreeCanvas() {
    // --- SETUP ---
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const scene = new Scene();
    const camera = new PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.z = 3;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "three-canvas";
    document.body.appendChild(renderer.domElement);

    const clock = new Clock();

    // --- SETTINGS & GUI ---
    // This object holds all the tweakable parameters for our animations.
    // The GUI will control this object directly.
    const settings = {
        scrollEffect: {
            strength: { start: 0.15, end: 0.3 },
            frequencyX: { start: 4.0, end: 8.0 },
            frequencyY: { start: 10.0, end: 5.0 },
        },
    };

    const gui = new GUI({ width: 320, title: "Animation Controls" });

    // Create a folder for the scroll animation parameters.
    const scrollFolder = gui.addFolder("Scroll Effect Parameters");
    scrollFolder
        .add(settings.scrollEffect.strength, "start", 0, 1, 0.01)
        .name("Strength Start");
    scrollFolder
        .add(settings.scrollEffect.strength, "end", 0, 1, 0.01)
        .name("Strength End");
    scrollFolder
        .add(settings.scrollEffect.frequencyX, "start", 0, 20, 0.1)
        .name("Freq X Start");
    scrollFolder
        .add(settings.scrollEffect.frequencyX, "end", 0, 20, 0.1)
        .name("Freq X End");
    scrollFolder
        .add(settings.scrollEffect.frequencyY, "start", 0, 20, 0.1)
        .name("Freq Y Start");
    scrollFolder
        .add(settings.scrollEffect.frequencyY, "end", 0, 20, 0.1)
        .name("Freq Y End");

    // --- OBJECTS ---
    const geometry = new IcosahedronGeometry(1.2, 24);
    const material = new ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            // These initial values will be quickly overridden by our animation loop.
            uStrength: { value: settings.scrollEffect.strength.start },
            uFrequency: {
                value: new Vector2(
                    settings.scrollEffect.frequencyX.start,
                    settings.scrollEffect.frequencyY.start,
                ),
            },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        wireframe: true,
    });
    const sphere = new Mesh(geometry, material);
    scene.add(sphere);

    // --- GUI MONITORS ---
    // This folder will DISPLAY the live values of the uniforms, but won't control them.
    // The `.listen()` method tells the GUI to update these displays on every frame.
    const monitorFolder = gui.addFolder("Live Uniform Monitors");
    monitorFolder
        .add(material.uniforms.uStrength, "value")
        .listen()
        .name("uStrength")
        .disable();
    monitorFolder
        .add(material.uniforms.uFrequency.value, "x")
        .listen()
        .name("uFrequency.x")
        .disable();
    monitorFolder
        .add(material.uniforms.uFrequency.value, "y")
        .listen()
        .name("uFrequency.y")
        .disable();
    // We can also monitor the camera position!
    monitorFolder.add(camera.position, "z").listen().name("camera.z").disable();

    // --- INTERACTION & ANIMATION STATE ---
    const mouse = new Vector2();
    const cameraTarget = new Vector3();
    const cameraBaseZoom = 3.0;
    const cameraZoomIntensity = 0.5;
    const cameraEasing = 0.05;

    window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- ANIMATION LOOP ---
    function animate() {
        stats.begin();
        const elapsedTime = clock.getElapsedTime();

        // 1. Update Camera Position (from mouse)
        cameraTarget.x = mouse.x * 2.0;
        cameraTarget.y = mouse.y * 2.0;
        const mouseDistance = mouse.length();
        cameraTarget.z = cameraBaseZoom - mouseDistance * cameraZoomIntensity;
        camera.position.lerp(cameraTarget, cameraEasing);
        camera.lookAt(scene.position);

        // 2. Update Shader Uniforms (from scroll)
        if (window.__LENIS__) {
            const scrollProgress = window.__LENIS__.progress;

            // ** The `animate` loop now reads from our GUI-controlled `settings` object. **
            const targetStrength = MathUtils.lerp(
                settings.scrollEffect.strength.start,
                settings.scrollEffect.strength.end,
                scrollProgress,
            );
            const targetFrequencyX = MathUtils.lerp(
                settings.scrollEffect.frequencyX.start,
                settings.scrollEffect.frequencyX.end,
                scrollProgress,
            );
            const targetFrequencyY = MathUtils.lerp(
                settings.scrollEffect.frequencyY.start,
                settings.scrollEffect.frequencyY.end,
                scrollProgress,
            );

            // Lerp the uniforms towards their calculated targets.
            material.uniforms.uStrength.value = MathUtils.lerp(
                material.uniforms.uStrength.value,
                targetStrength,
                0.07,
            );
            material.uniforms.uFrequency.value.x = MathUtils.lerp(
                material.uniforms.uFrequency.value.x,
                targetFrequencyX,
                0.07,
            );
            material.uniforms.uFrequency.value.y = MathUtils.lerp(
                material.uniforms.uFrequency.value.y,
                targetFrequencyY,
                0.07,
            );
        }

        // Update the time uniform.
        material.uniforms.uTime.value = elapsedTime;

        // Render the scene.
        renderer.render(scene, camera);

        stats.end();
        requestAnimationFrame(animate);
    }

    animate();
}
