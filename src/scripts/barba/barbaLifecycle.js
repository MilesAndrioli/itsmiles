import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProceduralVoid from "../three/ProceduralVoid/ProceduralVoid";
import AsciiRenderer from "../ascii/AsciiRenderer.js";

let proceduralVoid = null;
let gpuBlocked = false;

let asciiRenderer = null;

// Syncs the WebGL shader with the current page.
// `container` defaults to `document` on initial load; during Barba transitions
// it receives `data.next.container` to query the incoming page's DOM
// (both old and new containers coexist mid-transition).
export function syncProceduralVoid(container = document) {
    if (gpuBlocked) return;

    const marker = container.querySelector("[data-procedural-void]");

    // First encounter — check GPU capability before creating the renderer
    if (marker && !proceduralVoid) {
        if (!ProceduralVoid.canRun()) {
            gpuBlocked = true;
            return;
        }
        const preset = marker.dataset.proceduralVoid || undefined;
        proceduralVoid = new ProceduralVoid(preset);
        return;
    }

    if (marker && proceduralVoid) {
        const preset = marker.dataset.proceduralVoid || undefined;
        proceduralVoid.applyPreset(preset);
        proceduralVoid.resume();
    } else if (proceduralVoid) {
        proceduralVoid.pause();
    }
}

export function syncAsciiRenderer(scope = document) {
    if (!asciiRenderer) {
        if (!scope.querySelector("[data-ascii]")) return;
        asciiRenderer = new AsciiRenderer();
    }
    asciiRenderer.discover(scope);
}

export function teardown() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

export function resetScroll() {
    if (window.__LENIS__) {
        window.__LENIS__.scrollTo(0, { immediate: true });
    }
}
