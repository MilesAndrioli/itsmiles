import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

export default function initGsapConfig() {
    gsap.defaults({
        ease: CustomEase.create("cubic", "M0,0 C0.77,0, 0.18,1, 1,1"),
    });

    gsap.config({
        force3D: true,
    });
}
