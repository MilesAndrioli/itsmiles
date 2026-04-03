import { processPixels } from "./pipeline.js";
import { resolveCharSet } from "./charsets.js";
import { computeGridDimensions, drawMediaCropped } from "./sizing.js";

export default class VideoInstance {
    constructor(containerEl, settings, charCell, overrides, tweakedKeys) {
        this.container = containerEl;
        this.settings = settings;
        this.charCell = charCell;
        this.overrides = overrides;
        this._tweakedKeys = tweakedKeys;
        this._hasOverrides = Object.keys(overrides).length > 0;
        this.media = containerEl.querySelector("video");
        this.visible = true;
        this._rafId = null;
        this._lastFrameTime = 0;

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

        this.pre = document.createElement("pre");
        this.pre.classList.add("Ascii__Pre");
        this.container.appendChild(this.pre);

        this._onPlay = () => this._startLoop();
        this._onPause = () => this._stopLoop();

        // this._onClickMedia = () => {
        //     this.media.paused ? this.media.play() : this.media.pause();
        // };

        this.media.addEventListener("play", this._onPlay);
        this.media.addEventListener("pause", this._onPause);
        this.media.addEventListener("ended", this._onPause);
        this.media.addEventListener("click", this._onClickMedia);

        if (!this.media.paused) {
            this._waitForMedia().then(() => this._startLoop());
        } else if (this.media.hasAttribute("autoplay")) {
            this.media.play().catch(() => {});
        }
    }

    _waitForMedia() {
        if (this.media.readyState >= 2 && this.media.videoWidth > 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.media.addEventListener("loadeddata", resolve, { once: true });
        });
    }

    _startLoop() {
        if (this._rafId) return;
        this._waitForMedia().then(() => {
            this._lastFrameTime = 0;
            const loop = (now) => {
                this._rafId = requestAnimationFrame(loop);
                const interval = 1000 / this._getSettings().targetFps;
                if (now - this._lastFrameTime < interval) return;
                this._lastFrameTime = now;
                if (this.visible) this.render();
            };
            this._rafId = requestAnimationFrame(loop);
        });
    }

    _stopLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
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
        if (!this.media.videoWidth) return;

        const s = this._getSettings();
        const rect = this.container.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const charSet = resolveCharSet(s.charSetPreset, s.charSetCustom);
        const { asciiW, asciiH, fontSize } = computeGridDimensions(
            rect.width,
            rect.height,
            s.asciiWidth,
            s.lineHeight,
            this.charCell,
        );

        this.canvas.width = asciiW;
        this.canvas.height = asciiH;
        drawMediaCropped(
            this.ctx,
            this.media,
            asciiW,
            asciiH,
            rect.width,
            rect.height,
        );

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
        this._stopLoop();
        this.pre.remove();
        this.media.style.opacity = "";
        this.media.removeEventListener("play", this._onPlay);
        this.media.removeEventListener("pause", this._onPause);
        this.media.removeEventListener("ended", this._onPause);
        this.media.removeEventListener("click", this._onClickMedia);
    }
}
