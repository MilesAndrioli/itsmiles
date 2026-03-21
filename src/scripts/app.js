/* +-----------------------------------------+
|                GLOBALS AREA                |
+-----------------------------------------+ */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

window.__MNK__ = !ScrollTrigger.isTouch;
window.__TOUCH__ = !!ScrollTrigger.isTouch;

/* +-----------------------------------------+
|                IMPORTS AREA                |
+-----------------------------------------+ */

// --- Utilities ---
import getDimensions from "./utilities/getDimensions";
import dismissLoader from "./utilities/dismissLoader";
import getStickyElements from "./utilities/getStickyElements";
import debounce from "lodash.debounce";

// --- GSAP ---
import gsapAos from "./gsap/gsapAos";
import gsapConfig from "./gsap/gsapConfig";
import gsapLenis from "./gsap/gsapLenis";
import gsapParallax from "./gsap/gsapParallax";
import gsapReveal from "./gsap/gsapReveal";

// --- Three.js ---
import ProceduralVoid from "./three/ProceduralVoid";
new ProceduralVoid();

/* +-----------------------------------------+
|                EVENTS AREA                 |
+-----------------------------------------+ */

// --- READY ---
function runOnReady() {
    getDimensions("#app-header", "height");

    gsapLenis();
}
document.addEventListener("DOMContentLoaded", runOnReady, { once: true });

// --- LOAD ---
function runOnLoad() {
    gsapParallax();

    gsapConfig();
    gsapAos();
    gsapReveal();

    getStickyElements();

    dismissLoader();
}
window.addEventListener("load", runOnLoad, { once: true });

// --- RESIZE ---
function runOnResize() {
    getDimensions("#app-header", "height");
}
window.addEventListener("resize", debounce(runOnResize, 250), { once: false });
