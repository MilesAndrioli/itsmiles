import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProceduralVoid from "../three/ProceduralVoid/ProceduralVoid";

let proceduralVoid = null;

// Syncs the WebGL shader with the current page.
// `container` defaults to `document` on initial load; during Barba transitions
// it receives `data.next.container` to query the incoming page's DOM
// (both old and new containers coexist mid-transition).
export function syncProceduralVoid(container = document) {
    const marker = container.querySelector("[data-procedural-void]");

    if (marker) {
        // Empty string → undefined so applyPreset falls back to base defaults
        const preset = marker.dataset.proceduralVoid || undefined;
        if (!proceduralVoid) {
            proceduralVoid = new ProceduralVoid(preset);
        } else {
            proceduralVoid.applyPreset(preset);
            proceduralVoid.resume();
        }
    } else if (proceduralVoid) {
        // Page doesn't want the shader — pause instead of destroying the context
        proceduralVoid.pause();
    }
}

export function teardown() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

export function resetScroll() {
    if (window.__LENIS__) {
        window.__LENIS__.scrollTo(0, { immediate: true });
    }
}
