import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function gsapScrollState() {
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
            const direction = root.classList.contains("IsAnchoring")
                ? 1
                : self.direction;

            if (direction !== lastDirection) {
                root.classList.toggle("Scrolling--Down", direction === 1);
                root.classList.toggle("Scrolling--Up", direction === -1);
                lastDirection = direction;
            }
        },
    });
}
