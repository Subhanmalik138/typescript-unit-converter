import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CURRENT, LENGTH, MASS, TEMPERATURE, TIME, add, describe as describeDimension, equals, isDimensionless, scale, subtract, toString, } from "../src/dimension.js";
describe("dimension arithmetic", () => {
    test("add combines exponents", () => {
        assert.deepEqual(add(LENGTH, TIME), [1, 0, 1, 0, 0, 0, 0]);
    });
    test("subtract inverts exponents", () => {
        assert.deepEqual(subtract(LENGTH, TIME), [1, 0, -1, 0, 0, 0, 0]);
    });
    test("scale multiplies every exponent", () => {
        assert.deepEqual(scale(LENGTH, 2), [2, 0, 0, 0, 0, 0, 0]);
        assert.deepEqual(scale(TIME, -1), [0, 0, -1, 0, 0, 0, 0]);
    });
    test("equals compares element-wise", () => {
        assert.equal(equals(MASS, MASS), true);
        assert.equal(equals(MASS, LENGTH), false);
        assert.equal(equals(add(LENGTH, TIME), subtract(LENGTH, scale(TIME, -1))), true);
    });
    test("isDimensionless only for the zero vector", () => {
        assert.equal(isDimensionless([0, 0, 0, 0, 0, 0, 0]), true);
        assert.equal(isDimensionless(TEMPERATURE), false);
    });
});
describe("dimension formatting", () => {
    test("toString renders force as L·M·T⁻²", () => {
        const force = add(MASS, add(LENGTH, scale(TIME, -2)));
        assert.equal(toString(force), "L·M·T⁻²");
    });
    test("toString renders a single base quantity plainly", () => {
        assert.equal(toString(CURRENT), "I");
        assert.equal(toString(LENGTH), "L");
    });
    test("toString renders dimensionless as 1", () => {
        assert.equal(toString([0, 0, 0, 0, 0, 0, 0]), "1");
    });
    test("describe names common dimensions", () => {
        assert.equal(describeDimension(LENGTH), "length");
        assert.equal(describeDimension(add(LENGTH, scale(TIME, -1))), "speed");
        assert.equal(describeDimension(scale(LENGTH, 2)), "area");
        assert.equal(describeDimension(scale(LENGTH, 3)), "volume");
        assert.equal(describeDimension(scale(TIME, -1)), "frequency");
    });
    test("describe falls back to the vector for exotic dimensions", () => {
        const weird = add(LENGTH, add(MASS, add(TIME, TEMPERATURE)));
        assert.equal(describeDimension(weird), "L·M·T·Θ");
    });
});
