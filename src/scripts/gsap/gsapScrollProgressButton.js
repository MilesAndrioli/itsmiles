import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function gsapScrollProgressButton() {
    document.querySelectorAll(".ScrollProgressButton").forEach((button) => {
        const fill = button.querySelector(".ScrollProgressButton__Fill");
        const icon = button.querySelector(".ScrollProgressButton__Icon");
        const text = button.querySelector(".ScrollProgressButton__Text");

        const tl = gsap.timeline({
            paused: true,
            defaults: { ease: "none" },
        });

        tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1 }, 0);
        tl.fromTo(icon, { rotation: 0 }, { rotation: -360 }, 0);
        tl.fromTo(text, { rotation: 0 }, { rotation: 360 }, 0);

        ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            animation: tl,
            scrub: true,
        });

        // Bump button above footer as it enters the viewport
        const footer = document.getElementById("app-footer");

        if (footer) {
            gsap.to(button, {
                y: -footer.offsetHeight,
                ease: "none",
                scrollTrigger: {
                    trigger: footer,
                    start: "top bottom",
                    end: "bottom bottom",
                    scrub: true,
                },
            });
        }
    });
}
