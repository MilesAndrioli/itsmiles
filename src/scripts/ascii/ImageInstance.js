import { processPixels } from "./pipeline.js";
import { resolveCharSet } from "./charsets.js";
import { computeGridDimensions, drawMediaCropped } from "./sizing.js";

export default class ImageInstance {
    constructor(containerEl, settings, charCell, overrides, tweakedKeys) {
        this.container = containerEl;
        this.settings = settings;
        this.charCell = charCell;
        this.overrides = overrides;
        this._tweakedKeys = tweakedKeys;
        this._hasOverrides = Object.keys(overrides).length > 0;
        this.media = containerEl.querySelector("img");
        this.visible = true;

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

        this.pre = document.createElement("pre");
        this.pre.classList.add("Ascii__Pre");
        this.container.appendChild(this.pre);

        this._waitForMedia().then(() => this.render());
    }

    _waitForMedia() {
        if (this.media.complete && this.media.naturalWidth > 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.media.addEventListener("load", resolve, { once: true });
        });
    }

    _getSettings() {
        if (!this._hasOverrides) return this.settings;
        const s = { ...this.settings };
        for (const key of Object.keys(this.overrides)) {
            if (!this._tweakedKeys.has(key)) s[key] = this.overrides[key];
        }
        return s;
    }

    render() {
        if (!this.visible || !this.media.naturalWidth) return;

        const s = this._getSettings();
        const rect = this.container.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const charSet = resolveCharSet(s.charSetPreset, s.charSetCustom);
        const { asciiW, asciiH, fontSize } = computeGridDimensions(
            rect.width, rect.height, s.asciiWidth, s.lineHeight, this.charCell,
        );

        this.canvas.width = asciiW;
        this.canvas.height = asciiH;
        drawMediaCropped(this.ctx, this.media, asciiW, asciiH, rect.width, rect.height);

        const imageData = this.ctx.getImageData(0, 0, asciiW, asciiH);
        this.pre.textContent = processPixels(imageData, s, charSet);

        const st = this.pre.style;
        st.fontSize = `${fontSize}px`;
        st.lineHeight = `${s.lineHeight}`;
        st.opacity = s.asciiOpacity;
        st.color = s.colorMode === "mono" ? s.monoColor : "";
        this.media.style.opacity = s.mediaOpacity;
    }

    destroy() {
        this.pre.remove();
        this.media.style.opacity = "";
    }
}
