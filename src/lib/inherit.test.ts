import { describe, expect, it } from "vitest";
import sample from "../data/sample-roster.json";
import {
  inheritChance,
  sparkChips,
  formatInheritPct,
  formatSparkGroupHeading,
  groupSparkChips,
} from "./inherit";
import { parseDump } from "./parseDump";

const veterans = parseDump(sample);

describe("inheritChance", () => {
  it("uses two inspiration rolls at 0 affinity", () => {
    expect(inheritChance(4, 3, 0, 0)).toBeCloseTo(17.19, 2);
    expect(inheritChance(4, 3, 3, 0)).toBeCloseTo(31.43, 2);
    expect(inheritChance(1, 3, 0, 0)).toBeCloseTo(99, 2);
  });
});

describe("sparkChips", () => {
  const mcqueen = veterans[0];

  it("puts combined stars on the left and main-parent stars on the chip", () => {
    const stam = sparkChips(mcqueen, "all").find((row) => row.name === "Stamina");
    expect(stam?.totalStars).toBe(3);
    expect(stam?.parentStars).toBe(3);

    const mile = sparkChips(mcqueen, "all").find((row) => row.name === "Mile");
    expect(mile?.totalStars).toBe(3);
    expect(mile?.parentStars).toBe(0);
  });

  it("hides sparks that are not on the focused slot", () => {
    const names = sparkChips(mcqueen, "main").map((row) => row.name);
    expect(names).toContain("Stamina");
    expect(names).not.toContain("Mile");
  });
});

describe("formatInheritPct", () => {
  it("keeps small rates precise", () => {
    expect(formatInheritPct(5.91)).toBe("5.91%");
    expect(formatInheritPct(17.19)).toBe("17.2%");
    expect(formatInheritPct(100)).toBe("100%");
  });
});

describe("formatSparkGroupHeading", () => {
  it("adds SPARK TOTAL only for normal whites", () => {
    expect(formatSparkGroupHeading("white", "Normal whites", [{ totalStars: 3 }, { totalStars: 2 }])).toBe(
      "Normal whites (2) - SPARK TOTAL (5)",
    );
    expect(formatSparkGroupHeading("race", "Race whites", [{ totalStars: 3 }])).toBe("Race whites (1)");
    expect(formatSparkGroupHeading("scenario", "Scenario whites", [{ totalStars: 2 }, { totalStars: 1 }])).toBe(
      "Scenario whites (2)",
    );
    expect(formatSparkGroupHeading("blue", "Blue", [{ totalStars: 3 }])).toBe("Blue");
  });
});
