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
        textMarkers: {
            markBackground: "var(--color-iron-850)",
            markBorderColor: "var(--color-iron-700)",
        },
    },
    defaultProps: {
        wrap: true,
    },
});
