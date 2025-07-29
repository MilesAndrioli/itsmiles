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
    Raycaster,
    Plane,
} from "three";

import GUI from "lil-gui";
import Stats from "stats.js";

import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

export default class ThreeExperience {
    constructor() {
        this.settings = this._defineSettings();

        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, 1, 0.1, 10);
        this.renderer = this._createRenderer();
        this.clock = new Clock();

        this.mouse = new Vector2();
        this.cameraTarget = new Vector3();
        this.raycaster = new Raycaster();
        this.intersectionPlane = new Plane(new Vector3(0, 0, 1), 0);
        this.mousePosition3D = new Vector3();

        this.sphere = this._createSphere();
        this.scene.add(this.sphere);

        this.stats = this._createStats();
        this.gui = this._createGui();

        this._onResize();
        this._addEventListeners();
        this._startAnimationLoop();
    }

    _defineSettings() {
        return {
            effects: {
                cameraMovement: true,
            },
            camera: {
                baseZoom: 2.6,
                zoomIntensity: 0.5,
                peekAmount: 4,
                ease: 0.03,
            },
            scrollEffect: {
                strength: { start: 0.1, end: 0.05 },
                frequencyX: { start: 30, end: 1 },
                frequencyY: { start: 1, end: 30 },
                ease: 0.05,
            },
            mouseEffect: {
                strength: 0.25,
                radius: 1.3,
            },
        };
    }

    _createRenderer() {
        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.domElement.id = "three-canvas";
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _createSphere() {
        // const geometry = new IcosahedronGeometry(1.2, 0);
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
                uMousePosition: { value: new Vector3() },
                uMouseStrength: { value: this.settings.mouseEffect.strength },
                uMouseRadius: { value: this.settings.mouseEffect.radius },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: false,
        });
        return new Mesh(geometry, material);
    }

    _createStats() {
        const stats = new Stats();
        stats.showPanel(0);
        document.body.appendChild(stats.dom);
        return stats;
    }

    _createGui() {
        const gui = new GUI();
        this._createMainGui(gui);
        this._createCameraGui(gui);
        this._createScrollGui(gui);
        this._createMouseGui(gui);
        this._createMonitorGui(gui);
        return gui;
    }

    _createMainGui(gui) {
        const folder = gui.addFolder("Main Controls");
        folder
            .add(this.settings.effects, "cameraMovement")
            .name("Enable Camera Movement");
    }

    _createCameraGui(gui) {
        const folder = gui.addFolder("Camera Controls");
        folder
            .add(this.settings.camera, "baseZoom", 1, 10, 0.1)
            .name("Base Zoom");
        folder
            .add(this.settings.camera, "zoomIntensity", 0, 2, 0.1)
            .name("Zoom Intensity");
        folder
            .add(this.settings.camera, "peekAmount", 0, 5, 0.1)
            .name("Peek Amount");
        folder
            .add(this.settings.camera, "ease", 0.01, 0.8, 0.001)
            .name("Camera Easing");
    }

    _createScrollGui(gui) {
        const folder = gui.addFolder("Scroll Effect Parameters");
        folder
            .add(this.settings.scrollEffect.strength, "start", 0, 1, 0.01)
            .name("Strength Start");
        folder
            .add(this.settings.scrollEffect.strength, "end", 0, 1, 0.01)
            .name("Strength End");
        folder
            .add(this.settings.scrollEffect.frequencyX, "start", 0, 30, 0.1)
            .name("Frequency X Start");
        folder
            .add(this.settings.scrollEffect.frequencyX, "end", 0, 30, 0.1)
            .name("Frequency X End");
        folder
            .add(this.settings.scrollEffect.frequencyY, "start", 0, 30, 0.1)
            .name("Frequency Y Start");
        folder
            .add(this.settings.scrollEffect.frequencyY, "end", 0, 30, 0.1)
            .name("Frequency Y End");
        folder
            .add(this.settings.scrollEffect, "ease", 0.01, 0.8, 0.001)
            .name("Uniform Easing");
    }

    _createMouseGui(gui) {
        const folder = gui.addFolder("Mouse Magnet Effect");

        folder
            .add(this.settings.mouseEffect, "strength", 0, 2, 0.01)
            .name("Strength");

        folder
            .add(this.settings.mouseEffect, "radius", 0, 5, 0.01)
            .name("Radius");
    }

    _createMonitorGui(gui) {
        const folder = gui.addFolder("Live Monitors");
        folder
            .add(this.mouse, "x")
            .name("mouse.x")
            .listen()
            .decimals(2)
            .disable();
        folder
            .add(this.mouse, "y")
            .name("mouse.y")
            .listen()
            .decimals(2)
            .disable();
        folder
            .add(this.camera.position, "z")
            .name("camera.z")
            .listen()
            .decimals(2)
            .disable();
        folder
            .add(this.sphere.material.uniforms.uStrength, "value")
            .name("uStrength")
            .listen()
            .decimals(2)
            .disable();
        folder
            .add(this.sphere.material.uniforms.uFrequency.value, "x")
            .name("uFrequency.x")
            .listen()
            .decimals(2)
            .disable();
        folder
            .add(this.sphere.material.uniforms.uFrequency.value, "y")
            .name("uFrequency.y")
            .listen()
            .decimals(2)
            .disable();
    }

    _onResize() {
        // 1. Update Camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.camera.position.z = this.settings.camera.baseZoom;

        // 2. Update Renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Best practice
    }

    _addEventListeners() {
        window.addEventListener("mousemove", (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener("resize", this._onResize.bind(this));
    }

    _startAnimationLoop() {
        requestAnimationFrame(this._update.bind(this));
    }

    _update() {
        this.stats.begin();

        this._updateCamera();
        this._updateUniforms();

        this.renderer.render(this.scene, this.camera);

        this.stats.end();
        requestAnimationFrame(this._update.bind(this));
    }

    _updateCamera() {
        if (!this.settings.effects.cameraMovement) return;
        this.cameraTarget.x = this.mouse.x * this.settings.camera.peekAmount;
        this.cameraTarget.y = this.mouse.y * this.settings.camera.peekAmount;
        this.cameraTarget.z =
            this.settings.camera.baseZoom -
            this.mouse.length() * this.settings.camera.zoomIntensity;
        this.camera.position.lerp(this.cameraTarget, this.settings.camera.ease);
        this.camera.lookAt(this.scene.position);
    }

    _updateUniforms() {
        // Create a local alias for cleaner and more direct access.
        const uniforms = this.sphere.material.uniforms;

        // 1. Update time-based uniforms
        uniforms.uTime.value = this.clock.getElapsedTime();

        // 2. Update uniforms directly from settings (now includes mouse effect)
        // This ensures that any changes in the settings object, whether from the GUI
        // or from code, are reflected in the shader on every frame.
        uniforms.uMouseStrength.value = this.settings.mouseEffect.strength;
        uniforms.uMouseRadius.value = this.settings.mouseEffect.radius;

        // 3. Update uniforms animated by scroll progress
        if (window.__LENIS__) {
            const scrollProgress = window.__LENIS__.progress;
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

            uniforms.uStrength.value = MathUtils.lerp(
                uniforms.uStrength.value,
                targetStrength,
                settings.ease,
            );
            uniforms.uFrequency.value.x = MathUtils.lerp(
                uniforms.uFrequency.value.x,
                targetFrequencyX,
                settings.ease,
            );
            uniforms.uFrequency.value.y = MathUtils.lerp(
                uniforms.uFrequency.value.y,
                targetFrequencyY,
                settings.ease,
            );
        }

        // 4. Update uniforms based on live mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.raycaster.ray.intersectPlane(
            this.intersectionPlane,
            this.mousePosition3D,
        );
        uniforms.uMousePosition.value.copy(this.mousePosition3D);
    }
}
