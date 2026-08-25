import { describe, expect, it } from "vitest";
import sample from "../data/sample-roster.json";
import {
  applyFilter,
  describeNode,
  emptyFilter,
  emptyNode,
  enrichVeteran,
  lineageSparks,
  normalizeFilter,
  sparksForFocus,
  summarizeWhiteSparks,
} from "./filter";
import { parseDump } from "./parseDump";
import type { JoinMode, NodeFilter, SparkRule } from "../types";
import { TREE_SLOTS } from "../types";

const veterans = parseDump(sample);

function rule(type: SparkRule["type"], kind: string, minStars: number): SparkRule {
  return { id: `${type}-${kind}-${minStars}`, type, kind, minStars };
}

function node(rules: SparkRule[], groupJoin: JoinMode = "and", join: JoinMode = "and"): NodeFilter {
  return { join, groups: [{ id: "g1", join: groupJoin, sparks: rules }] };
}

describe("applyFilter", () => {
  it("matches Any blue when some blue kind meets the star minimum", () => {
    const filter = emptyFilter();
    filter.main = node([rule(1, "Any", 3)]);
    expect(applyFilter(veterans, filter).map((v) => v.name)).toContain("Mejiro McQueen");

    const weak = structuredClone(veterans[0]);
    weak.id = 99;
    weak.sparks = weak.sparks.map((spark) =>
      spark.type === 1 && spark.slot === "self" ? { ...spark, stars: 2 } : spark,
    );
    expect(applyFilter([weak], filter)).toHaveLength(0);

    const strongOther = structuredClone(weak);
    strongOther.id = 100;
    strongOther.sparks.push({ factorId: 303, name: "Power", type: 1, stars: 3, slot: "self" });
    expect(applyFilter([strongOther], filter).map((v) => v.id)).toEqual([100]);
  });

  it("uses the strongest blue kind for Any across All slots", () => {
    const stacked = structuredClone(veterans[0]);
    stacked.sparks = stacked.sparks.filter((spark) => spark.type !== 1);
    stacked.sparks.push(
      { factorId: 101, name: "Speed", type: 1, stars: 2, slot: "self" },
      { factorId: 101, name: "Speed", type: 1, stars: 2, slot: "parent1" },
      { factorId: 203, name: "Stamina", type: 1, stars: 1, slot: "self" },
    );
    const filter = emptyFilter();
    filter.tree = node([rule(1, "Any", 4)]);
    expect(applyFilter([stacked], filter)).toHaveLength(1);

    filter.tree = node([rule(1, "Any", 5)]);
    expect(applyFilter([stacked], filter)).toHaveLength(0);
  });

  it("finds 3-star Stamina plus 3-star Medium on the main parent", () => {
    const filter = emptyFilter();
    filter.main = node([rule(1, "Stamina", 3), rule(2, "Medium", 3)]);
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("ORs factors in a combination so 3 Power or 3 Stamina matches Stamina", () => {
    const filter = emptyFilter();
    filter.main = node([rule(1, "Power", 3), rule(1, "Stamina", 3)], "or");
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("still ANDs a combination by default", () => {
    const filter = emptyFilter();
    filter.main = node([rule(1, "Power", 3), rule(1, "Stamina", 3)]);
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("ORs whole combinations", () => {
    const filter = emptyFilter();
    filter.main = {
      join: "or",
      groups: [
        { id: "a", join: "and", sparks: [rule(1, "Power", 3)] },
        { id: "b", join: "and", sparks: [rule(1, "Stamina", 3)] },
      ],
    };
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("ANDs whole combinations", () => {
    const filter = emptyFilter();
    filter.main = {
      join: "and",
      groups: [
        { id: "a", join: "and", sparks: [rule(1, "Stamina", 3)] },
        { id: "b", join: "and", sparks: [rule(2, "Medium", 3)] },
      ],
    };
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);

    filter.main.groups[1].sparks = [rule(1, "Power", 3)];
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("treats All sparks as anywhere on the parent or either grandparent", () => {
    const filter = emptyFilter();
    filter.tree = node([rule(2, "Mile", 3)]);
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);
  });

  it("sums All-column stars across the parent and both grandparents", () => {
    const stacked = structuredClone(veterans[0]);
    stacked.sparks.push(
      { factorId: 203, name: "Stamina", type: 1, stars: 3, slot: "parent1" },
      { factorId: 203, name: "Stamina", type: 1, stars: 2, slot: "parent2" },
    );
    const filter = emptyFilter();
    filter.tree = node([rule(1, "Stamina", 8)]);
    expect(applyFilter([stacked], filter)).toHaveLength(1);

    filter.tree = node([rule(1, "Stamina", 9)]);
    expect(applyFilter([stacked], filter)).toHaveLength(0);
  });

  it("does not treat a grandparent spark as a Main Parent hit", () => {
    const filter = emptyFilter();
    filter.main = node([rule(2, "Mile", 3)]);
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("ANDs All and Main Parent columns", () => {
    const filter = emptyFilter();
    filter.tree = node([rule(2, "Mile", 3)]);
    filter.main = node([rule(1, "Stamina", 3), rule(2, "Medium", 3)]);
    expect(applyFilter(veterans, filter).map((v) => v.name)).toEqual(["Mejiro McQueen"]);

    filter.main = node([rule(2, "Mile", 3)]);
    expect(applyFilter(veterans, filter)).toHaveLength(0);
  });

  it("ignores draft rows that have no factor chosen yet", () => {
    const filter = emptyFilter();
    filter.main = node([rule(1, "", 3)]);
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

  it("defaults to white-spark sort and ranks by cumulative white ★, not skill count", () => {
    expect(emptyFilter().sort).toBe("whiteCount");

    const fewerSkillsMoreStars = structuredClone(veterans[0]);
    fewerSkillsMoreStars.id = 1;
    fewerSkillsMoreStars.sparks = fewerSkillsMoreStars.sparks.filter(
      (spark) => spark.slot !== "self" || (spark.type !== 4 && spark.type !== 5 && spark.type !== 6),
    );
    fewerSkillsMoreStars.sparks.push({
      factorId: 1,
      name: "OnlyOne",
      type: 4,
      stars: 3,
      slot: "self",
    });

    const moreSkillsFewerStars = structuredClone(veterans[1]);
    moreSkillsFewerStars.id = 2;
    moreSkillsFewerStars.sparks = [
      ...moreSkillsFewerStars.sparks.filter(
        (spark) => spark.slot !== "self" || (spark.type !== 4 && spark.type !== 5 && spark.type !== 6),
      ),
      { factorId: 2, name: "A", type: 4, stars: 1, slot: "self" },
      { factorId: 3, name: "B", type: 4, stars: 1, slot: "self" },
    ];

    delete (fewerSkillsMoreStars as { whiteParentStars?: number }).whiteParentStars;
    moreSkillsFewerStars.whiteParentStars = 0;

    const byParent = emptyFilter();
    byParent.sort = "whiteParentCount";
    const ordered = applyFilter([moreSkillsFewerStars, fewerSkillsMoreStars], byParent);
    expect(ordered.map((row) => row.id)).toEqual([1, 2]);
  });

  it("ignores race and scenario whites when sorting by normal white ★", () => {
    const normalHeavy = structuredClone(veterans[0]);
    normalHeavy.id = 10;
    normalHeavy.sparks = [
      { factorId: 1, name: "SkillA", type: 4, stars: 3, slot: "self" },
      { factorId: 2, name: "SkillA", type: 4, stars: 2, slot: "parent1" },
    ];

    const raceHeavy = structuredClone(veterans[0]);
    raceHeavy.id = 11;
    raceHeavy.sparks = [
      { factorId: 3, name: "SkillB", type: 4, stars: 1, slot: "self" },
      { factorId: 4, name: "Arima Kinen", type: 5, stars: 3, slot: "self" },
      { factorId: 5, name: "UAF", type: 6, stars: 3, slot: "parent1" },
    ];

    expect(summarizeWhiteSparks(normalHeavy, TREE_SLOTS).stars).toBe(5);
    expect(summarizeWhiteSparks(raceHeavy, TREE_SLOTS).stars).toBe(1);
    expect(enrichVeteran(raceHeavy).whiteStars).toBe(1);

    const filter = emptyFilter();
    filter.sort = "whiteCount";
    expect(applyFilter([raceHeavy, normalHeavy], filter).map((row) => row.id)).toEqual([10, 11]);
  });
});

describe("normalizeFilter", () => {
  it("wraps a legacy flat spark list into one AND combination", () => {
    const filter = normalizeFilter({
      query: "",
      sort: "rankScore",
      main: { sparks: [rule(1, "Stamina", 3)] },
      tree: {},
    });
    expect(filter?.main.groups[0].join).toBe("and");
    expect(filter?.main.groups[0].sparks).toEqual([rule(1, "Stamina", 3)]);
  });
});

describe("describeNode", () => {
  it("prints OR combinations", () => {
    expect(describeNode(node([rule(1, "Power", 3), rule(1, "Stamina", 3)], "or"))).toBe(
      "(Power 3★ OR Stamina 3★)",
    );
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

  it("shows grandparent 1 sparks including Mile", () => {
    const names = sparksForFocus(mcqueen, "gp1").map((s) => s.name);
    expect(names).toContain("Mile");
    expect(names).not.toContain("Stamina");
  });
});

describe("emptyNode", () => {
  it("starts with one AND combination", () => {
    const next = emptyNode();
    expect(next.join).toBe("and");
    expect(next.groups).toHaveLength(1);
    expect(next.groups[0].join).toBe("and");
  });
});
