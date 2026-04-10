// @ts-check

import { defineConfig, fontProviders } from "astro/config";
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
    fonts: [
        {
            provider: fontProviders.local(),
            name: "Montreal",
            cssVariable: "--font-montreal",
            options: {
                variants: [
                    {
                        src: ["./src/assets/fonts/Montreal.woff2"],
                        weight: "normal",
                        style: "normal",
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: "Gatwick",
            cssVariable: "--font-gatwick",
            options: {
                variants: [
                    {
                        src: ["./src/assets/fonts/Gatwick.woff2"],
                        weight: "200",
                        style: "normal",
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: "Monument",
            cssVariable: "--font-monument",
            options: {
                variants: [
                    {
                        src: ["./src/assets/fonts/Monument.woff2"],
                        weight: "normal",
                        style: "normal",
                    },
                    {
                        src: ["./src/assets/fonts/Monument-Light.woff2"],
                        weight: "300",
                        style: "normal",
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: "Lisa",
            cssVariable: "--font-lisa",
            options: {
                variants: [
                    {
                        src: ["./src/assets/fonts/Lisa.woff2"],
                        weight: "normal",
                        style: "normal",
                    },
                ],
            },
        },
    ],
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
