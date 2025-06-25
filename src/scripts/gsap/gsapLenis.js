import "lenis/dist/lenis.css";
import Lenis from "lenis";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function initGsapLenis() {
    window.__LENIS__ = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 0.9,
    });

    // --- GSAP x Lenis Integration ---
    window.__LENIS__.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
        window.__LENIS__.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}
