import debounce from "lodash.debounce";
import ImageInstance from "./ImageInstance.js";
import VideoInstance from "./VideoInstance.js";
import { measureCharCell } from "./sizing.js";

// ── Overrides parsing ────────────────────────

const ATTR_MAP = {
    width: "asciiWidth",
    lh: "lineHeight",
    contrast: "contrast",
    invert: "invert",
    charset: "charSetPreset",
    fps: "targetFps",
    color: "monoColor",
};

function coerce(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    const n = Number(v);
    return isNaN(n) ? v : n;
}

function parseOverrides(el) {
    const o = {};
    for (const [attr, key] of Object.entries(ATTR_MAP)) {
        const v = el.getAttribute(`data-ascii-${attr}`);
        if (v !== null) o[key] = coerce(v);
    }
    const chars = el.getAttribute("data-ascii-chars");
    if (chars !== null) {
        o.charSetPreset = "manual";
        o.charSetCustom = chars;
    }
    const dither = el.getAttribute("data-ascii-dither");
    if (dither !== null) {
        o.ditherEnabled = true;
        o.ditherMethod = dither;
    }
    return o;
}

// ── Renderer ─────────────────────────────────

export default class AsciiRenderer {
    constructor() {
        this.settings = this._defineSettings();
        this.charCell = measureCharCell();
        this.instances = [];
        this.pane = null;
        this._devToolsActive = false;
        this._renderQueued = false;
        this._tweakedKeys = new Set();

        this._boundKeyDown = (e) => {
            if (e.shiftKey && e.code === "KeyA") this._toggleDevTools();
        };
        this._boundResize = debounce(() => this._renderAll(), 250);

        window.addEventListener("keydown", this._boundKeyDown);
        window.addEventListener("resize", this._boundResize);

        if (new URLSearchParams(location.search).has("devtools")) {
            this._toggleDevTools();
        }
    }

    // ════════════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════════════

    _defineSettings() {
        return {
            asciiWidth: 90,
            lineHeight: 0.9,
            contrast: 160,
            invert: true,
            charSetPreset: "detailed",
            charSetCustom: "",
            ditherEnabled: false,
            ditherMethod: "floyd-steinberg",
            targetFps: 24,
            colorMode: "mono",
            monoColor: "var(--color-ruby)",
            asciiOpacity: 1.0,
            mediaOpacity: 0,
        };
    }

    // ════════════════════════════════════════════
    // INSTANCE MANAGEMENT
    // ════════════════════════════════════════════

    discover(scope = document) {
        for (const inst of this.instances) inst.destroy();
        this.instances = [];

        for (const el of scope.querySelectorAll("[data-ascii]")) {
            const overrides = parseOverrides(el);
            const Instance = el.querySelector("video")
                ? VideoInstance
                : ImageInstance;
            this.instances.push(
                new Instance(
                    el,
                    this.settings,
                    this.charCell,
                    overrides,
                    this._tweakedKeys,
                ),
            );
        }

        this._setupVisibilityObserver();
    }

    _setupVisibilityObserver() {
        this._observer?.disconnect();
        this._observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const inst = this.instances.find(
                        (i) => i.container === entry.target,
                    );
                    if (inst) inst.visible = entry.isIntersecting;
                }
            },
            { rootMargin: "100px" },
        );
        for (const inst of this.instances) {
            this._observer.observe(inst.container);
        }
    }

    // ════════════════════════════════════════════
    // RENDERING
    // ════════════════════════════════════════════

    _renderAll() {
        for (const inst of this.instances) inst.render();
    }

    _queueRender() {
        if (this._renderQueued) return;
        this._renderQueued = true;
        requestAnimationFrame(() => {
            this._renderQueued = false;
            this._renderAll();
        });
    }

    // ════════════════════════════════════════════
    // DEV TOOLING
    // ════════════════════════════════════════════

    async _toggleDevTools() {
        if (this._devToolsActive) {
            this.pane?.dispose();
            this.pane = null;
            document.getElementById("ascii-tweakpane")?.remove();
            this._devToolsActive = false;
            this._tweakedKeys.clear();
            this._queueRender();
            return;
        }

        const { Pane } = await import("tweakpane");
        this.pane = this._createPane(Pane);
        this._devToolsActive = true;
    }

    _createPane(Pane) {
        const container = document.createElement("div");
        container.id = "ascii-tweakpane";
        container.style.cssText =
            "position:fixed;top:8px;right:8px;z-index:1000";
        document.body.appendChild(container);

        const pane = new Pane({
            title: "ASCII Renderer",
            container,
            expanded: false,
        });

        const track =
            (...keys) =>
            () => {
                for (const k of keys) this._tweakedKeys.add(k);
                this._queueRender();
            };

        // --- Resolution ---
        const res = pane.addFolder({ title: "Resolution", expanded: false });
        res.addBinding(this.settings, "asciiWidth", {
            label: "Width (chars)",
            min: 40,
            max: 300,
            step: 1,
        }).on("change", track("asciiWidth"));
        res.addBinding(this.settings, "lineHeight", {
            label: "Line Height",
            min: 0.5,
            max: 2.0,
            step: 0.05,
        }).on("change", track("lineHeight"));
        res.addBinding(this.settings, "targetFps", {
            label: "Video FPS",
            min: 1,
            max: 158,
            step: 1,
        }).on("change", track("targetFps"));

        // --- Image ---
        const img = pane.addFolder({ title: "Image", expanded: false });
        img.addBinding(this.settings, "contrast", {
            label: "Contrast",
            min: -160,
            max: 160,
            step: 1,
        }).on("change", track("contrast"));
        img.addBinding(this.settings, "invert", { label: "Invert" }).on(
            "change",
            track("invert"),
        );

        // --- Characters ---
        const chars = pane.addFolder({ title: "Characters", expanded: false });
        const customBinding = chars.addBinding(this.settings, "charSetCustom", {
            label: "Custom Chars",
        });
        customBinding.hidden = this.settings.charSetPreset !== "manual";
        customBinding.on("change", track("charSetCustom"));

        chars
            .addBinding(this.settings, "charSetPreset", {
                label: "Preset",
                options: {
                    Minimal: "minimal",
                    Standard: "standard",
                    Detailed: "detailed",
                    Blocks: "blocks",
                    Dots: "dots",
                    Retro: "retro",
                    Binary: "binary",
                    Hex: "hex",
                    Manual: "manual",
                },
            })
            .on("change", (ev) => {
                customBinding.hidden = ev.value !== "manual";
                this._tweakedKeys.add("charSetPreset");
                this._queueRender();
            });

        // --- Dithering ---
        const dither = pane.addFolder({ title: "Dithering", expanded: false });
        dither
            .addBinding(this.settings, "ditherEnabled", { label: "Enabled" })
            .on("change", track("ditherEnabled"));
        dither
            .addBinding(this.settings, "ditherMethod", {
                label: "Method",
                options: {
                    "Floyd-Steinberg": "floyd-steinberg",
                    Atkinson: "atkinson",
                    Noise: "noise",
                    Ordered: "ordered",
                },
            })
            .on("change", track("ditherMethod"));

        // --- Display ---
        const display = pane.addFolder({ title: "Display", expanded: false });
        display
            .addBinding(this.settings, "colorMode", {
                label: "Color",
                options: { Mono: "mono", Original: "original" },
            })
            .on("change", track("colorMode"));
        display
            .addBinding(this.settings, "monoColor", { label: "Mono Color" })
            .on("change", track("monoColor"));
        display
            .addBinding(this.settings, "asciiOpacity", {
                label: "ASCII Opacity",
                min: 0,
                max: 1,
                step: 0.05,
            })
            .on("change", track("asciiOpacity"));
        display
            .addBinding(this.settings, "mediaOpacity", {
                label: "Media Opacity",
                min: 0,
                max: 1,
                step: 0.05,
            })
            .on("change", track("mediaOpacity"));

        return pane;
    }

    // ════════════════════════════════════════════
    // LIFECYCLE
    // ════════════════════════════════════════════

    dispose() {
        for (const inst of this.instances) inst.destroy();
        this.instances = [];
        this._observer?.disconnect();
        this.pane?.dispose();
        document.getElementById("ascii-tweakpane")?.remove();
        window.removeEventListener("keydown", this._boundKeyDown);
        window.removeEventListener("resize", this._boundResize);
    }
}
