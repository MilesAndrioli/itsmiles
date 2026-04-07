/*  ┌─────────────────────────────────────────────────────────────┐
    │  Shuffle Hover — data-hover-shuffle                         │
    │                                                             │
    │  On mouseenter the link's own characters are rapidly        │
    │  rearranged (anagram-style), then resolve left-to-right     │
    │  back to the original text. Element width is locked during  │
    │  the animation to prevent kerning-driven layout shift.      │
    │                                                             │
    │  Two phases:                                                │
    │    1. Chaos  — full Fisher-Yates shuffles of every char     │
    │    2. Resolve — characters lock into place one by one       │
    │               from left to right while the rest shuffle     │
    │                                                             │
    │  On mouseleave the text snaps back to the original.         │
    │  Zero dependencies — vanilla JS + requestAnimationFrame.    │
    └─────────────────────────────────────────────────────────────┘

    USAGE
    ─────────────────────────────────────────────────────────────────
    data-hover-shuffle          → uses "default" preset
    data-hover-shuffle="glitch" → uses the "glitch" preset

    TUNING GUIDE — all values are in animation frames (1 frame ≈ 16ms at 60fps).
    ─────────────────────────────────────────────────────────────────────────────
    shuffleSpeed   — frames to skip between each shuffle update.
                     Higher = slower, calmer.  Lower = frenetic.
                     1 → every frame (~60 shuffles/sec)
                     3 → every 3rd frame (~20 shuffles/sec)

    shuffleCount   — how many full shuffles play before the resolve wave starts.
                     Higher = longer chaos.  Lower = quicker settle.
                     At speed 3 → 6 shuffles ≈ 290ms of chaos.

    resolveSpeed   — frames between each character locking into its final position.
                     Higher = slower, more dramatic reveal wave.
                     At speed 3, an 8-char word resolves in ~400ms.           */

const PRESETS = {
    default: { shuffleSpeed: 4, shuffleCount: 2, resolveSpeed: 7 },
    glitch: { shuffleSpeed: 2, shuffleCount: 10, resolveSpeed: 1 },
};

// Tracks elements that already have listeners bound.
// WeakSet so barba-destroyed elements are garbage-collected.
const bound = new WeakSet();

// In-place Fisher-Yates shuffle. Mutates and returns `arr`.
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Stops any running animation and restores the original text.
function stop(el) {
    if (!el._shuffleRaf) return;
    cancelAnimationFrame(el._shuffleRaf);
    el._shuffleRaf = null;
    el.textContent = el._shuffleOriginal;
    el.style.width = "";
}

function startShuffle(el) {
    stop(el);

    const original = el._shuffleOriginal;
    const config = el._shuffleConfig;
    const chars = original.split("");

    // Lock width to prevent kerning-driven layout shift
    el.style.width = el.offsetWidth + "px";

    let frame = 0;
    let iterations = 0;
    let locked = 0;
    let resolving = false;

    function tick() {
        frame++;

        // — Chaos phase: full-word anagram shuffle every N frames
        if (!resolving) {
            if (frame % config.shuffleSpeed === 0) {
                el.textContent = shuffle([...chars]).join("");
                if (++iterations >= config.shuffleCount) resolving = true;
            }
        }
        // — Resolve phase: lock one char from the left per interval
        else if (frame % config.resolveSpeed === 0) {
            if (++locked >= chars.length) {
                stop(el);
                return;
            }
            el.textContent =
                original.slice(0, locked) +
                shuffle(chars.slice(locked)).join("");
        }

        el._shuffleRaf = requestAnimationFrame(tick);
    }

    el._shuffleRaf = requestAnimationFrame(tick);
}

export default function shuffleHover() {
    document.querySelectorAll("[data-hover-shuffle]").forEach((el) => {
        if (bound.has(el)) return;
        bound.add(el);

        el._shuffleOriginal = el.textContent.trim();
        el._shuffleConfig =
            PRESETS[el.dataset.hoverShuffle || "default"] || PRESETS.default;
        el.addEventListener("mouseenter", (e) => startShuffle(e.currentTarget));
        el.addEventListener("mouseleave", (e) => stop(e.currentTarget));
    });
}
