import barba from "@barba/core";
import barbaPrefetch from "@barba/prefetch";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import fadeTransition from "./animations/fade";
// import slideTransition from "./animations/slide";

export default function initBarba() {
    // Prefetch links as they enter the viewport (IntersectionObserver).
    // Complements Barba's built-in hover/touchstart prefetch.
    barba.use(barbaPrefetch);

    barba.init({
        preventRunning: true,
        transitions: [fadeTransition("fade"), fadeTransition("self")],
    });
}

export function teardown() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

export function resetScroll() {
    if (window.__LENIS__) {
        window.__LENIS__.scrollTo(0, { immediate: true });
    }
}
