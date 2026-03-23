import { gsap } from "gsap";

const DURATION = 0.6;

const curtain = document.createElement("div");
curtain.id = "barba-curtain";
curtain.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:var(--color-iron-950);pointer-events:none;visibility:hidden;";
document.body.appendChild(curtain);

// Curtain covers in from the left, Barba swaps <main>, curtain covers out right.
export default function coverTransition(name) {
    return {
        name,

        leave() {
            gsap.set(curtain, { xPercent: -100, visibility: "visible" });

            return gsap.to(curtain, {
                xPercent: 0,
                duration: DURATION,
            });
        },

        after() {
            return gsap.to(curtain, {
                xPercent: 100,
                duration: DURATION,
                onComplete: () => gsap.set(curtain, { visibility: "hidden" }),
            });
        },
    };
}
