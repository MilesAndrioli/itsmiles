export default {
    split: {
        origin: { opacity: 0 },
        destination: { opacity: 1 },
    },
    "split-up": {
        origin: {
            opacity: 0,
            y: "0.5em",
        },
        destination: {
            opacity: 1,
            y: 0,
        },
    },
    "split-down": {
        origin: {
            opacity: 0,
            y: "-0.5em",
        },
        destination: {
            opacity: 1,
            y: 0,
        },
    },
    "split-left": {
        origin: {
            opacity: 0,
            x: "1em",
        },
        destination: {
            opacity: 1,
            x: 0,
        },
    },
    "split-right": {
        origin: {
            opacity: 0,
            x: "-1em",
        },
        destination: {
            opacity: 1,
            x: 0,
        },
    },
    "split-up-clip": {
        origin: {
            opacity: 0,
            y: "1em",
            clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
        },
        destination: {
            opacity: 1,
            y: 0,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
        },
    },
    "split-blur": {
        origin: {
            opacity: 0,
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            filter: "blur(0px)",
        },
    },
    "split-up-blur": {
        origin: {
            opacity: 0,
            y: "0.5em",
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
        },
    },
    "split-left-blur": {
        origin: {
            opacity: 0,
            x: "24",
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
        },
    },
    "split-chromatic": {
        origin: {
            opacity: 0,
            textShadow: `
                rgb(0 0 255 / 60%) -0.4em 0.4em 4px,
                rgb(0 255 255 / 60%) -0.2em 0.2em 4px,
                rgb(255 255 0 / 60%) 0.2em -0.2em 4px,
                rgb(255 0 0 / 60%) 0.4em -0.4em 4px
            `,
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            textShadow: `
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px
            `,
            filter: "blur(0px)",
        },
    },
    "split-up-chromatic": {
        origin: {
            opacity: 0,
            y: "0.5em",
            textShadow: `
                rgb(0 0 255 / 60%) -0.4em 0.4em 4px,
                rgb(0 255 255 / 60%) -0.2em 0.2em 4px,
                rgb(255 255 0 / 60%) 0.2em -0.2em 4px,
                rgb(255 0 0 / 60%) 0.4em -0.4em 4px
            `,
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            y: 0,
            textShadow: `
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px
            `,
            filter: "blur(0px)",
        },
    },
    "split-left-chromatic": {
        origin: {
            opacity: 0,
            x: "1em",
            textShadow: `
                rgb(0 0 255 / 60%) -0.4em 0.4em 4px,
                rgb(0 255 255 / 60%) -0.2em 0.2em 4px,
                rgb(255 255 0 / 60%) 0.2em -0.2em 4px,
                rgb(255 0 0 / 60%) 0.4em -0.4em 4px
            `,
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            x: 0,
            textShadow: `
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px,
                transparent 0em 0em 0px
            `,
            filter: "blur(0px)",
        },
    },
};
