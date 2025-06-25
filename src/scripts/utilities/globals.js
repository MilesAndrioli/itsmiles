import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

window.MNK = !ScrollTrigger.isTouch;
window.TOUCH = !!ScrollTrigger.isTouch;

window.DEBUG = import.meta.env.MODE === "development";
window.DEBUG_STYLE =
    "border: 1px solid #555; margin-block: .5rem; padding: .5rem; border-radius: 0.375rem; background-color: #111;";

/**
 * Creates a logging function.
 * @param {boolean} isDebugging - The local debug switch for a specific file.
 * @returns {Function} A new log function specific to that file.
 */
window.LOGGER = function (isDebugging) {
    return (message, ...args) => {
        if (window.DEBUG && isDebugging) {
            console.log(`%c${message}`, window.DEBUG_STYLE, ...args);
        }
    };
};
