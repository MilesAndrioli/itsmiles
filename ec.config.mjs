import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
    themes: ["vitesse-dark"],
    styleOverrides: {
        uiFontFamily: "var(--font-sans)",
        codeFontFamily: "var(--font-mono)",
        frames: {
            frameBoxShadowCssValue: "none",
            tooltipSuccessBackground: "var(--color-iron-950)",
            tooltipSuccessForeground: "var(--color-iron-400)",
        },
    },
    defaultProps: {
        wrap: true,
    },
});
