export default {
    fade: {
        origin: { opacity: 0 },
        destination: { opacity: 1 },
    },
    "fade-up": {
        origin: {
            opacity: 0,
            y: 20,
        },
        destination: {
            opacity: 1,
            y: 0,
        },
    },
    "fade-blur": {
        origin: {
            opacity: 0,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            filter: "blur(0px)",
        },
    },
    "fade-up-blur": {
        origin: {
            opacity: 0,
            y: 20,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
        },
    },
    "fade-left-blur": {
        origin: {
            opacity: 0,
            x: 20,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
        },
    },
    "fade-grayscale": {
        origin: {
            opacity: 0,
            filter: "grayscale(100%)",
        },
        destination: {
            opacity: 1,
            filter: "grayscale(0%)",
        },
    },
    "fade-up-gray": {
        origin: {
            opacity: 0,
            y: 20,
            filter: "grayscale(100%)",
        },
        destination: {
            opacity: 1,
            y: 0,
            filter: "grayscale(0%)",
        },
    },
    "fade-sepia": {
        origin: {
            opacity: 0,
            filter: "sepia(100%)",
        },
        destination: {
            opacity: 1,
            filter: "sepia(0%)",
        },
    },
    "fade-up-sepia": {
        origin: {
            opacity: 0,
            y: 20,
            filter: "sepia(100%)",
        },
        destination: {
            opacity: 1,
            y: 0,
            filter: "sepia(0%)",
        },
    },
};
