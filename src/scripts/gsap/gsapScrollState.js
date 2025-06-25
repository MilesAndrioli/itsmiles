import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import throttle from "lodash.throttle";

gsap.registerPlugin(ScrollTrigger);

export default function initGsapScrollState() {
    const root = document.documentElement;
    const main = document.getElementById("app-main");

    // Detect Scroll Milestones
    ScrollTrigger.create({
        trigger: main,
        start: "top top",
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--STEP-1",
        },
        markers: false,
    });

    ScrollTrigger.create({
        trigger: main,
        start: `${innerHeight} top`,
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--STEP-2",
        },
        markers: false,
    });

    ScrollTrigger.create({
        trigger: "#app-footer",
        toggleClass: {
            targets: root,
            className: "HAS-REACHED--FOOTER",
        },
        markers: false,
    });

    // Detect Scroll Direction
    ScrollTrigger.create({
        onUpdate: (self) => {
            root.classList.toggle("SCROLLING--DOWN", self.direction === 1);
            root.classList.toggle("SCROLLING--UP", self.direction === -1);
        },
        markers: false,
    });

    // Detect Scroll Progress
    ScrollTrigger.create({
        onUpdate: throttle(
            (self) => {
                const scrollProgress = Math.round(self.progress * 100);
                root.style.setProperty(
                    "--SCROLL_PROGRESS",
                    `${scrollProgress}`,
                );
            },
            100,
            { leading: true, trailing: true },
        ),
        markers: false,
    });
}
