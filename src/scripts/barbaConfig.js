import barba from "@barba/core";
import { gsap } from "gsap";

export default function barbaConfig() {
    const defaultTransition = {
        before: () => window.LENIS.stop(),

        enter({ current, next }) {
            gsap.set(current.container, { transformOrigin: "top center" });

            gsap.set(next.container, {
                clipPath: "inset(100% 0% 0% 0%)",
                position: "fixed",
                inset: 0,
                zIndex: 10,
                // willChange: "transform, clip-path"
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    window.LENIS.start();
                    window.LENIS.scrollTo(0, { immediate: true });
                    // window.scrollTo(0, 0);
                    gsap.set(next.container, { clearProps: "all" });
                },
            });

            tl.to(
                current.container,
                { y: "-50vh", opacity: 0.5, scale: 0.8, duration: 1 },
                0,
            ).to(
                next.container,
                { clipPath: "inset(0% 0% 0% 0%)", duration: 1 },
                0,
            );

            return tl;
        },
    };

    barba.init({
        sync: true,
        preventRunning: true,
        transitions: [
            {
                ...defaultTransition,
                name: "async-crossfade",
            },
            {
                ...defaultTransition,
                name: "self",
            },
        ],
    });
}
