import { gsap } from "gsap";

const DURATION = 0.4;

const overlay = document.createElement("div");
overlay.id = "barba-overlay";
overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:var(--color-iron-950);pointer-events:none;visibility:hidden;opacity:0;";
document.body.appendChild(overlay);

// Overlay fades to black, Barba swaps <main>, overlay fades out.
export default function fadeTransition(name) {
    return {
        name,

        leave() {
            return gsap.to(overlay, {
                autoAlpha: 1,
                duration: DURATION,
            });
        },

        after() {
            return gsap.to(overlay, {
                autoAlpha: 0,
                duration: DURATION,
            });
        },
    };
}
