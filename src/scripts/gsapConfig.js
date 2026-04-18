import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);

export default function gsapConfig() {
    gsap.defaults({
        ease: CustomEase.create("cubic", "M0,0 C0.77,0, 0.18,1, 1,1"),
    });

    gsap.config({
        force3D: true,
    });
}
