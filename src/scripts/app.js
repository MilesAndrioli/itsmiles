/* +-----------------------------------------+
|                IMPORTS AREA                |
+-----------------------------------------+ */

// --- Utilities ---
import debounce from "lodash.debounce";
import getDimensions from "./utilities/getDimensions";
import dismissLoader from "./utilities/dismissLoader";
import getStickyElements from "./utilities/getStickyElements";

// --- GSAP ---
import gsapConfig from "./gsap/gsapConfig";
import gsapLenis from "./gsap/gsapLenis";
import gsapParallax from "./gsap/gsapParallax";
import gsapAos from "./gsap/gsapAos";
import gsapReveal from "./gsap/gsapReveal";
import gsapProgressButton from "./gsap/gsapProgressButton";

// --- barba.js ---
import barba from "@barba/core";
import initBarba, { teardown, resetScroll } from "./barba/barbaInit";

// --- Three.js ---
import ProceduralVoid from "./three/ProceduralVoid";
new ProceduralVoid();

/* +-----------------------------------------+
|                SETUP AREA                  |
+-----------------------------------------+ */

function initSetup() {
    getDimensions("#app-header", "height");

    gsapParallax();
    gsapAos();
    gsapReveal();
    gsapProgressButton();
    getStickyElements();
}

/* +-----------------------------------------+
|                EVENTS AREA                 |
+-----------------------------------------+ */

// --- READY ---
function runOnReady() {
    gsapLenis();
    initBarba();
}
document.addEventListener("DOMContentLoaded", runOnReady, { once: true });

// --- LOAD ---
function runOnLoad() {
    gsapConfig();
    initSetup();
    dismissLoader();
}
window.addEventListener("load", runOnLoad, { once: true });

// --- RESIZE ---
function runOnResize() {
    getDimensions("#app-header", "height");
}
window.addEventListener("resize", debounce(runOnResize, 250), { once: false });

// --- BARBA ---
barba.hooks.afterLeave(() => {
    teardown();
});

barba.hooks.enter(() => {
    resetScroll();
    initSetup();
});
