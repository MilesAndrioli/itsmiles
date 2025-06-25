import { createLogger } from "../utilities/logger";

const isDebugging = true;
const log = createLogger(import.meta.url, isDebugging);

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import gsapAnimations from "./animations/index";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Initializes scroll-based animations on elements with data-aos attributes.
 */
export default function initGsapAos() {
    const namedTimelines = new Map();
    const msToSec = (ms) => parseFloat(ms) / 1000;

    /**
     * Retrieves animation settings for an element from its data attributes.
     * @param {HTMLElement} el - The DOM element.
     * @returns {object} An object containing animation settings.
     */
    function getSettings(el) {
        const dataset = el.dataset;
        const isAfter = "aosAfter" in dataset;

        return {
            start: dataset.aosStart || (isAfter ? "center 8%" : "top bottom"),
            end: dataset.aosEnd || (isAfter ? "bottom 8%" : "top center"),

            duration: msToSec(dataset.aosDuration || 600),
            delay: msToSec(dataset.aosDelay || 0),
            ease: dataset.aosEase,

            once: "aosOnce" in dataset,
            scrub: "aosScrub" in dataset,

            debug: "aosDebug" in dataset,
            debugId: dataset.aosDebug,

            staggerGap: msToSec(dataset.aosStaggerGap || 280),

            splitDuration: msToSec(
                dataset.aosSplitDuration || dataset.aosStaggerGap || 280,
            ),
            splitGap: msToSec(dataset.aosSplitGap), // If undefined, amount will be used for stagger
            splitFrom: dataset.aosSplitFrom, // "start", "center", "end", "random"
            splitType: dataset.aosSplit || "words", // "chars", "words", "lines"
        };
    }

    /**
     * Creates a ScrollTrigger configuration object.
     * @param {HTMLElement[]} elements - The DOM elements to be animated.
     * @param {HTMLElement} trigger - The DOM element that triggers the animation.
     * @param {object} settings - Animation settings.
     * @returns {object} A ScrollTrigger configuration object.
     */
    function createScrollTriggerConfig(elements, trigger, settings) {
        return {
            trigger: trigger,
            start: settings.start,
            end: settings.end,
            toggleActions: settings.once
                ? "play none none none"
                : "play none none reset",
            once: settings.once,
            scrub: settings.scrub,
            markers: settings.debug,
            id: settings.debugId,
            toggleClass: { targets: elements, className: "aos-active" },
            onEnter: () =>
                elements.forEach((el) => el.classList.add("aos-engaged")),
            onLeave: () =>
                elements.forEach((el) => el.classList.add("aos-finished")),
            onEnterBack: () =>
                elements.forEach((el) => el.classList.remove("aos-finished")),
            onLeaveBack: () =>
                elements.forEach((el) => el.classList.remove("aos-engaged")),
        };
    }

    /**
     * Gets the animation key for an element, considering group or individual settings.
     * @param {HTMLElement} childEl - The child element.
     * @param {string} groupAnimationName - The animation name defined for the group.
     * @returns {string} The animation key.
     */
    function getAnimationKey(childEl, groupAnimationName) {
        return (
            childEl.dataset.aosChild ||
            groupAnimationName ||
            childEl.dataset.aos
        );
    }

    /**
     * Animates text using GSAP's SplitText plugin.
     * @param {HTMLElement} childEl - The element containing the text to split and animate.
     * @param {object} originProps - GSAP properties for the initial state.
     * @param {object} destinationProps - GSAP properties for the final state.
     * @param {object} settings - General animation settings.
     * @param {gsap.core.Timeline} timeline - The GSAP timeline.
     * @param {number} indexInTimeline - The index for staggering in the timeline.
     */
    function animateSplitText(
        childEl,
        originProps,
        destinationProps,
        settings,
        timeline,
        indexInTimeline,
    ) {
        const splitType =
            typeof TOUCH !== "undefined" &&
            TOUCH &&
            childEl.dataset.aosSplit === "chars" // Assuming TOUCH is a global variable
                ? "words"
                : childEl.dataset.aosSplit || settings.splitType;

        const split = new SplitText(childEl, { type: splitType });
        const splitTargets = split[splitType];

        gsap.set(splitTargets, originProps);

        const staggerOptions = {
            from: childEl.dataset.aosSplitFrom || settings.splitFrom,
        };

        if (childEl.dataset.aosSplitGap || settings.splitGap) {
            staggerOptions.each = msToSec(
                childEl.dataset.aosSplitGap || settings.splitGap * 1000,
            );
        } else {
            staggerOptions.amount = msToSec(
                childEl.dataset.aosSplitDuration ||
                    settings.splitDuration * 1000,
            );
        }

        timeline.to(
            splitTargets,
            {
                ...destinationProps,
                duration: settings.duration,
                delay: settings.delay,
                ease: settings.ease,
                stagger: staggerOptions,
            },
            indexInTimeline * settings.staggerGap,
        );
    }

    /**
     * Applies a simple GSAP animation to an element.
     * @param {HTMLElement} childEl - The element to animate.
     * @param {object} originProps - GSAP properties for the initial state.
     * @param {object} destinationProps - GSAP properties for the final state.
     * @param {object} settings - General animation settings.
     * @param {gsap.core.Timeline} timeline - The GSAP timeline.
     * @param {number} indexInTimeline - The index for staggering in the timeline.
     */
    function animateSimple(
        childEl,
        originProps,
        destinationProps,
        settings,
        timeline,
        indexInTimeline,
    ) {
        gsap.set(childEl, originProps);

        timeline.to(
            childEl,
            {
                ...destinationProps,
                duration: settings.duration,
                delay: settings.delay,
                ease: settings.ease,
            },
            indexInTimeline * settings.staggerGap,
        );
    }

    /**
     * Determines which elements inside a container should be animated.
     * @param {HTMLElement} container - The main element (`[data-aos]` or `[data-aos-group]`).
     * @param {boolean} isGroup - True if the container is a group.
     * @returns {HTMLElement[]} An array of elements to be animated.
     */
    function getAnimationTargets(container, isGroup) {
        if (!isGroup) {
            return [container];
        }
        const children = container.querySelectorAll("[data-aos-child]");
        return children.length > 0
            ? Array.from(children)
            : Array.from(container.children);
    }

    /**
     * Adds a single animation to the timeline for a given child element.
     * @param {object} context - An object containing all necessary data.
     */
    function applyAnimation(context) {
        const { child, index, timeline, settings, groupAnimationName } =
            context;

        const animationName = getAnimationKey(child, groupAnimationName);
        if (!gsapAnimations[animationName]) return;

        gsap.set(child, { willChange: "transform" });

        const animationDef = gsapAnimations[animationName];
        const isReversed = child.dataset.aosAfter !== undefined;

        const fromVars = isReversed
            ? animationDef.destination
            : animationDef.origin;
        const toVars = isReversed
            ? animationDef.origin
            : animationDef.destination;

        if (animationName.includes("split")) {
            animateSplitText(
                child,
                fromVars,
                toVars,
                settings,
                timeline,
                index,
            );
        } else {
            animateSimple(child, fromVars, toVars, settings, timeline, index);
        }
    }

    /**
     * Processes a single `[data-aos]` or `[data-aos-group]` element,
     * creates its timeline, and populates it with animations.
     * @param {HTMLElement} animationContainer - The main element that triggers the animation.
     */
    function processAnimationElement(animationContainer) {
        // 1. Gather information
        const settings = getSettings(animationContainer);
        const isGroup = "aosGroup" in animationContainer.dataset;
        const groupAnimationName = animationContainer.dataset.aosGroup;

        // 2. Validate if we should proceed
        if (!isGroup && !gsapAnimations[animationContainer.dataset.aos]) return;

        // 3. Find the actual elements to animate
        const targets = getAnimationTargets(animationContainer, isGroup);

        // 4. Create the master timeline for this container
        const timeline = gsap.timeline({
            scrollTrigger: createScrollTriggerConfig(
                targets,
                animationContainer,
                settings,
            ),
        });

        // 5. If the animation has a name, save it for the debug triggers.
        if (animationContainer.dataset.aosName) {
            namedTimelines.set(animationContainer.dataset.aosName, timeline);
        }

        // 6. Add each child's animation to the timeline
        targets.forEach((child, index) => {
            applyAnimation({
                child,
                index,
                timeline,
                settings,
                groupAnimationName,
            });
        });
    }

    /**
     * Sets up click handlers on `[data-aos-trigger]` elements to restart animations.
     * @param {Map<string, gsap.core.Timeline>} timelines - The map of named timelines.
     */
    function setupDebugTriggers(timelines) {
        const triggerButtons = document.querySelectorAll("[data-aos-trigger]");
        if (triggerButtons.length === 0) return;

        log("Animation debugging triggers enabled.");

        triggerButtons.forEach((button) => {
            const targetName = button.dataset.aosTrigger;
            const targetTimeline = timelines.get(targetName);

            if (targetTimeline) {
                button.addEventListener("click", () => {
                    log(`Restarting animation: "${targetName}"`);
                    targetTimeline.restart();
                });
                log(`Button linked to animation: "${targetName}"`);
            } else {
                log(
                    `Warning: Trigger button for "${targetName}" found no matching animation. Check data-aos-name.`,
                );
            }
        });
    }

    // Initialize animations for all relevant elements on the page.
    document
        .querySelectorAll("[data-aos], [data-aos-group]")
        .forEach(processAnimationElement);

    if (isDebugging) setupDebugTriggers(namedTimelines);
}
