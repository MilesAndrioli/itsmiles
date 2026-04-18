import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function lenisConfig() {
    window.LENIS = new Lenis({
        lerp: 0.09, // 0.1
        wheelMultiplier: 1.1, // 1
    });

    window.LENIS.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => window.LENIS.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}
