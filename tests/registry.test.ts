import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { LENGTH, MASS } from "../src/dimension.js";
import {
  DuplicateUnitError,
  UnitRegistry,
  UnknownUnitError,
} from "../src/registry.js";

describe("UnitRegistry", () => {
  test("looks up by exact symbol", () => {
    const registry = new UnitRegistry();
    assert.equal(registry.require("km").name, "kilometre");
    assert.equal(registry.require("°C").factor, 1);
    assert.equal(registry.require("°C").shift, 273.15);
  });

  test("looks up by alias and by name, case-insensitively", () => {
    const registry = new UnitRegistry();
    assert.equal(registry.require("miles").symbol, "mi");
    assert.equal(registry.require("KILOMETRE").symbol, "km");
    assert.equal(registry.require("Kilogram").symbol, "kg");
    assert.equal(registry.require("fahrenheit").symbol, "°F");
  });

  test("returns undefined for unknown units and require throws", () => {
    const registry = new UnitRegistry();
    assert.equal(registry.lookup("smoot"), undefined);
    assert.throws(() => registry.require("smoot"), UnknownUnitError);
  });

  test("rejects duplicate symbols and names", () => {
    const registry = new UnitRegistry();
    assert.throws(
      () => registry.add({ symbol: "km", name: "kilometre", dimension: LENGTH, factor: 1000 }),
      DuplicateUnitError,
    );
    assert.throws(
      () => registry.add({ symbol: "klick", name: "kilometre", dimension: LENGTH, factor: 1000 }),
      DuplicateUnitError,
    );
  });

  test("accepts custom units", () => {
    const registry = new UnitRegistry();
    registry.add({ symbol: "smoot", name: "smoot", dimension: LENGTH, factor: 1.7018 });
    assert.equal(registry.require("smoot").factor, 1.7018);
  });

  test("byDimension groups units of one quantity", () => {
    const registry = new UnitRegistry();
    const lengths = registry.byDimension(LENGTH).map((d) => d.symbol);
    assert.ok(lengths.includes("m"));
    assert.ok(lengths.includes("km"));
    assert.ok(lengths.includes("mi"));
    assert.ok(!lengths.includes("kg"));
    const masses = registry.byDimension(MASS).map((d) => d.symbol);
    assert.ok(masses.includes("kg"));
    assert.ok(masses.includes("lb"));
  });

  test("all built-in units have a positive finite factor", () => {
    const registry = new UnitRegistry();
    for (const def of registry.all()) {
      assert.ok(Number.isFinite(def.factor) && def.factor > 0, def.symbol);
    }
  });
});
