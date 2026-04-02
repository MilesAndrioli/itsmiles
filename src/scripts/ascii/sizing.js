// ──────────────────────────────────────────────
// Sizing utilities — shared by image & video
// ──────────────────────────────────────────────

/**
 * Measure a monospace character's width and height relative to font-size.
 * Call once and cache — the ratio is constant for a given font.
 */
export function measureCharCell() {
    const span = document.createElement("span");
    span.style.cssText =
        "font-family:monospace;font-size:100px;line-height:1;position:absolute;visibility:hidden;white-space:pre";
    span.textContent = "M";
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    span.remove();
    return {
        wRatio: rect.width / 100, // ~0.6
        hRatio: rect.height / 100, // ~1.0-1.2
    };
}

/**
 * Compute ASCII grid dimensions and font-size from container size.
 * asciiWidth (chars per row) is the user's density control.
 * fontSize is auto-computed so the text exactly fills the container.
 */
export function computeGridDimensions(containerW, containerH, asciiWidth, lineHeight, charCell) {
    const fontSize = containerW / (asciiWidth * charCell.wRatio);
    const cellH = fontSize * charCell.hRatio * lineHeight;
    const asciiH = Math.max(1, Math.round(containerH / cellH));
    return { asciiW: asciiWidth, asciiH, fontSize };
}

/**
 * Replicate CSS object-fit:cover crop for drawImage.
 * Returns the source rectangle {sx, sy, sw, sh} to draw from the media.
 */
export function computeCoverCrop(mediaW, mediaH, containerW, containerH, objectPosition) {
    const containerAspect = containerW / containerH;
    const mediaAspect = mediaW / mediaH;

    let sx, sy, sw, sh;

    if (mediaAspect > containerAspect) {
        // Media is wider — crop sides
        sh = mediaH;
        sw = mediaH * containerAspect;
        sx = (mediaW - sw) * objectPosition.x;
        sy = 0;
    } else {
        // Media is taller — crop top/bottom
        sw = mediaW;
        sh = mediaW / containerAspect;
        sx = 0;
        sy = (mediaH - sh) * objectPosition.y;
    }

    return { sx, sy, sw, sh };
}

/**
 * Parse a CSS object-position value into normalized {x, y} (0-1).
 * Handles keywords (center, top, left, etc.) and percentages.
 */
export function parseObjectPosition(value) {
    const parts = (value || "50% 50%").trim().split(/\s+/);
    return {
        x: _parsePosToken(parts[0] || "50%"),
        y: _parsePosToken(parts[1] || "50%"),
    };
}

function _parsePosToken(v) {
    if (v === "left" || v === "top") return 0;
    if (v === "center") return 0.5;
    if (v === "right" || v === "bottom") return 1;
    if (v.endsWith("%")) return parseFloat(v) / 100;
    return 0.5;
}

/**
 * Draw a media element onto a canvas context, replicating object-fit:cover crop.
 * Falls back to full-frame stretch when object-fit is not 'cover'.
 */
export function drawMediaCropped(ctx, media, asciiW, asciiH, containerW, containerH) {
    const mediaW = media.naturalWidth || media.videoWidth;
    const mediaH = media.naturalHeight || media.videoHeight;

    const style = getComputedStyle(media);

    if (style.objectFit === "cover") {
        const pos = parseObjectPosition(style.objectPosition);
        const crop = computeCoverCrop(mediaW, mediaH, containerW, containerH, pos);
        ctx.drawImage(media, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, asciiW, asciiH);
    } else {
        ctx.drawImage(media, 0, 0, asciiW, asciiH);
    }
}
