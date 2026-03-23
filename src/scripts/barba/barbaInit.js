import barba from "@barba/core";
import barbaPrefetch from "@barba/prefetch";

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
