// @ts-check

import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import yaml from "@rollup/plugin-yaml";
import astroExpressiveCode from "astro-expressive-code";
import mdx from "@astrojs/mdx";
import rehypeExternalLinks from "rehype-external-links";

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss(), yaml()],
    },
    integrations: [astroExpressiveCode(), mdx()],
    markdown: {
        rehypePlugins: [
            [
                rehypeExternalLinks,
                {
                    content: { type: "text", value: " [↗]" },
                    target: "_blank",
                    rel: ["noopener"],
                },
            ],
        ],
    },
});
