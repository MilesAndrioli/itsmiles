import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

export default function initGsapParallax() {
    ScrollSmoother.create({
        smooth: 0,
        effects: true,
    });

    // requestAnimationFrame(() => {
    //     ScrollTrigger.refresh(true);
    // });
}
