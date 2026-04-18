import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function initGsapReveal() {
    function gsapReveal(revealWrapper) {
        const revealTarget = revealWrapper.querySelector(
            "[data-reveal-target]",
        );
        if (!revealTarget) return;

        gsap.set(revealWrapper, { overflow: "hidden" });
        gsap.set(revealTarget, { yPercent: -100 });

        const reveal = gsap.timeline({ paused: true });

        reveal.to(revealTarget, {
            yPercent: 0,
            ease: "none",
        });

        ScrollTrigger.create({
            markers: false,

            animation: reveal,
            scrub: true,

            trigger: revealWrapper,
            start: "top bottom",
            end: () => `+=${revealWrapper.offsetHeight}`,
        });
    }

    gsap.utils
        .toArray("[data-reveal-wrapper]")
        .forEach((revealWrapper) => gsapReveal(revealWrapper));
}
