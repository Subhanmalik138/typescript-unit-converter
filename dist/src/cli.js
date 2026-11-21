#!/usr/bin/env node
import { convert, dimensionOf } from "./converter.js";
import { describe, toString } from "./dimension.js";
import { formatConversion, formatDimensions, formatUnitList, listByDimension } from "./formatter.js";
import { parseUnitExpression } from "./parser.js";
import { DuplicateUnitError, UnitRegistry } from "./registry.js";
const VERSION = "1.0.0";
const USAGE = `unit-convert ${VERSION} — convert between units with dimensional analysis

Usage:
  unit-convert convert <value> <from> [to] <to>   Convert a value, e.g. 5 km to mi
  unit-convert list [dimension]                   List known units, optionally filtered
  unit-convert dimensions <expression>            Show the dimension of an expression
  unit-convert --help | --version

Options:
  --define "name = <value> <unit>"   Define a custom unit for this run (repeatable)
  --json                              Print the conversion as JSON
  --precision <n>                     Significant digits in output (default 10)

Unit expressions understand products, quotients and powers:
  km/h, kg*m/s^2, m², (ft*in), "meters per second"

Examples:
  unit-convert convert 5 km to mi
  unit-convert convert 100 "km/h" "m/s"
  unit-convert convert 32 °F to °C
  unit-convert convert 1 "kg*m/s^2" to N
  unit-convert list length
  unit-convert dimensions "kg*m/s^2"
  unit-convert --define "furlong = 201.168 m" convert 2 furlong to km
`;
function parseOptions(args) {
    const options = { defines: [], json: false, precision: 10 };
    const rest = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === undefined)
            break;
        if (arg === "--json") {
            options.json = true;
        }
        else if (arg === "--define") {
            const def = args[++i];
            if (def === undefined)
                throw new Error("--define needs a definition, e.g. --define \"furlong = 201.168 m\"");
            options.defines.push(def);
        }
        else if (arg.startsWith("--define=")) {
            options.defines.push(arg.slice("--define=".length));
        }
        else if (arg === "--precision") {
            const n = Number(args[++i]);
            if (!Number.isInteger(n) || n < 1 || n > 21) {
                throw new Error("--precision must be an integer between 1 and 21");
            }
            options.precision = n;
        }
        else if (arg.startsWith("--precision=")) {
            const n = Number(arg.slice("--precision=".length));
            if (!Number.isInteger(n) || n < 1 || n > 21) {
                throw new Error("--precision must be an integer between 1 and 21");
            }
            options.precision = n;
        }
        else if (arg === "--help" || arg === "-h") {
            rest.push("__help__");
        }
        else if (arg === "--version" || arg === "-v") {
            rest.push("__version__");
        }
        else {
            rest.push(arg);
        }
    }
    return { options, rest };
}
/** Parse `name = <value> <unit-expr>` and register the unit. */
function applyDefine(registry, definition) {
    const match = /^([A-Za-z][A-Za-z0-9_°µΩ²³-]*)\s*=\s*([+-]?[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)\s+(.+)$/.exec(definition.trim());
    if (!match) {
        throw new Error(`--define expects "name = <value> <unit>", e.g. --define "furlong = 201.168 m" (got "${definition}")`);
    }
    const [, symbol, valueText, unitExpr] = match;
    if (symbol === undefined || valueText === undefined || unitExpr === undefined) {
        throw new Error(`--define could not parse "${definition}"`);
    }
    const resolved = parseUnitExpression(unitExpr, registry);
    if (resolved.shift !== 0) {
        throw new Error(`--define cannot build on an affine unit (${unitExpr})`);
    }
    const value = Number(valueText);
    registry.add({
        symbol,
        name: symbol,
        dimension: resolved.dimension,
        factor: value * resolved.factor,
        aliases: [],
    });
}
function buildRegistry(defines) {
    const registry = new UnitRegistry();
    for (const def of defines)
        applyDefine(registry, def);
    return registry;
}
function runConvert(args, options) {
    const [valueText, from, maybeTo, maybeTarget] = args;
    if (valueText === undefined || from === undefined || maybeTo === undefined) {
        console.error("Usage: unit-convert convert <value> <from> [to] <to>");
        return 1;
    }
    const value = Number(valueText);
    if (!Number.isFinite(value)) {
        console.error(`"${valueText}" is not a number`);
        return 1;
    }
    let to;
    if (maybeTo === "to") {
        if (maybeTarget === undefined) {
            console.error("Usage: unit-convert convert <value> <from> to <to>");
            return 1;
        }
        to = maybeTarget;
    }
    else {
        to = maybeTo;
    }
    const registry = buildRegistry(options.defines);
    const result = convert(value, from, to, registry);
    if (options.json) {
        console.log(JSON.stringify({
            value: result.value,
            from: result.from,
            to: result.to,
            result: result.result,
            dimension: toString(result.fromDimension),
        }));
    }
    else {
        console.log(formatConversion(value, from, result.result, to, options.precision));
    }
    return 0;
}
function runList(args, options) {
    const registry = buildRegistry(options.defines);
    if (args.length === 0) {
        console.log(listByDimension(registry));
        return 0;
    }
    const query = args.join(" ").toLowerCase();
    const matches = registry
        .all()
        .filter((def) => describe(def.dimension).toLowerCase().includes(query));
    if (matches.length === 0) {
        console.error(`no units found for dimension "${args.join(" ")}"`);
        return 1;
    }
    console.log(formatUnitList(matches.sort((a, b) => a.symbol.localeCompare(b.symbol))));
    return 0;
}
function runDimensions(args, options) {
    if (args.length === 0) {
        console.error("Usage: unit-convert dimensions <expression>");
        return 1;
    }
    const expression = args.join(" ");
    const registry = buildRegistry(options.defines);
    console.log(formatDimensions(expression, dimensionOf(expression, registry)));
    return 0;
}
export function main(argv) {
    let parsed;
    try {
        parsed = parseOptions(argv);
    }
    catch (err) {
        console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
    }
    const { options, rest } = parsed;
    if (rest.length === 0 || rest[0] === "__help__") {
        console.log(USAGE);
        return 0;
    }
    if (rest[0] === "__version__") {
        console.log(VERSION);
        return 0;
    }
    const [command, ...args] = rest;
    try {
        switch (command) {
            case "convert":
                return runConvert(args, options);
            case "list":
                return runList(args, options);
            case "dimensions":
                return runDimensions(args, options);
            default:
                console.error(`unknown command "${command}"\n\n${USAGE}`);
                return 1;
        }
    }
    catch (err) {
        if (err instanceof DuplicateUnitError) {
            console.error(`error: ${err.message}`);
        }
        else {
            console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return 2;
    }
}
const isMain = process.argv[1]?.endsWith("dist/src/cli.js") === true;
if (isMain) {
    process.exitCode = main(process.argv.slice(2));
}
