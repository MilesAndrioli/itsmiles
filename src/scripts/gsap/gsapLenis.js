import "lenis/dist/lenis.css";
import Lenis from "lenis";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- PRESET 0 ---
// const LENIS_OPTIONS = {
//     lerp: 0.08,
//     lerp: 0.05, // more friction/heavier momentum
//     wheelMultiplier: 0.9,
// };

// --- HEAVY CINEMATIC + ---
// const LENIS_OPTIONS = {
//     duration: 1.4,
//     easing: (t) => 1 - Math.pow(1 - t, 4), // easeOutQuart
//     wheelMultiplier: 0.95,
// };

// --- HEAVY CINEMATIC - ---
const LENIS_OPTIONS = {
    easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
};

export default function initGsapLenis() {
    window.__LENIS__ = new Lenis(LENIS_OPTIONS);

    // --- GSAP x Lenis Integration ---
    window.__LENIS__.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
        window.__LENIS__.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}
