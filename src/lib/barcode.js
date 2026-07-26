/**
 * Code 128 (subset B) barcode encoding + SVG rendering.
 *
 * Pure functions with no dependencies, so this module is safe to import from
 * both client components (label preview/print) and server routes.
 *
 * Code 128 is used rather than EAN-13 because EAN-13 requires a purchased GS1
 * company prefix; Code 128 is the standard choice for internal retail labels
 * and every consumer barcode scanner reads it.
 */

// Bar/space widths for symbol values 0..106. Each character alternates
// bar, space, bar, space... starting with a bar.
const CODE128_PATTERNS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
    '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
    '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
    '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
    '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
    '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
    '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
    '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
    '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
    '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
    '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
    '211214', '211232', '2331112',
];

const START_B = 104;
const STOP = 106;

/**
 * Returns the sequence of bar/space widths for `text`, or null if the text
 * contains characters outside Code 128 subset B (ASCII 32..126).
 */
export function encodeCode128B(text) {
    const value = String(text || '');
    if (!value) return null;

    const values = [];
    for (const char of value) {
        const code = char.charCodeAt(0);
        if (code < 32 || code > 126) return null;
        values.push(code - 32);
    }

    // Modulo-103 weighted checksum; the start code has weight 1.
    let checksum = START_B;
    values.forEach((v, i) => {
        checksum += v * (i + 1);
    });
    checksum %= 103;

    const symbols = [START_B, ...values, checksum, STOP];
    return symbols.map((s) => CODE128_PATTERNS[s]).join('');
}

/**
 * Renders `text` as a Code 128 barcode SVG string.
 *
 * @param {string} text        value to encode
 * @param {object} [options]
 * @param {number} [options.moduleWidth] width of one narrow bar, in px
 * @param {number} [options.height]      bar height, in px
 * @param {boolean} [options.showText]   render the human-readable value below
 */
export function barcodeToSvg(text, options = {}) {
    const { moduleWidth = 2, height = 60, showText = true } = options;

    const widths = encodeCode128B(text);
    if (!widths) return null;

    // Quiet zone: the spec requires at least 10 narrow modules either side.
    const quietZone = 10 * moduleWidth;
    const barsWidth = [...widths].reduce((sum, w) => sum + Number(w) * moduleWidth, 0);
    const totalWidth = barsWidth + quietZone * 2;
    const textHeight = showText ? 16 : 0;
    const totalHeight = height + textHeight;

    let x = quietZone;
    let isBar = true;
    const rects = [];

    for (const widthChar of widths) {
        const w = Number(widthChar) * moduleWidth;
        if (isBar) {
            rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`);
        }
        x += w;
        isBar = !isBar;
    }

    const label = showText
        ? `<text x="${totalWidth / 2}" y="${height + 13}" text-anchor="middle" ` +
          `font-family="monospace" font-size="12" letter-spacing="1" fill="#000">${escapeXml(text)}</text>`
        : '';

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" ` +
        `viewBox="0 0 ${totalWidth} ${totalHeight}">` +
        `<rect width="${totalWidth}" height="${totalHeight}" fill="#fff"/>` +
        rects.join('') +
        label +
        `</svg>`
    );
}

function escapeXml(value) {
    return String(value).replace(/[<>&"']/g, (c) => (
        { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]
    ));
}

/**
 * Generates a random 12-digit numeric barcode value. Numeric-only keeps the
 * label readable and avoids scanner keyboard-layout issues on wedge scanners.
 * Uniqueness is enforced by the caller against the database.
 */
export function generateBarcodeValue() {
    let digits = '';
    for (let i = 0; i < 12; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    // Avoid a leading zero so the value survives being pasted into spreadsheets.
    if (digits[0] === '0') digits = '1' + digits.slice(1);
    return digits;
}
