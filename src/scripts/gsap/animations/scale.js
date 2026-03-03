export default {
    "scale-in": {
        origin: { scale: 0.75 },
        destination: { scale: 1 },
    },
    "scale-out": {
        origin: { scale: 1.25 },
        destination: { scale: 1 },
    },
    "scale-in-fade-in": {
        origin: {
            scale: 0.75,
            opacity: 0,
        },
        destination: {
            scale: 1,
            opacity: 1,
        },
    },
    "scale-out-fade-in": {
        origin: {
            scale: 1.25,
            opacity: 0,
        },
        destination: {
            scale: 1,
            opacity: 1,
        },
    },
    "scale-out-gray-out": {
        origin: {
            scale: 1.25,
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
