// A physical dimension is a vector of exponents over the seven SI base
// quantities: length, mass, time, electric current, temperature, amount of
// substance, luminous intensity. Two quantities can only be converted into
// each other when their dimension vectors are identical — that single rule
// is what makes "5 km to kg" a type error instead of a wrong number.
export type DimensionTuple = readonly [
  length: number,
  mass: number,
  time: number,
  current: number,
  temperature: number,
  amount: number,
  luminous: number,
];

export const DIMENSIONLESS: DimensionTuple = [0, 0, 0, 0, 0, 0, 0];
export const LENGTH: DimensionTuple = [1, 0, 0, 0, 0, 0, 0];
export const MASS: DimensionTuple = [0, 1, 0, 0, 0, 0, 0];
export const TIME: DimensionTuple = [0, 0, 1, 0, 0, 0, 0];
export const CURRENT: DimensionTuple = [0, 0, 0, 1, 0, 0, 0];
export const TEMPERATURE: DimensionTuple = [0, 0, 0, 0, 1, 0, 0];
export const AMOUNT: DimensionTuple = [0, 0, 0, 0, 0, 1, 0];
export const LUMINOUS: DimensionTuple = [0, 0, 0, 0, 0, 0, 1];

const BASE_SYMBOLS = ["L", "M", "T", "I", "Θ", "N", "J"] as const;

export function add(a: DimensionTuple, b: DimensionTuple): DimensionTuple {
  return a.map((v, i) => v + (b[i] ?? 0)) as unknown as DimensionTuple;
}

export function subtract(a: DimensionTuple, b: DimensionTuple): DimensionTuple {
  return a.map((v, i) => v - (b[i] ?? 0)) as unknown as DimensionTuple;
}

export function scale(d: DimensionTuple, exponent: number): DimensionTuple {
  // The `+ 0` normalises -0 to 0: deepStrictEqual distinguishes them.
  return d.map((v) => v * exponent + 0) as unknown as DimensionTuple;
}

export function equals(a: DimensionTuple, b: DimensionTuple): boolean {
  return a.every((v, i) => v === b[i]);
}

export function isDimensionless(d: DimensionTuple): boolean {
  return d.every((v) => v === 0);
}

function superscript(n: number): string {
  const digits: Record<string, string> = {
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
export function toString(d: DimensionTuple): string {
  const parts = d
    .map((exp, i) => (exp === 0 ? null : `${BASE_SYMBOLS[i]}${exp === 1 ? "" : superscript(exp)}`))
    .filter((p): p is string => p !== null);
  return parts.length === 0 ? "1" : parts.join("·");
}

/** Short label for the common dimensions, used by `list`. */
export function describe(d: DimensionTuple): string {
  const known: Array<[DimensionTuple, string]> = [
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
    if (equals(d, dim)) return label;
  }
  return toString(d);
}
