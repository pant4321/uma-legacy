import { describe, expect, it } from "vitest";
import sample from "../data/sample-roster.json";
import { applyFilter, emptyFilter, sparksForFocus, upsertSparkRule } from "./filter";
import { parseDump } from "./parseDump";

const veterans = parseDump(sample);

describe("applyFilter", () => {
  it("finds 3-star Stamina plus 3-star Medium on the main parent", () => {
    const filter = emptyFilter();
    filter.main.sparks = [
      { type: 1, kind: "Stamina", minStars: 3 },
      { type: 2, kind: "Medium", minStars: 3 },
    ];
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("requires Mile on grandparent 1, not grandparent 2", () => {
    const filter = emptyFilter();
    filter.main.sparks = [
      { type: 1, kind: "Stamina", minStars: 3 },
      { type: 2, kind: "Medium", minStars: 3 },
    ];
    filter.gp1.sparks = [{ type: 2, kind: "Mile", minStars: 3 }];
    expect(applyFilter(veterans, filter)).toHaveLength(1);

    filter.gp1.sparks = [];
    filter.gp2.sparks = [{ type: 2, kind: "Mile", minStars: 3 }];
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("matches name search and main character picker", () => {
    const byParentName = emptyFilter();
    byParentName.query = "oguri";
    expect(applyFilter(veterans, byParentName).map((v) => v.name)).toEqual([
      "Mejiro McQueen",
      "Oguri Cap",
    ]);

    const byName = emptyFilter();
    byName.query = "frontline elegance";
    expect(applyFilter(veterans, byName).map((v) => v.name)).toEqual(["Mejiro McQueen"]);

    const byChara = emptyFilter();
    byChara.main.charaId = 1013;
    expect(applyFilter(veterans, byChara).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("treats All-scope sparks as anywhere on main or either grandparent", () => {
    const filter = emptyFilter();
    filter.tree.sparks = upsertSparkRule([], 2, "Mile", 3);
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });
});

describe("sparksForFocus", () => {
  const mcqueen = veterans[0];

  it("shows only main sparks when focused on main", () => {
    const names = sparksForFocus(mcqueen, "main").map((s) => s.name);
    expect(names).toContain("Stamina");
    expect(names).toContain("Medium");
    expect(names).not.toContain("Mile");
  });

  it("shows grandparent 1 sparks including Mile", () => {
    const names = sparksForFocus(mcqueen, "gp1").map((s) => s.name);
    expect(names).toContain("Mile");
    expect(names).not.toContain("Stamina");
  });

  it("merges All-focus sparks from main and both grandparents", () => {
    const names = sparksForFocus(mcqueen, "all").map((s) => s.name);
    expect(names).toContain("Stamina");
    expect(names).toContain("Medium");
    expect(names).toContain("Mile");
    expect(names).toContain("Speed");
  });
});
