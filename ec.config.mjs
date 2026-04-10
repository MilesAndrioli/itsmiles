import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
    themes: ["vitesse-dark"],
    styleOverrides: {
        uiFontFamily: "var(--font-sans)",
        codeFontFamily: "var(--font-mono)",
        frames: {
            frameBoxShadowCssValue: "none",
        },
    },
    defaultProps: {
        wrap: true,
    },
});
