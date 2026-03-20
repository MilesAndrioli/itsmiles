export default {
    "fade-in": {
        origin: { opacity: 0 },
        destination: { opacity: 1 },
    },
    "fade-in-up": {
        origin: {
            opacity: 0,
            yPercent: 7.5,
        },
        destination: {
            opacity: 1,
            yPercent: 0,
        },
    },
    "fade-in-blur-out": {
        origin: {
            opacity: 0,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            filter: "blur(0px)",
        },
    },
    "fade-in-up-blur-out": {
        origin: {
            opacity: 0,
            yPercent: 7.5,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            yPercent: 0,
            filter: "blur(0px)",
        },
    },
    "fade-in-left-blur-out": {
        origin: {
            opacity: 0,
            x: 16,
            filter: "blur(8px)",
        },
        destination: {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
        },
    },
    "fade-in-grayscale-out": {
        origin: {
            opacity: 0,
            filter: "grayscale(100%)",
        },
        destination: {
            opacity: 1,
            filter: "grayscale(0%)",
        },
    },
    "fade-in-up-grayscale-out": {
        origin: {
            opacity: 0,
            yPercent: 7.5,
            filter: "grayscale(100%)",
        },
        destination: {
            opacity: 1,
            yPercent: 0,
            filter: "grayscale(0%)",
        },
    },
    "fade-in-sepia-out": {
        origin: {
            opacity: 0,
            filter: "sepia(100%)",
        },
        destination: {
            opacity: 1,
            filter: "sepia(0%)",
        },
    },
    "fade-in-up-sepia-out": {
        origin: {
            opacity: 0,
            yPercent: 7.5,
            filter: "sepia(100%)",
        },
        destination: {
            opacity: 1,
            yPercent: 0,
            filter: "sepia(0%)",
        },
    },
};
