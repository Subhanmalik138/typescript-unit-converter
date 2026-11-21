import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { IncompatibleDimensionsError, convert, formatNumber } from "../src/converter.js";
import { UnitRegistry } from "../src/registry.js";
const registry = new UnitRegistry();
function approx(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `expected ${actual} to be within ${tolerance} of ${expected}`);
}
describe("convert", () => {
    test("converts length", () => {
        approx(convert(5, "km", "mi", registry).result, 3.1068559611866697);
        approx(convert(1, "mi", "m", registry).result, 1609.344);
        approx(convert(12, "in", "ft", registry).result, 1);
        approx(convert(1, "ly", "km", registry).result, 9460730472580.8);
    });
    test("converts mass and volume", () => {
        approx(convert(1, "kg", "lb", registry).result, 2.2046226218487757);
        approx(convert(1, "gal", "L", registry).result, 3.785411784);
        approx(convert(1, "acre", "m²", registry).result, 4046.8564224);
    });
    test("converts temperature with the affine shift", () => {
        approx(convert(100, "°C", "°F", registry).result, 212);
        approx(convert(32, "°F", "°C", registry).result, 0);
        approx(convert(0, "K", "°C", registry).result, -273.15);
        approx(convert(-40, "°C", "°F", registry).result, -40);
        approx(convert(273.15, "K", "°F", registry).result, 32);
        approx(convert(0, "°C", "°R", registry).result, 491.67);
    });
    test("converts compound units", () => {
        approx(convert(100, "km/h", "m/s", registry).result, 27.77777777777778);
        approx(convert(1, "N", "kg*m/s^2", registry).result, 1);
        approx(convert(60, "mph", "km/h", registry).result, 96.56064);
        approx(convert(1, "kWh", "J", registry).result, 3.6e6);
        approx(convert(1, "atm", "psi", registry).result, 14.69594877551469);
        approx(convert(1, "hp", "W", registry).result, 745.699872);
    });
    test("converts data and angles", () => {
        approx(convert(1, "GiB", "MB", registry).result, 1073.741824);
        approx(convert(8, "bit", "B", registry).result, 1);
        approx(convert(90, "deg", "rad", registry).result, Math.PI / 2);
        approx(convert(1, "turn", "deg", registry).result, 360);
    });
    test("is exact for identity conversions", () => {
        approx(convert(42, "m", "m", registry).result, 42);
        approx(convert(7, "kg*m/s^2", "N", registry).result, 7);
    });
    test("rejects conversions between different dimensions", () => {
        assert.throws(() => convert(5, "km", "kg", registry), IncompatibleDimensionsError);
        assert.throws(() => convert(5, "m", "s", registry), IncompatibleDimensionsError);
        assert.throws(() => convert(5, "°C", "m", registry), IncompatibleDimensionsError);
    });
    test("reports the dimension of the conversion", () => {
        const result = convert(5, "km", "mi", registry);
        assert.equal(result.value, 5);
        assert.equal(result.from, "km");
        assert.equal(result.to, "mi");
        assert.deepEqual(result.fromDimension, [1, 0, 0, 0, 0, 0, 0]);
    });
});
describe("formatNumber", () => {
    test("trims floating-point noise to 10 significant digits", () => {
        assert.equal(formatNumber(1 / 3), "0.3333333333");
        assert.equal(formatNumber(2.5), "2.5");
        assert.equal(formatNumber(0), "0");
        assert.equal(formatNumber(1000000), "1000000");
        assert.equal(formatNumber(1 / 3, 4), "0.3333");
    });
});
