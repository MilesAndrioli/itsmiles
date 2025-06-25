import { createLogger } from "./logger.js";

const isDebugging = false;
const log = createLogger(import.meta.url, isDebugging);

/**
 * Get the specified dimensions (height, width, or both) of the desired selector.
 * @param {string} selector - The selector of the element to measure.
 * @param {string} [dimension='both'] - 'height', 'width', or 'both' to specify which dimensions to get. Defaults to 'both'.
 */
const getDimensions = (selector, dimension = "both") => {
    if (typeof selector !== "string") {
        log(
            `Selector should be a string, but got ${typeof selector}: ${selector}`,
        );
        return;
    }

    const target = document.querySelector(selector);

    if (!target) {
        log(`No element matches the selector ${selector}`);
        return;
    }

    const targetRect = target.getBoundingClientRect();
    const targetName = selector
        .replace(/^[#.]/, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase();

    if (dimension === "height" || dimension === "both") {
        const height = Number(targetRect.height.toFixed(2));

        // Define CSS Global Variable
        document.documentElement.style.setProperty(
            `--${targetName}_HEIGHT`,
            `${height}px`,
        );

        // Define JS Global Variable
        window[`${targetName}_HEIGHT`] = height;

        log(`${selector} height: ${height}px`);
    }

    if (dimension === "width" || dimension === "both") {
        const width = Number(targetRect.width.toFixed(2));

        // Define CSS Global Variable
        document.documentElement.style.setProperty(
            `--${targetName}_WIDTH`,
            `${width}px`,
        );

        // Define JS Global Variable
        window[`${targetName}_WIDTH`] = width;

        log(`${selector} height: ${width}px`);
    }
};

export default getDimensions;
