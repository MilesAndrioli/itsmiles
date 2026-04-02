// ──────────────────────────────────────────────
// Pipeline — pure functions, zero DOM deps
// ──────────────────────────────────────────────

const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
];

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

// ── Luminance ────────────────────────────────

function computeLuminanceGrid(data, len, contrast, invert) {
    const grid = new Float32Array(len);
    const factor =
        contrast !== 0
            ? (259 * (contrast + 255)) / (255 * (259 - contrast))
            : 1;

    for (let i = 0; i < len; i++) {
        const off = i * 4;
        let lum = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2];
        if (contrast !== 0) lum = factor * (lum - 128) + 128;
        if (invert) lum = 255 - lum;
        grid[i] = clamp(lum, 0, 255);
    }
    return grid;
}

// ── Dithering ────────────────────────────────

function ditherFloydSteinberg(grid, w, h, nLevels) {
    const out = new Float32Array(grid);
    const step = 255 / (nLevels - 1);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const old = out[idx];
            const quantized = Math.round(old / step) * step;
            out[idx] = quantized;
            const err = old - quantized;
            if (x + 1 < w) out[idx + 1] += err * (7 / 16);
            if (y + 1 < h) {
                if (x - 1 >= 0) out[(y + 1) * w + (x - 1)] += err * (3 / 16);
                out[(y + 1) * w + x] += err * (5 / 16);
                if (x + 1 < w) out[(y + 1) * w + (x + 1)] += err * (1 / 16);
            }
        }
    }
    return out;
}

function ditherAtkinson(grid, w, h, nLevels) {
    const out = new Float32Array(grid);
    const step = 255 / (nLevels - 1);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const old = out[idx];
            const quantized = Math.round(old / step) * step;
            out[idx] = quantized;
            const frac = (old - quantized) / 8;
            if (x + 1 < w) out[idx + 1] += frac;
            if (x + 2 < w) out[idx + 2] += frac;
            if (y + 1 < h) {
                if (x - 1 >= 0) out[(y + 1) * w + (x - 1)] += frac;
                out[(y + 1) * w + x] += frac;
                if (x + 1 < w) out[(y + 1) * w + (x + 1)] += frac;
            }
            if (y + 2 < h) out[(y + 2) * w + x] += frac;
        }
    }
    return out;
}

function ditherNoise(grid, nLevels) {
    const out = new Float32Array(grid.length);
    const spread = 255 / nLevels;
    for (let i = 0; i < grid.length; i++) {
        out[i] = clamp(grid[i] + (Math.random() - 0.5) * spread, 0, 255);
    }
    return out;
}

function ditherOrdered(grid, w, h) {
    const out = new Float32Array(grid.length);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            out[idx] = clamp(grid[idx] + (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * 64, 0, 255);
        }
    }
    return out;
}

function applyDithering(grid, w, h, method, nLevels) {
    switch (method) {
        case "floyd-steinberg": return ditherFloydSteinberg(grid, w, h, nLevels);
        case "atkinson":       return ditherAtkinson(grid, w, h, nLevels);
        case "noise":          return ditherNoise(grid, nLevels);
        case "ordered":        return ditherOrdered(grid, w, h);
        default:               return grid;
    }
}

// ── Character Mapping ────────────────────────

function mapToAscii(grid, charSet, w, h) {
    const n = charSet.length - 1;
    let out = "";
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            out += charSet[Math.round((clamp(grid[y * w + x], 0, 255) / 255) * n)];
        }
        out += "\n";
    }
    return out;
}

// ── Main Entry ───────────────────────────────

export function processPixels(imageData, settings, charSet) {
    const { data, width, height } = imageData;
    const len = width * height;

    let grid = computeLuminanceGrid(data, len, settings.contrast, settings.invert);

    if (settings.ditherEnabled) {
        grid = applyDithering(grid, width, height, settings.ditherMethod, charSet.length);
    }

    return mapToAscii(grid, charSet, width, height);
}
