import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { LENGTH, MASS, TIME, add, scale } from "../src/dimension.js";
import { UnitParseError, parseUnitExpression } from "../src/parser.js";
import { UnitRegistry, UnknownUnitError } from "../src/registry.js";
const registry = new UnitRegistry();
function approx(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `expected ${actual} to be within ${tolerance} of ${expected}`);
}
describe("parseUnitExpression", () => {
    test("resolves a bare unit", () => {
        const km = parseUnitExpression("km", registry);
        assert.deepEqual(km.dimension, LENGTH);
        approx(km.factor, 1000);
        assert.equal(km.shift, 0);
    });
    test("parses a quotient", () => {
        const kmh = parseUnitExpression("km/h", registry);
        assert.deepEqual(kmh.dimension, add(LENGTH, scale(TIME, -1)));
        approx(kmh.factor, 1 / 3.6);
    });
    test("parses products, powers and parentheses", () => {
        const newton = parseUnitExpression("kg*m/s^2", registry);
        assert.deepEqual(newton.dimension, add(MASS, add(LENGTH, scale(TIME, -2))));
        approx(newton.factor, 1);
        const area = parseUnitExpression("(ft*in)", registry);
        assert.deepEqual(area.dimension, scale(LENGTH, 2));
        approx(area.factor, 0.3048 * 0.0254);
    });
    test("handles superscript exponents", () => {
        const sqm = parseUnitExpression("m²", registry);
        assert.deepEqual(sqm.dimension, scale(LENGTH, 2));
        approx(sqm.factor, 1);
        const cubic = parseUnitExpression("cm³", registry);
        assert.deepEqual(cubic.dimension, scale(LENGTH, 3));
        approx(cubic.factor, 1e-6);
    });
    test("handles negative exponents", () => {
        const hz = parseUnitExpression("s^-1", registry);
        assert.deepEqual(hz.dimension, scale(TIME, -1));
        approx(hz.factor, 1);
    });
    test("implicit multiplication between adjacent factors", () => {
        const newton = parseUnitExpression("kg m/s^2", registry);
        approx(newton.factor, 1);
        assert.deepEqual(newton.dimension, add(MASS, add(LENGTH, scale(TIME, -2))));
    });
    test("multi-word aliases and the per operator", () => {
        const a = parseUnitExpression("meters per second", registry);
        const b = parseUnitExpression("kg per m^3", registry);
        assert.deepEqual(a.dimension, add(LENGTH, scale(TIME, -1)));
        approx(a.factor, 1);
        assert.deepEqual(b.dimension, add(MASS, scale(LENGTH, -3)));
        approx(b.factor, 1);
    });
    test("registered compound symbols agree with their expansion", () => {
        const named = parseUnitExpression("N", registry);
        const expanded = parseUnitExpression("kg*m/s^2", registry);
        assert.deepEqual(named.dimension, expanded.dimension);
        approx(named.factor, expanded.factor);
        const namedSpeed = parseUnitExpression("mph", registry);
        const expandedSpeed = parseUnitExpression("mi/h", registry);
        approx(namedSpeed.factor, expandedSpeed.factor);
    });
    test("affine units carry their shift", () => {
        const c = parseUnitExpression("°C", registry);
        assert.equal(c.shift, 273.15);
        approx(c.factor, 1);
        const f = parseUnitExpression("°F", registry);
        approx(f.factor, 5 / 9);
        approx(f.shift, 255.3722222222222);
    });
    test("rejects affine units inside compound expressions", () => {
        assert.throws(() => parseUnitExpression("°C/m", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("°C^2", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("°F*2", registry), UnitParseError);
    });
    test("rejects unknown units, empty input and malformed syntax", () => {
        assert.throws(() => parseUnitExpression("smoot", registry), UnknownUnitError);
        assert.throws(() => parseUnitExpression("", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("   ", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("m^^2", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("m^2.5", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("(m", registry), UnitParseError);
        assert.throws(() => parseUnitExpression("5", registry), UnitParseError);
    });
});
