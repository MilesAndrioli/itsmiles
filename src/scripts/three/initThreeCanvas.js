// --- IMPORTS ---
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
    BoxGeometry,
} from "three";
import GUI from "lil-gui";
import Stats from "stats.js";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// --- MAIN FUNCTION ---
export default function initThreeCanvas() {
    // --- 1. CORE SETUP ---
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
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "three-canvas";
    document.body.appendChild(renderer.domElement);
    const clock = new Clock();

    // --- 2. UNIFIED SETTINGS & STATE ---
    // All tweakable parameters and live state variables are centralized here.

    const settings = {
        camera: {
            baseZoom: 3.4,
            zoomIntensity: 0.7,
            peekAmount: 1.5,
            ease: 0.02,
        },
        scrollEffect: {
            strength: { start: 0.05, end: 0.0 },
            frequencyX: { start: 20, end: 0.0 },
            frequencyY: { start: 0.0, end: 20 },
            ease: 0.05,
        },
    };

    const mouse = new Vector2();
    const cameraTarget = new Vector3();
    const liveInputs = { scrollProgress: 0 };

    // --- 3. GUI SETUP ---
    const gui = new GUI({ width: 320, title: "Animation Controls" });

    // Camera Controls Folder
    const cameraFolder = gui.addFolder("Camera Controls");
    cameraFolder.add(settings.camera, "baseZoom", 1, 10, 0.1).name("Base Zoom");
    cameraFolder
        .add(settings.camera, "zoomIntensity", 0, 2, 0.1)
        .name("Zoom Intensity");
    cameraFolder
        .add(settings.camera, "peekAmount", 0, 5, 0.1)
        .name("Peek Amount");
    cameraFolder
        .add(settings.camera, "ease", 0.01, 0.2, 0.001)
        .name("Camera Easing");

    // Scroll Effect Controls Folder
    const scrollFolder = gui.addFolder("Scroll Effect Parameters");
    scrollFolder
        .add(settings.scrollEffect.strength, "start", 0, 1, 0.01)
        .name("Strength Start");
    scrollFolder
        .add(settings.scrollEffect.strength, "end", 0, 1, 0.01)
        .name("Strength End");
    // ** FIX: Re-adding the frequency sliders **
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
    scrollFolder
        .add(settings.scrollEffect, "ease", 0.01, 0.2, 0.001)
        .name("Uniform Easing");

    // --- 4. OBJECTS ---
    const geometry = new IcosahedronGeometry(1.2, 24);
    // const geometry = new BoxGeometry(1, 1, 1);
    const material = new ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
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

    // --- 5. GUI MONITORS ---
    // Now that the material and camera exist, we can add the monitors.
    const monitorFolder = gui.addFolder("Live Monitors");
    monitorFolder
        .add(liveInputs, "scrollProgress")
        .listen()
        .name("Scroll Progress")
        .disable();
    monitorFolder
        .add(camera.position, "z")
        .listen()
        .name("camera.z")
        .step(0.001)
        .disable();
    monitorFolder
        .add(material.uniforms.uStrength, "value")
        .listen()
        .name("uStrength")
        .step(0.001)
        .disable();
    // ** FIX: Re-adding the frequency monitors **
    monitorFolder
        .add(material.uniforms.uFrequency.value, "x")
        .listen()
        .name("uFrequency.x")
        .step(0.001)
        .disable();
    monitorFolder
        .add(material.uniforms.uFrequency.value, "y")
        .listen()
        .name("uFrequency.y")
        .step(0.001)
        .disable();

    // --- 6. EVENT LISTENERS ---
    camera.position.z = settings.camera.baseZoom;
    window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- 7. ANIMATION LOOP ---
    function animate() {
        stats.begin();
        const elapsedTime = clock.getElapsedTime();

        // Update Camera Position
        cameraTarget.x = mouse.x * settings.camera.peekAmount;
        cameraTarget.y = mouse.y * settings.camera.peekAmount;
        const mouseDistance = mouse.length();
        cameraTarget.z =
            settings.camera.baseZoom -
            mouseDistance * settings.camera.zoomIntensity;
        camera.position.lerp(cameraTarget, settings.camera.ease);
        camera.lookAt(scene.position);

        // Update Shader Uniforms from Scroll
        if (window.__LENIS__) {
            const scrollProgress = window.__LENIS__.progress;
            liveInputs.scrollProgress = scrollProgress;

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

            material.uniforms.uStrength.value = MathUtils.lerp(
                material.uniforms.uStrength.value,
                targetStrength,
                settings.scrollEffect.ease,
            );
            material.uniforms.uFrequency.value.x = MathUtils.lerp(
                material.uniforms.uFrequency.value.x,
                targetFrequencyX,
                settings.scrollEffect.ease,
            );
            material.uniforms.uFrequency.value.y = MathUtils.lerp(
                material.uniforms.uFrequency.value.y,
                targetFrequencyY,
                settings.scrollEffect.ease,
            );
        }

        material.uniforms.uTime.value = elapsedTime;
        renderer.render(scene, camera);
        stats.end();
        requestAnimationFrame(animate);
    }

    animate();
}
