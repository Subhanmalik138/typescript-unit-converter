import { describe, toString, type DimensionTuple } from "./dimension.js";
import { type UnitDefinition, type UnitRegistry } from "./registry.js";

export function formatConversion(
  value: number,
  from: string,
  result: number,
  to: string,
  precision: number,
): string {
  return `${formatValue(value, precision)} ${from} = ${formatValue(result, precision)} ${to}`;
}

export function formatValue(value: number, precision = 10): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return "0";
  return String(Number(value.toPrecision(precision)));
}

/** One line per unit: `km  kilometre  length  ×1000 m`. */
export function formatUnitList(defs: UnitDefinition[]): string {
  const symbolWidth = Math.max(...defs.map((d) => d.symbol.length));
  return defs
    .map((d) => {
      const symbol = d.symbol.padEnd(symbolWidth);
      const dimension = describe(d.dimension);
      const base = d.shift !== undefined && d.shift !== 0 ? "affine (offset)" : `×${d.factor} base`;
      return `${symbol}  ${d.name}  (${dimension}, ${base})`;
    })
    .join("\n");
}

export function formatDimensions(expression: string, dimension: DimensionTuple): string {
  return `${expression}: ${toString(dimension)} (${describe(dimension)})`;
}

/** Group all registered units by their dimension for `list`. */
export function listByDimension(registry: UnitRegistry): string {
  const groups = new Map<string, UnitDefinition[]>();
  for (const def of registry.all()) {
    const key = describe(def.dimension);
    const group = groups.get(key);
    if (group) group.push(def);
    else groups.set(key, [def]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dimension, defs]) => {
      const sorted = [...defs].sort((a, b) => a.symbol.localeCompare(b.symbol));
      return `## ${dimension}\n${formatUnitList(sorted)}`;
    })
    .join("\n\n");
}
