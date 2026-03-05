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
import getStickyElements from "./utilities/getStickyElements";
import debounce from "lodash.debounce";
import throttle from "lodash.throttle";

// --- GSAP ---
import gsapAos from "./gsap/gsapAos";
import gsapConfig from "./gsap/gsapConfig";
import gsapLenis from "./gsap/gsapLenis";
import gsapParallax from "./gsap/gsapParallax";
import gsapScrollState from "./gsap/gsapScrollState";
import gsapReveal from "./gsap/gsapReveal";

// --- Three.js ---
// import ThreeExperience from "./three/ThreeExperience";
// new ThreeExperience();

/* +-----------------------------------------+
|                EVENTS AREA                 |
+-----------------------------------------+ */

// --- READY ---
function runOnReady() {
    // 1
    getDimensions("#app-header", "height");

    // 3
    gsapLenis();
}
document.addEventListener("DOMContentLoaded", runOnReady, { once: true });

// --- LOAD ---
function runOnLoad() {
    // 4
    gsapParallax();

    // 5
    gsapConfig();
    gsapAos();
    gsapReveal();
    // gsapScrollState();

    // 6
    getStickyElements();

    // 7
    // initLoader();
}
window.addEventListener("load", runOnLoad, { once: true });

// --- RESIZE ---
function runOnResize() {
    getDimensions("#app-header", "height");
}
window.addEventListener("resize", debounce(runOnResize, 250), { once: false });

// --- SCROLL ---
// function runOnScroll() {
//     getDimensions("#app-header", "height");
// }
// window.addEventListener(
//     "scroll",
//     throttle(runOnScroll, 1000, { leading: true, trailing: true }),
//     { once: false },
// );
