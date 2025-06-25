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
    "split-clip-up": {
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
            letterSpacing: "0.25em",
            filter: "blur(6px)",
        },
        destination: {
            opacity: 1,
            letterSpacing: "0em",
            filter: "blur(0px)",
        },
    },
    "split-blur-up": {
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
    "split-blur-left": {
        origin: {
            opacity: 0,
            x: "1em",
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
                rgb(0 0 255 / 60%) -0.3em 0.3em 2px, 
                rgb(0 255 255 / 60%) -0.15em 0.15em 2px, 
                rgb(255 255 0 / 60%) 0.15em -0.15em 2px, 
                rgb(255 0 0 / 60%) 0.3em -0.3em 2px
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
    "split-chromatic-up": {
        origin: {
            opacity: 0,
            y: "0.2em",
            textShadow: `
                rgb(0 0 255 / 60%) -0.3em 0.3em 2px, 
                rgb(0 255 255 / 60%) -0.15em 0.15em 2px, 
                rgb(255 255 0 / 60%) 0.15em -0.15em 2px, 
                rgb(255 0 0 / 60%) 0.3em -0.3em 2px
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
};
