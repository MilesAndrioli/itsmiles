import barba from "@barba/core";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsapAos from "./gsap/gsapAos";

export default function barbaConfig() {
    const defaultTransition = {
        before() {
            window.LENIS.stop();
            // Matamos los triggers antiguos justo antes de empezar la nueva era
            ScrollTrigger.getAll().forEach((t) => t.kill());
        },

        enter({ current, next }) {
            const scrollY = window.scrollY;

            // 1. BLOQUEO VISUAL
            gsap.set(current.container, {
                position: "fixed",
                top: -scrollY,
                left: 0,
                width: "100%",
                transformOrigin: "top center",
                willChange: "transform, opacity",
            });

            // 2. PREPARACIÓN PÁGINA NUEVA
            gsap.set(next.container, {
                clipPath: "inset(100% 0% 0% 0%)",
                position: "fixed",
                inset: 0,
                zIndex: 10,
                willChange: "clip-path",
            });

            // 3. RESET DE SCROLL
            window.scrollTo(0, 0);
            window.LENIS.scrollTo(0, { immediate: true });

            // 4. INICIALIZACIÓN AOS
            gsapAos(next.container);

            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(next.container, { clearProps: "all" });
                    window.LENIS.start();
                },
            });

            tl.to(
                current.container,
                {
                    y: "-50vh",
                    scale: 0.9,
                    opacity: 0.2,
                    duration: 1,
                },
                0,
            ).to(
                next.container,
                {
                    clipPath: "inset(0% 0% 0% 0%)",
                    duration: 1,
                },
                0,
            );

            return tl;
        },
    };

    barba.hooks.after(() => {
        ScrollTrigger.refresh();
    });

    barba.init({
        sync: true,
        preventRunning: true,
        transitions: [
            { ...defaultTransition, name: "async-crossfade" },
            { ...defaultTransition, name: "self" },
        ],
    });
}
