import { describe, expect, it } from "vitest";
import sample from "../data/sample-roster.json";
import { applyFilter, emptyFilter, lineageSparks, sparksForFocus } from "./filter";
import { parseDump } from "./parseDump";
import type { SparkRule } from "../types";

const veterans = parseDump(sample);

function rule(type: SparkRule["type"], kind: string, minStars: number): SparkRule {
  return { id: `${type}-${kind}-${minStars}`, type, kind, minStars };
}

describe("applyFilter", () => {
  it("finds 3-star Stamina plus 3-star Medium on the main parent", () => {
    const filter = emptyFilter();
    filter.main.sparks = [rule(1, "Stamina", 3), rule(2, "Medium", 3)];
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("treats All sparks as anywhere on the parent or either grandparent", () => {
    const filter = emptyFilter();
    filter.tree.sparks = [rule(2, "Mile", 3)];
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("does not treat a grandparent spark as a Main Parent hit", () => {
    const filter = emptyFilter();
    filter.main.sparks = [rule(2, "Mile", 3)];
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("ANDs All and Main Parent columns", () => {
    const filter = emptyFilter();
    filter.tree.sparks = [rule(2, "Mile", 3)];
    filter.main.sparks = [rule(1, "Stamina", 3), rule(2, "Medium", 3)];
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);

    filter.main.sparks = [rule(2, "Mile", 3)];
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("ignores draft rows that have no factor chosen yet", () => {
    const filter = emptyFilter();
    filter.main.sparks = [rule(1, "", 3)];
    expect(applyFilter(veterans, filter)).toHaveLength(veterans.length);
  });

  it("matches name search across the veteran and parents", () => {
    const byParentName = emptyFilter();
    byParentName.query = "oguri";
    expect(applyFilter(veterans, byParentName).map((v) => v.name)).toEqual([
      "Mejiro McQueen",
      "Oguri Cap",
    ]);

    const byName = emptyFilter();
    byName.query = "frontline elegance";
    expect(applyFilter(veterans, byName).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });
});

describe("lineageSparks", () => {
  const mcqueen = veterans[0];

  it("merges sparks from the parent and both grandparents", () => {
    const names = lineageSparks(mcqueen).map((s) => s.name);
    expect(names).toContain("Stamina");
    expect(names).toContain("Medium");
    expect(names).toContain("Mile");
    expect(names).toContain("Speed");
  });

  it("can still isolate main-parent sparks", () => {
    const names = sparksForFocus(mcqueen, "main").map((s) => s.name);
    expect(names).toContain("Stamina");
    expect(names).toContain("Medium");
    expect(names).not.toContain("Mile");
  });
});
