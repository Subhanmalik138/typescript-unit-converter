# unit-converter

A zero-dependency TypeScript CLI that converts between units the way a physicist would: every unit is reduced to a **dimension vector** over the seven SI base quantities plus a scale factor against SI base units, and a conversion is only legal when the two dimension vectors are identical. `5 km to kg` is a type error, not a wrong number.

## Why this exists

Most unit converters are lookup tables: one entry per pair of units, which grows quadratically and silently breaks the moment you need a unit the author didn't foresee (`kg*m/s^2`). This one has a single rule instead — resolve each side to SI base, then convert through base — so any *expression* of units works: `km/h`, `kg*m/s^2`, `m²`, `(ft*in)`, `meters per second`.

## Design decisions

1. **Dimensions as vectors, not strings.** A dimension is a 7-tuple of exponents `[L, M, T, I, Θ, N, J]`. Multiplying units adds vectors, dividing subtracts them, raising to a power scales them. Compatibility is a vector equality check, which makes the "can these convert?" question exact.
2. **Affine units are first-class, not special-cased.** Celsius and Fahrenheit convert to kelvin as `base = value * factor + shift`. The shift lives on the *resolved expression*, so `°C` converts correctly while `°C/m` is rejected — an affine unit can never appear inside a compound expression, because the result would be meaningless.
3. **One registry, no pair table.** ~100 built-in units (length, mass, time, temperature, volume, area, speed, force, pressure, energy, power, frequency, angle, electric, data) each carry one factor against SI base. Named derived units (`N`, `Pa`, `kWh`, `mph`) are just registry entries, and the parser agrees with them: `N` and `kg*m/s^2` resolve identically.
4. **A real expression parser.** A small recursive-descent parser handles products, quotients, integer powers (including `s^-1` and superscripts like `m²`), parentheses, implicit multiplication (`kg m`), the word `per`, and multi-word aliases (`nautical mile`, `meters per second`).
5. **Custom units without recompiling.** `--define "furlong = 201.168 m"` registers a unit for the run, resolved through the same parser, so custom units compose with everything else.

## Usage

```bash
npm install
npm run build

# Basic conversion ("to" is optional)
node dist/src/cli.js convert 5 km to mi
# 5 km = 3.106855961 mi

node dist/src/cli.js convert 100 "km/h" "m/s"
# 100 km/h = 27.77777778 m/s

# Temperature uses the affine shift, not just a scale
node dist/src/cli.js convert 32 °F to °C
# 32 °F = 0 °C

# Compound expressions and named derived units agree
node dist/src/cli.js convert 1 "kg*m/s^2" to N
# 1 kg*m/s^2 = 1 N

# Inspect what an expression means
node dist/src/cli.js dimensions "kg*m/s^2"
# kg*m/s^2: L·M·T⁻² (force)

# Browse the registry
node dist/src/cli.js list length
node dist/src/cli.js list

# Machine-readable output and precision control
node dist/src/cli.js convert 5 km mi --json
# {"value":5,"from":"km","to":"mi","result":3.1068559611866697,"dimension":"L"}

node dist/src/cli.js convert 1 km mi --precision 4
# 1 km = 0.6214 mi

# Define a custom unit for the run
node dist/src/cli.js --define "furlong = 201.168 m" convert 2 furlong to km
# 2 furlong = 0.402336 km
```

Errors are explicit and exit non-zero: unknown units, incompatible dimensions (`5 km to kg`), malformed expressions, and affine units in compound expressions all explain themselves.

## Library use

The converter is usable as a library too:

```typescript
import { convert, UnitRegistry } from "typescript-unit-converter";

const registry = new UnitRegistry();
convert(100, "°C", "°F", registry).result; // 212
```

## Tests

```bash
npm test   # tsc build + node:test, 40+ tests across dimension, registry, parser, converter and CLI
```

Tests cover exact conversion constants (mile, gallon, atmosphere, horsepower, light-year), the affine temperature round-trips, parser edge cases (superscripts, negative exponents, `per`, implicit multiplication), and CLI behaviour including JSON output and `--define`.

## Tech stack

- **TypeScript** (strict mode, `NodeNext` modules), zero runtime dependencies
- **node:test** + `node:assert/strict` for tests
- Node.js ≥ 22.6
