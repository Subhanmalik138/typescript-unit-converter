import { equals, toString, type DimensionTuple } from "./dimension.js";
import { parseUnitExpression, type ResolvedUnit } from "./parser.js";
import { type UnitRegistry } from "./registry.js";

export class IncompatibleDimensionsError extends Error {
  constructor(from: DimensionTuple, to: DimensionTuple) {
    super(`cannot convert ${toString(from)} to ${toString(to)}: dimensions do not match`);
    this.name = "IncompatibleDimensionsError";
  }
}

export interface ConversionResult {
  value: number;
  from: string;
  to: string;
  fromDimension: DimensionTuple;
  result: number;
}

/**
 * Convert `value` from the unit expression `from` to the unit expression
 * `to`. Both expressions are resolved to SI base units first; the
 * conversion is then a single scale (and, for affine temperature units,
 * a shift) — there is no per-unit-pair conversion table to maintain.
 */
export function convert(
  value: number,
  from: string,
  to: string,
  registry: UnitRegistry,
): ConversionResult {
  const source = parseUnitExpression(from, registry);
  const target = parseUnitExpression(to, registry);
  return convertResolved(value, from, to, source, target);
}

export function convertResolved(
  value: number,
  from: string,
  to: string,
  source: ResolvedUnit,
  target: ResolvedUnit,
): ConversionResult {
  if (!equals(source.dimension, target.dimension)) {
    throw new IncompatibleDimensionsError(source.dimension, target.dimension);
  }
  // To SI base: base = value * factor + shift. From SI base back out:
  // result = (base - targetShift) / targetFactor.
  const base = value * source.factor + source.shift;
  const result = (base - target.shift) / target.factor;
  return { value, from, to, fromDimension: source.dimension, result };
}

/** The dimension vector of an expression, for `dimensions` / inspection. */
export function dimensionOf(expression: string, registry: UnitRegistry): DimensionTuple {
  return parseUnitExpression(expression, registry).dimension;
}

/** Format a number with up to `precision` significant digits, trimming noise. */
export function formatNumber(value: number, precision = 10): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(precision));
  return String(rounded);
}
