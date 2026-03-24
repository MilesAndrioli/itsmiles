import barba from "@barba/core";
import barbaPrefetch from "@barba/prefetch";
import fadeTransition from "./animations/fade";

export default function barbaConfig() {
    barba.use(barbaPrefetch);

    barba.init({
        preventRunning: true,
        transitions: [fadeTransition("fade"), fadeTransition("self")],
    });
}
