import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function initGsapScrollState() {
    const root = document.documentElement;
    const main = document.getElementById("app-main");
    const footer = document.getElementById("app-footer");

    // --- Milestone 1 ---
    ScrollTrigger.create({
        trigger: main,
        start: "top top",
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--STEP-1",
        },
        markers: false,
    });

    // --- Milestone 2 ---
    ScrollTrigger.create({
        trigger: root,
        start: `${innerHeight} top`,
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--STEP-2",
        },
        markers: false,
    });

    // --- Milestone Footer ---
    ScrollTrigger.create({
        trigger: footer,
        start: "top bottom",
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--FOOTER",
        },
        markers: false,
    });

    // --- Scroll Direction ---
    let lastDirection = 0;

    ScrollTrigger.create({
        onUpdate: (self) => {
            if (self.direction !== lastDirection) {
                root.classList.toggle("SCROLLING--DOWN", self.direction === 1);
                root.classList.toggle("SCROLLING--UP", self.direction === -1);
                lastDirection = self.direction;
            }
        },
    });

    // --- Scroll Progress ---
    // BECAREFUL: HUGE PERFORMANCE IMPACT, REVISIT
    // if (window.__LENIS__) {
    //     window.__LENIS__.on("scroll", ({ progress }) => {
    //         root.style.setProperty("--SCROLL_PROGRESS", progress.toFixed(4));
    //     });
    // }
}
