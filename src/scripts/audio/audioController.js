const FADE_DURATION = 1;
const VOLUME = 0.3;
const STORAGE_KEY = "audioMuted";

export default class AudioController {
    constructor(audioEl, waveform) {
        this.audioEl = audioEl;
        this.waveform = waveform;
        this.ctx = null;
        this.gain = null;
        this.activated = false;
        this.muted = false;
    }

    get isActivated() {
        return this.activated;
    }

    get isMuted() {
        return this.muted;
    }

    static wasMuted() {
        return localStorage.getItem(STORAGE_KEY) === "true";
    }

    activate() {
        if (this.activated) return;
        this.activated = true;

        this.ctx = new AudioContext();
        const source = this.ctx.createMediaElementSource(this.audioEl);
        this.gain = this.ctx.createGain();
        source.connect(this.gain);
        this.gain.connect(this.ctx.destination);

        this.gain.gain.value = 0;
        this.ctx.resume();
        this.audioEl.play();

        this._fadeTo(VOLUME);
        this.waveform.setPlaying(true);
    }

    toggle() {
        if (!this.activated) return;
        this.muted ? this.unmute() : this.mute();
    }

    mute() {
        if (this.muted) return;
        this.muted = true;
        localStorage.setItem(STORAGE_KEY, "true");
        this.waveform.setPlaying(false);

        this._fadeTo(0, () => {
            this.audioEl.pause();
        });
    }

    unmute() {
        if (!this.muted) return;
        this.muted = false;
        localStorage.removeItem(STORAGE_KEY);

        this.ctx.resume();
        this.audioEl.play();
        this._fadeTo(VOLUME);
        this.waveform.setPlaying(true);
    }

    _fadeTo(target, onComplete) {
        clearTimeout(this._fadeTimer);

        const now = this.ctx.currentTime;
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(target, now + FADE_DURATION);

        if (onComplete) {
            this._fadeTimer = setTimeout(onComplete, FADE_DURATION * 1000);
        }
    }
}
