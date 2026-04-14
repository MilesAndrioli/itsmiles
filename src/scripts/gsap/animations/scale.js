export default {
    "scale-in": {
        origin: { scale: 0.85 },
        destination: { scale: 1 },
    },
    "scale-out": {
        origin: { scale: 1.15 },
        destination: { scale: 1 },
    },
    "scale-in-fade": {
        origin: {
            scale: 0.85,
            opacity: 0,
        },
        destination: {
            scale: 1,
            opacity: 1,
        },
    },
    "scale-out-fade": {
        origin: {
            scale: 1.15,
            opacity: 0,
        },
        destination: {
            scale: 1,
            opacity: 1,
        },
    },
    "scale-out-gray": {
        origin: {
            scale: 1.15,
            filter: "grayscale(1)",
        },
        destination: {
            scale: 1,
            filter: "grayscale(0)",
        },
    },
    "scale-x": {
        origin: {
            scaleX: 0,
            opacity: 0,
        },
        destination: {
            scaleX: 1,
            opacity: 1,
        },
    },
};
