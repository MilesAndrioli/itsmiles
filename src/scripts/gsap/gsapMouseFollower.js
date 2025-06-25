import "mouse-follower/dist/mouse-follower.min.css";

import MouseFollower from "mouse-follower";
import { gsap } from "gsap";

MouseFollower.registerGSAP(gsap);

export default function initGsapMouseFollower() {
    new MouseFollower();
}
