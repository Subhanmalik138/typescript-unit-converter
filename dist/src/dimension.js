export const DIMENSIONLESS = [0, 0, 0, 0, 0, 0, 0];
export const LENGTH = [1, 0, 0, 0, 0, 0, 0];
export const MASS = [0, 1, 0, 0, 0, 0, 0];
export const TIME = [0, 0, 1, 0, 0, 0, 0];
export const CURRENT = [0, 0, 0, 1, 0, 0, 0];
export const TEMPERATURE = [0, 0, 0, 0, 1, 0, 0];
export const AMOUNT = [0, 0, 0, 0, 0, 1, 0];
export const LUMINOUS = [0, 0, 0, 0, 0, 0, 1];
const BASE_SYMBOLS = ["L", "M", "T", "I", "Θ", "N", "J"];
export function add(a, b) {
    return a.map((v, i) => v + (b[i] ?? 0));
}
export function subtract(a, b) {
    return a.map((v, i) => v - (b[i] ?? 0));
}
export function scale(d, exponent) {
    // The `+ 0` normalises -0 to 0: deepStrictEqual distinguishes them.
    return d.map((v) => v * exponent + 0);
}
export function equals(a, b) {
    return a.every((v, i) => v === b[i]);
}
export function isDimensionless(d) {
    return d.every((v) => v === 0);
}
function superscript(n) {
    const digits = {
        "-": "⁻",
        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹",
    };
    return String(n)
        .split("")
        .map((ch) => digits[ch] ?? ch)
        .join("");
}
/** Human-readable form, e.g. `L·M·T⁻²` for force or `1` for dimensionless. */
export function toString(d) {
    const parts = d
        .map((exp, i) => (exp === 0 ? null : `${BASE_SYMBOLS[i]}${exp === 1 ? "" : superscript(exp)}`))
        .filter((p) => p !== null);
    return parts.length === 0 ? "1" : parts.join("·");
}
/** Short label for the common dimensions, used by `list`. */
export function describe(d) {
    const known = [
        [LENGTH, "length"],
        [MASS, "mass"],
        [TIME, "time"],
        [CURRENT, "electric current"],
        [TEMPERATURE, "temperature"],
        [AMOUNT, "amount of substance"],
        [LUMINOUS, "luminous intensity"],
        [add(LENGTH, scale(TIME, -1)), "speed"],
        [scale(LENGTH, 2), "area"],
        [scale(LENGTH, 3), "volume"],
        [add(MASS, add(LENGTH, scale(TIME, -2))), "force"],
        [add(MASS, add(scale(LENGTH, -1), scale(TIME, -2))), "pressure"],
        [add(MASS, add(scale(LENGTH, 2), scale(TIME, -2))), "energy"],
        [add(MASS, add(scale(LENGTH, 2), scale(TIME, -3))), "power"],
        [scale(TIME, -1), "frequency"],
        [add(MASS, add(scale(LENGTH, 2), add(scale(TIME, -3), scale(CURRENT, -1)))), "voltage"],
    ];
    for (const [dim, label] of known) {
        if (equals(d, dim))
            return label;
    }
    return toString(d);
}
