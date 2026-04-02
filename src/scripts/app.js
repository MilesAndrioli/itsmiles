/* +-----------------------------------------+
|                IMPORTS AREA                |
+-----------------------------------------+ */

// --- Utilities ---
import debounce from "lodash.debounce";
import getDimensions from "./utilities/getDimensions";
import dismissLoader from "./utilities/dismissLoader";
import getStickyElements from "./utilities/getStickyElements";
import shuffleHover from "./utilities/shuffleHover";

// --- GSAP ---
import gsapConfig from "./gsap/gsapConfig";
import gsapLenis from "./gsap/gsapLenis";
import gsapParallax from "./gsap/gsapParallax";
import gsapAos from "./gsap/gsapAos";
import gsapReveal from "./gsap/gsapReveal";
import gsapProgressButton from "./gsap/gsapProgressButton";
import initGsapScrollState from "./gsap/gsapScrollState";

// --- barba.js ---
import barba from "@barba/core";
import barbaConfig from "./barba/barbaConfig";
import {
    syncProceduralVoid,
    syncAsciiRenderer,
    teardown,
    resetScroll,
} from "./barba/barbaLifecycle";

/* +-----------------------------------------+
|                SETUP AREA                  |
+-----------------------------------------+ */

function initSetup() {
    getDimensions("#app-header", "height");

    gsapParallax();
    initGsapScrollState();
    gsapAos();
    gsapReveal();
    gsapProgressButton();
    shuffleHover();
    getStickyElements();
}

/* +-----------------------------------------+
|                EVENTS AREA                 |
+-----------------------------------------+ */

// --- READY ---
function runOnReady() {
    syncProceduralVoid();
    gsapLenis();
    barbaConfig();
}
document.addEventListener("DOMContentLoaded", runOnReady, { once: true });

// --- LOAD ---
function runOnLoad() {
    gsapConfig();
    initSetup();
    syncAsciiRenderer();
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

barba.hooks.enter((data) => {
    syncProceduralVoid(data.next.container);
    syncAsciiRenderer(data.next.container);
    resetScroll();
    initSetup();
});
