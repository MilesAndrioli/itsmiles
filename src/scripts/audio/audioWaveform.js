const BARS = 8;
const BAR_WIDTH = 1;
const GAP = 2;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 0.7;
const PHASE_OFFSET = 0.8;
const SPEED = 3;
const LERP_SPEED = 3;

export default class AudioWaveform {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.playing = false;
        this.amplitude = 0;
        this.time = 0;
        this.lastFrame = 0;
        this.raf = null;

        this._setupDpi();
        this.color = getComputedStyle(canvas).color;
        this._draw(0);
    }

    _setupDpi() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.cssW = rect.width;
        this.cssH = rect.height;
        this.canvas.width = this.cssW * dpr;
        this.canvas.height = this.cssH * dpr;
        this.ctx.scale(dpr, dpr);
    }

    setPlaying(playing) {
        this.playing = playing;
        if (!this.raf) {
            this.lastFrame = performance.now();
            this._loop();
        }
    }

    _loop() {
        this.raf = requestAnimationFrame((now) => {
            const dt = (now - this.lastFrame) / 1000;
            this.lastFrame = now;

            const target = this.playing ? 1 : 0;
            this.amplitude +=
                (target - this.amplitude) * Math.min(dt * LERP_SPEED, 1);

            this.time += dt;
            this._draw(this.amplitude);

            const settled = !this.playing && Math.abs(this.amplitude) < 0.001;
            if (settled) {
                this.amplitude = 0;
                this._draw(0);
                this.raf = null;
                return;
            }

            this._loop();
        });
    }

    _draw(amplitude) {
        const { ctx, cssW, cssH } = this;

        ctx.clearRect(0, 0, cssW, cssH);
        ctx.fillStyle = this.color;

        const totalW = BARS * BAR_WIDTH + (BARS - 1) * GAP;
        const startX = (cssW - totalW) / 2;

        for (let i = 0; i < BARS; i++) {
            const sine =
                (Math.sin(this.time * SPEED + i * PHASE_OFFSET) + 1) / 2;
            const range = MAX_HEIGHT - MIN_HEIGHT;
            const h = (MIN_HEIGHT + range * sine * amplitude) * cssH;
            const x = startX + i * (BAR_WIDTH + GAP);
            const y = cssH - h;

            ctx.beginPath();
            ctx.roundRect(x, y, BAR_WIDTH, h, BAR_WIDTH / 2);
            ctx.fill();
        }
    }
}
