import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Clock,
    Vector2,
    Vector3,
    IcosahedronGeometry,
    ShaderMaterial,
    Mesh,
    MathUtils,
} from "three";
import GUI from "lil-gui";
import Stats from "stats.js";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

// A self-contained class to manage the entire Three.js experience.
class ThreeExperience {
    constructor() {
        // Core components that need to be accessible across methods.
        this.scene = new Scene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.clock = new Clock();

        // State and settings.
        this.settings = this.defineSettings();
        this.mouse = new Vector2();
        this.cameraTarget = new Vector3();

        // Create the main object.
        this.sphere = this.createSphere();
        this.scene.add(this.sphere);

        // Setup optional debugging tools.
        this.stats = this.createStats();
        this.gui = this.createGui();

        // Bind event listeners and start the animation loop.
        this.addEventListeners();
        this.update();
    }

    defineSettings() {
        return {
            camera: {
                baseZoom: 3.2,
                zoomIntensity: 2,
                peekAmount: 2,
                ease: 0.03,
            },
            scrollEffect: {
                strength: { start: 0.1, end: 0.5 },
                frequencyX: { start: 0, end: 20 },
                frequencyY: { start: 20, end: 0 },
                ease: 0.05,
            },
        };
    }

    createCamera() {
        const camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10,
        );
        camera.position.z = this.settings?.camera.baseZoom || 3.2;
        return camera;
    }

    createRenderer() {
        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.id = "three-canvas";
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    createSphere() {
        const geometry = new IcosahedronGeometry(1.2, 88);
        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 },
                uStrength: { value: this.settings.scrollEffect.strength.start },
                uFrequency: {
                    value: new Vector2(
                        this.settings.scrollEffect.frequencyX.start,
                        this.settings.scrollEffect.frequencyY.start,
                    ),
                },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: true,
        });
        return new Mesh(geometry, material);
    }

    createStats() {
        const stats = new Stats();
        stats.showPanel(0);
        document.body.appendChild(stats.dom);
        return stats;
    }

    createGui() {
        const gui = new GUI();
        const cameraFolder = gui.addFolder("Camera Controls");
        cameraFolder.add(this.settings.camera, "baseZoom", 1, 10, 0.1);
        cameraFolder.add(this.settings.camera, "zoomIntensity", 0, 2, 0.1);
        cameraFolder.add(this.settings.camera, "peekAmount", 0, 5, 0.1);
        cameraFolder.add(this.settings.camera, "ease", 0.01, 0.8, 0.001);

        const scrollFolder = gui.addFolder("Scroll Effect Parameters");
        scrollFolder.add(
            this.settings.scrollEffect.strength,
            "start",
            0,
            1,
            0.01,
        );
        scrollFolder.add(
            this.settings.scrollEffect.strength,
            "end",
            0,
            1,
            0.01,
        );
        scrollFolder.add(
            this.settings.scrollEffect.frequencyX,
            "start",
            0,
            20,
            0.1,
        );
        scrollFolder.add(
            this.settings.scrollEffect.frequencyX,
            "end",
            0,
            20,
            0.1,
        );
        scrollFolder.add(
            this.settings.scrollEffect.frequencyY,
            "start",
            0,
            20,
            0.1,
        );
        scrollFolder.add(
            this.settings.scrollEffect.frequencyY,
            "end",
            0,
            20,
            0.1,
        );
        scrollFolder.add(this.settings.scrollEffect, "ease", 0.01, 0.8, 0.001);
        return gui;
    }

    addEventListeners() {
        window.addEventListener("mousemove", (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateCamera() {
        this.cameraTarget.x = this.mouse.x * this.settings.camera.peekAmount;
        this.cameraTarget.y = this.mouse.y * this.settings.camera.peekAmount;
        this.cameraTarget.z =
            this.settings.camera.baseZoom -
            this.mouse.length() * this.settings.camera.zoomIntensity;
        this.camera.position.lerp(this.cameraTarget, this.settings.camera.ease);
        this.camera.lookAt(this.scene.position);
    }

    updateUniforms() {
        if (!window.__LENIS__) return;

        const scrollProgress = window.__LENIS__.progress;
        const material = this.sphere.material;
        const settings = this.settings.scrollEffect;

        const targetStrength = MathUtils.lerp(
            settings.strength.start,
            settings.strength.end,
            scrollProgress,
        );
        const targetFrequencyX = MathUtils.lerp(
            settings.frequencyX.start,
            settings.frequencyX.end,
            scrollProgress,
        );
        const targetFrequencyY = MathUtils.lerp(
            settings.frequencyY.start,
            settings.frequencyY.end,
            scrollProgress,
        );

        material.uniforms.uStrength.value = MathUtils.lerp(
            material.uniforms.uStrength.value,
            targetStrength,
            settings.ease,
        );
        material.uniforms.uFrequency.value.x = MathUtils.lerp(
            material.uniforms.uFrequency.value.x,
            targetFrequencyX,
            settings.ease,
        );
        material.uniforms.uFrequency.value.y = MathUtils.lerp(
            material.uniforms.uFrequency.value.y,
            targetFrequencyY,
            settings.ease,
        );
    }

    update() {
        this.stats.begin();

        // The update function is now a high-level manager.
        this.updateCamera();
        this.updateUniforms();

        // Update time-based uniforms.
        this.sphere.material.uniforms.uTime.value = this.clock.getElapsedTime();

        this.renderer.render(this.scene, this.camera);
        this.stats.end();

        // The .bind(this) is crucial to maintain the correct 'this' context inside the loop.
        requestAnimationFrame(this.update.bind(this));
    }
}

// The main export is now just a clean entry point.
export default function initThreeCanvas() {
    new ThreeExperience();
}
