import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function initGsapUnveil() {
    function gsapUnveil(unveilWrapper) {
        const unveilTarget = unveilWrapper.querySelector(
            "[data-unveil-target]",
        );
        if (!unveilTarget) return;

        gsap.set(unveilWrapper, { overflow: "hidden" });
        gsap.set(unveilTarget, { yPercent: -100 });

        const reveal = gsap.timeline({ paused: true });

        reveal.to(unveilTarget, {
            yPercent: 0,
            ease: "none",
        });

        ScrollTrigger.create({
            markers: false,

            animation: reveal,
            scrub: true,

            trigger: unveilWrapper,
            start: "top bottom",
            end: () => `+=${unveilWrapper.offsetHeight}`,
        });
    }

    gsap.utils
        .toArray("[data-unveil-wrapper]")
        .forEach((unveilWrapper) => gsapUnveil(unveilWrapper));
}
