import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function initGsapScrollState() {
    const root = document.documentElement;
    const footer = document.getElementById("app-footer");

    // --- Milestone 1 ---
    ScrollTrigger.create({
        trigger: root,
        start: () => `${window.APP_HEADER_HEIGHT} top`,
        toggleClass: {
            targets: root,
            className: "HasReached--Step1",
        },
        markers: false,
    });

    // --- Milestone 2 ---
    ScrollTrigger.create({
        trigger: root,
        start: `${innerHeight} top`,
        toggleClass: {
            targets: root,
            className: "HasReached--Step2",
        },
        markers: false,
    });

    // --- Milestone Footer ---
    ScrollTrigger.create({
        trigger: footer,
        start: "top bottom",
        toggleClass: {
            targets: root,
            className: "HasReached--Footer",
        },
        markers: false,
    });

    // --- Scroll Direction ---
    let lastDirection = 0;

    ScrollTrigger.create({
        onUpdate: (self) => {
            if (self.direction !== lastDirection) {
                root.classList.toggle("Scrolling--Down", self.direction === 1);
                root.classList.toggle("Scrolling--Up", self.direction === -1);
                lastDirection = self.direction;
            }
        },
    });
}
