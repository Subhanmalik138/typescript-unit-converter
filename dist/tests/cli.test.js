import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { main } from "../src/cli.js";
let stdout = "";
let stderr = "";
const realLog = console.log;
const realError = console.error;
function capture() {
    stdout = "";
    stderr = "";
    console.log = (message) => {
        stdout += `${String(message)}\n`;
    };
    console.error = (message) => {
        stderr += `${String(message)}\n`;
    };
}
afterEach(() => {
    console.log = realLog;
    console.error = realError;
});
describe("CLI", () => {
    test("convert prints the result with the to keyword", () => {
        capture();
        assert.equal(main(["convert", "5", "km", "to", "mi"]), 0);
        assert.match(stdout, /5 km = 3\.106855961 mi/);
    });
    test("convert works without the to keyword", () => {
        capture();
        assert.equal(main(["convert", "100", "km/h", "m/s"]), 0);
        assert.match(stdout, /100 km\/h = 27\.77777778 m\/s/);
    });
    test("convert handles temperature and compound expressions", () => {
        capture();
        assert.equal(main(["convert", "32", "°F", "to", "°C"]), 0);
        assert.match(stdout, /32 °F = 0 °C/);
        capture();
        assert.equal(main(["convert", "1", "kg*m/s^2", "to", "N"]), 0);
        assert.match(stdout, /1 kg\*m\/s\^2 = 1 N/);
    });
    test("convert --json prints machine-readable output", () => {
        capture();
        assert.equal(main(["convert", "5", "km", "mi", "--json"]), 0);
        const parsed = JSON.parse(stdout);
        assert.equal(parsed.value, 5);
        assert.ok(Math.abs(parsed.result - 3.1068559611866697) < 1e-9);
        assert.equal(parsed.dimension, "L");
    });
    test("convert --precision controls significant digits", () => {
        capture();
        assert.equal(main(["convert", "1", "km", "mi", "--precision", "4"]), 0);
        assert.match(stdout, /1 km = 0\.6214 mi/);
    });
    test("convert rejects incompatible dimensions and unknown units", () => {
        capture();
        assert.equal(main(["convert", "5", "km", "kg"]), 2);
        assert.match(stderr, /dimensions do not match/);
        capture();
        assert.equal(main(["convert", "5", "km", "smoot"]), 2);
        assert.match(stderr, /unknown unit/);
    });
    test("convert validates its arguments", () => {
        capture();
        assert.equal(main(["convert", "five", "km", "mi"]), 1);
        assert.match(stderr, /not a number/);
        capture();
        assert.equal(main(["convert", "5", "km"]), 1);
    });
    test("list shows units, optionally filtered by dimension", () => {
        capture();
        assert.equal(main(["list"]), 0);
        assert.match(stdout, /## length/);
        assert.match(stdout, /kilometre/);
        capture();
        assert.equal(main(["list", "length"]), 0);
        assert.match(stdout, /kilometre/);
        assert.doesNotMatch(stdout, /kilogram/);
        capture();
        assert.equal(main(["list", "nonsense-dimension"]), 1);
        assert.match(stderr, /no units found/);
    });
    test("dimensions shows the vector of an expression", () => {
        capture();
        assert.equal(main(["dimensions", "kg*m/s^2"]), 0);
        assert.match(stdout, /L·M·T⁻²/);
        assert.match(stdout, /force/);
    });
    test("define registers a custom unit for the run", () => {
        capture();
        assert.equal(main(["--define", "furlong = 201.168 m", "convert", "2", "furlong", "to", "km"]), 0);
        assert.match(stdout, /2 furlong = 0\.402336 km/);
        capture();
        assert.equal(main(["--define", "not a definition", "convert", "1", "m", "km"]), 2);
        assert.match(stderr, /--define expects/);
    });
    test("help, version and unknown commands", () => {
        capture();
        assert.equal(main([]), 0);
        assert.match(stdout, /Usage:/);
        capture();
        assert.equal(main(["--version"]), 0);
        assert.match(stdout, /^\d+\.\d+\.\d+\n$/);
        capture();
        assert.equal(main(["frobnicate"]), 1);
        assert.match(stderr, /unknown command/);
    });
});
