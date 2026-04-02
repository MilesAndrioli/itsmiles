// Dense → Sparse (darkest visual weight first, space last)
export const CHAR_SETS = {
    minimal: "@#*+;:. ",
    standard: "@%#*+=-:. ",
    detailed:
        '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ',
    blocks: "\u2588\u2593\u2592\u2591 ",
    dots: "\u25CF\u25C9\u25CE\u25CB\u25CC\u2022\u2219\u00B7. ",
    retro: "\u2588\u2593\u2592\u2591\u256C\u2560\u2563\u2566\u2569\u255D\u2557\u255A\u2554\u253C\u251C\u2524\u2534\u252C#*+:. ",
    binary: "01",
    hex: "0123456789ABCDEF",
};

export function resolveCharSet(presetName, customText) {
    if (presetName === "manual" && customText) return customText;
    return CHAR_SETS[presetName] || CHAR_SETS.standard;
}
