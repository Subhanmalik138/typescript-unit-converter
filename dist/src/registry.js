import { AMOUNT, CURRENT, DIMENSIONLESS, LENGTH, LUMINOUS, MASS, TEMPERATURE, TIME, add, equals, scale, } from "./dimension.js";
const L = LENGTH;
const M = MASS;
const T = TIME;
const I = CURRENT;
const TH = TEMPERATURE;
const N = AMOUNT;
const J = LUMINOUS;
const SPEED = add(L, scale(T, -1));
const AREA = scale(L, 2);
const VOLUME = scale(L, 3);
const FORCE = add(M, add(L, scale(T, -2)));
const PRESSURE = add(M, add(scale(L, -1), scale(T, -2)));
const ENERGY = add(M, add(scale(L, 2), scale(T, -2)));
const POWER = add(M, add(scale(L, 2), scale(T, -3)));
const FREQUENCY = scale(T, -1);
const VOLTAGE = add(M, add(scale(L, 2), add(scale(T, -3), scale(I, -1))));
const RESISTANCE = add(M, add(scale(L, 2), add(scale(T, -3), scale(I, -2))));
const CHARGE = add(I, T);
function u(symbol, name, dimension, factor, extra = {}) {
    return { symbol, name, dimension, factor, ...extra };
}
/** The built-in registry. Every factor is relative to SI base units. */
export const BUILTIN_UNITS = [
    // Length
    u("m", "metre", L, 1, { aliases: ["meter", "meters", "metres"] }),
    u("km", "kilometre", L, 1e3, { aliases: ["kilometer", "kilometers", "kilometres"] }),
    u("cm", "centimetre", L, 1e-2, { aliases: ["centimeter", "centimeters", "centimetres"] }),
    u("mm", "millimetre", L, 1e-3, { aliases: ["millimeter", "millimeters", "millimetres"] }),
    u("µm", "micrometre", L, 1e-6, { aliases: ["um", "micrometer", "micrometers", "micrometres"] }),
    u("nm", "nanometre", L, 1e-9, { aliases: ["nanometer", "nanometers", "nanometres"] }),
    u("mi", "mile", L, 1609.344, { aliases: ["miles"] }),
    u("yd", "yard", L, 0.9144, { aliases: ["yards"] }),
    u("ft", "foot", L, 0.3048, { aliases: ["feet"] }),
    u("in", "inch", L, 0.0254, { aliases: ["inches"] }),
    u("nmi", "nautical mile", L, 1852, { aliases: ["nautical miles"] }),
    u("ly", "light-year", L, 9460730472580800, { aliases: ["lightyear", "lightyears", "light-years"] }),
    u("au", "astronomical unit", L, 149597870700, { aliases: ["astronomical units"] }),
    u("pc", "parsec", L, 3.0856775814913673e16, { aliases: ["parsecs"] }),
    // Mass
    u("kg", "kilogram", M, 1, { aliases: ["kilograms"] }),
    u("g", "gram", M, 1e-3, { aliases: ["grams", "gramme", "grammes"] }),
    u("mg", "milligram", M, 1e-6, { aliases: ["milligrams"] }),
    u("t", "tonne", M, 1e3, { aliases: ["tonnes", "metric ton", "metric tons"] }),
    u("lb", "pound", M, 0.45359237, { aliases: ["lbs", "pounds"] }),
    u("oz", "ounce", M, 0.028349523125, { aliases: ["ounces"] }),
    u("st", "stone", M, 6.35029318, { aliases: ["stones"] }),
    // Time
    u("s", "second", T, 1, { aliases: ["sec", "secs", "seconds"] }),
    u("ms", "millisecond", T, 1e-3, { aliases: ["milliseconds"] }),
    u("µs", "microsecond", T, 1e-6, { aliases: ["us", "microseconds"] }),
    u("ns", "nanosecond", T, 1e-9, { aliases: ["nanoseconds"] }),
    u("min", "minute", T, 60, { aliases: ["minutes"] }),
    u("h", "hour", T, 3600, { aliases: ["hr", "hrs", "hours"] }),
    u("day", "day", T, 86400, { aliases: ["days"] }),
    u("week", "week", T, 604800, { aliases: ["weeks"] }),
    u("yr", "year", T, 31557600, { aliases: ["years"] }),
    // Temperature (affine units: shift is in kelvin)
    u("K", "kelvin", TH, 1, { aliases: ["kelvins"] }),
    u("°C", "degree Celsius", TH, 1, { shift: 273.15, aliases: ["celsius", "degC", "°c"] }),
    u("°F", "degree Fahrenheit", TH, 5 / 9, {
        shift: 255.3722222222222,
        aliases: ["fahrenheit", "degF"],
    }),
    u("°R", "degree Rankine", TH, 5 / 9, { aliases: ["rankine", "degR"] }),
    // Volume
    u("m³", "cubic metre", VOLUME, 1, { aliases: ["cubic meter", "cubic meters", "cubic metres"] }),
    u("L", "litre", VOLUME, 1e-3, { aliases: ["l", "liter", "liters", "litres"] }),
    u("mL", "millilitre", VOLUME, 1e-6, { aliases: ["ml", "milliliter", "milliliters", "millilitres"] }),
    u("gal", "gallon (US)", VOLUME, 0.003785411784, { aliases: ["gallons", "gallon"] }),
    u("qt", "quart (US)", VOLUME, 0.003785411784 / 4, { aliases: ["quarts", "quart"] }),
    u("pt", "pint (US)", VOLUME, 0.003785411784 / 8, { aliases: ["pints", "pint"] }),
    u("cup", "cup (US)", VOLUME, 0.003785411784 / 16, { aliases: ["cups"] }),
    u("floz", "fluid ounce (US)", VOLUME, 0.003785411784 / 128, { aliases: ["fl oz", "fluid ounces"] }),
    // Area
    u("m²", "square metre", AREA, 1, { aliases: ["square meter", "square meters", "square metres"] }),
    u("ha", "hectare", AREA, 1e4, { aliases: ["hectares"] }),
    u("acre", "acre", AREA, 4046.8564224, { aliases: ["acres"] }),
    // Speed
    u("m/s", "metre per second", SPEED, 1, { aliases: ["meters per second", "metres per second"] }),
    u("km/h", "kilometre per hour", SPEED, 1 / 3.6, { aliases: ["kph"] }),
    u("mph", "mile per hour", SPEED, 0.44704, { aliases: ["miles per hour"] }),
    u("kn", "knot", SPEED, 0.5144444444444445, { aliases: ["knots", "kt"] }),
    // Force
    u("N", "newton", FORCE, 1, { aliases: ["newtons"] }),
    u("lbf", "pound-force", FORCE, 4.4482216152605, { aliases: ["pounds-force"] }),
    u("dyn", "dyne", FORCE, 1e-5, { aliases: ["dynes"] }),
    // Pressure
    u("Pa", "pascal", PRESSURE, 1, { aliases: ["pascals"] }),
    u("kPa", "kilopascal", PRESSURE, 1e3, { aliases: ["kilopascals"] }),
    u("bar", "bar", PRESSURE, 1e5, { aliases: ["bars"] }),
    u("atm", "atmosphere", PRESSURE, 101325, { aliases: ["atmospheres"] }),
    u("psi", "pound per square inch", PRESSURE, 6894.757293168, { aliases: ["pounds per square inch"] }),
    u("mmHg", "millimetre of mercury", PRESSURE, 133.322387415, { aliases: ["torr"] }),
    // Energy
    u("J", "joule", ENERGY, 1, { aliases: ["joules"] }),
    u("kJ", "kilojoule", ENERGY, 1e3, { aliases: ["kilojoules"] }),
    u("cal", "calorie", ENERGY, 4.184, { aliases: ["calories"] }),
    u("kcal", "kilocalorie", ENERGY, 4184, { aliases: ["kilocalories"] }),
    u("kWh", "kilowatt-hour", ENERGY, 3.6e6, { aliases: ["kilowatt-hours"] }),
    u("eV", "electronvolt", ENERGY, 1.602176634e-19, { aliases: ["electronvolts"] }),
    // Power
    u("W", "watt", POWER, 1, { aliases: ["watts"] }),
    u("kW", "kilowatt", POWER, 1e3, { aliases: ["kilowatts"] }),
    u("hp", "horsepower", POWER, 745.699872, { aliases: ["horsepowers"] }),
    // Frequency
    u("Hz", "hertz", FREQUENCY, 1, { aliases: ["hertz"] }),
    u("kHz", "kilohertz", FREQUENCY, 1e3, { aliases: ["kilohertz"] }),
    u("MHz", "megahertz", FREQUENCY, 1e6, { aliases: ["megahertz"] }),
    u("rpm", "revolutions per minute", FREQUENCY, 1 / 60, { aliases: ["revolutions per minute"] }),
    // Angle (dimensionless in SI)
    u("rad", "radian", DIMENSIONLESS, 1, { aliases: ["radians"] }),
    u("deg", "degree", DIMENSIONLESS, Math.PI / 180, { aliases: ["degrees", "°"] }),
    u("turn", "turn", DIMENSIONLESS, 2 * Math.PI, { aliases: ["turns", "rev", "revolution", "revolutions"] }),
    u("grad", "gradian", DIMENSIONLESS, Math.PI / 200, { aliases: ["gradians", "gon"] }),
    // Electric
    u("A", "ampere", I, 1, { aliases: ["amp", "amps", "amperes"] }),
    u("mA", "milliampere", I, 1e-3, { aliases: ["milliamps", "milliamperes"] }),
    u("V", "volt", VOLTAGE, 1, { aliases: ["volts"] }),
    u("Ω", "ohm", RESISTANCE, 1, { aliases: ["ohm", "ohms"] }),
    u("C", "coulomb", CHARGE, 1, { aliases: ["coulombs"] }),
    // Amount of substance
    u("mol", "mole", N, 1, { aliases: ["moles"] }),
    u("mmol", "millimole", N, 1e-3, { aliases: ["millimoles"] }),
    // Luminous intensity
    u("cd", "candela", J, 1, { aliases: ["candelas"] }),
    // Data (dimensionless in SI; the byte is the reference unit)
    u("B", "byte", DIMENSIONLESS, 1, { aliases: ["bytes"] }),
    u("bit", "bit", DIMENSIONLESS, 0.125, { aliases: ["bits"] }),
    u("KB", "kilobyte", DIMENSIONLESS, 1e3, { aliases: ["kilobytes"] }),
    u("MB", "megabyte", DIMENSIONLESS, 1e6, { aliases: ["megabytes"] }),
    u("GB", "gigabyte", DIMENSIONLESS, 1e9, { aliases: ["gigabytes"] }),
    u("TB", "terabyte", DIMENSIONLESS, 1e12, { aliases: ["terabytes"] }),
    u("KiB", "kibibyte", DIMENSIONLESS, 1024, { aliases: ["kibibytes"] }),
    u("MiB", "mebibyte", DIMENSIONLESS, 1024 ** 2, { aliases: ["mebibytes"] }),
    u("GiB", "gibibyte", DIMENSIONLESS, 1024 ** 3, { aliases: ["gibibytes"] }),
];
export class UnknownUnitError extends Error {
    constructor(unit) {
        super(`unknown unit: "${unit}"`);
        this.name = "UnknownUnitError";
    }
}
export class DuplicateUnitError extends Error {
    constructor(unit) {
        super(`unit "${unit}" is already defined`);
        this.name = "DuplicateUnitError";
    }
}
/**
 * A lookup table over unit definitions. Symbols are matched exactly first
 * (so `m` is the metre and `M` would be distinct), then names and aliases
 * are matched case-insensitively.
 */
export class UnitRegistry {
    bySymbol = new Map();
    byName = new Map();
    constructor(definitions = BUILTIN_UNITS) {
        for (const def of definitions)
            this.add(def);
    }
    add(def) {
        if (this.bySymbol.has(def.symbol) ||
            this.byName.has(def.symbol.toLowerCase()) ||
            this.byName.has(def.name.toLowerCase())) {
            throw new DuplicateUnitError(def.symbol);
        }
        this.bySymbol.set(def.symbol, def);
        this.byName.set(def.symbol.toLowerCase(), def);
        this.byName.set(def.name.toLowerCase(), def);
        for (const alias of def.aliases ?? []) {
            const key = alias.toLowerCase();
            if (!this.byName.has(key))
                this.byName.set(key, def);
        }
    }
    /** Exact-symbol match, falling back to case-insensitive name/alias. */
    lookup(token) {
        return this.bySymbol.get(token) ?? this.byName.get(token.toLowerCase());
    }
    require(token) {
        const def = this.lookup(token);
        if (!def)
            throw new UnknownUnitError(token);
        return def;
    }
    all() {
        return [...this.bySymbol.values()];
    }
    /** Units whose dimension matches, sorted by symbol. */
    byDimension(dimension) {
        return this.all()
            .filter((def) => equals(def.dimension, dimension))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
}
