import { describe, expect, it } from "vitest";
import { decodeFactor, decodeFactorList, positionToSlot } from "./sparks";

describe("decodeFactor", () => {
  it("reads blue stamina stars from a 3-digit id", () => {
    const spark = decodeFactor(203, 0, "self");
    expect(spark).toMatchObject({ name: "Stamina", type: 1, stars: 3, slot: "self" });
  });

  it("maps 33xx to Medium, not running style", () => {
    const spark = decodeFactor(3303, 0, "self");
    expect(spark).toMatchObject({ name: "Medium", type: 2, stars: 3 });
  });

  it("maps 32xx to Mile", () => {
    const spark = decodeFactor(3203, 0, "parent1");
    expect(spark).toMatchObject({ name: "Mile", type: 2, stars: 3, slot: "parent1" });
  });

  it("maps 8-digit unique factors to green", () => {
    const spark = decodeFactor(10130103, 0, "self");
    expect(spark?.type).toBe(3);
    expect(spark?.stars).toBe(3);
    expect(spark?.name.toLowerCase()).not.toContain("factor 10130103");
  });

  it("drops carnival bonus factors", () => {
    expect(decodeFactor(4000101, 0, "self")).toBeNull();
  });
});

describe("decodeFactorList", () => {
  it("prefers factor_info_array over factor_id_array", () => {
    const sparks = decodeFactorList(
      [{ factor_id: 103, level: 0 }],
      [203],
      "self",
    );
    expect(sparks).toHaveLength(1);
    expect(sparks[0].name).toBe("Speed");
  });
});

describe("positionToSlot", () => {
  it("maps parent and grandparent position ids", () => {
    expect(positionToSlot(10)).toBe("parent1");
    expect(positionToSlot(20)).toBe("parent2");
    expect(positionToSlot(11)).toBe("gp11");
    expect(positionToSlot(22)).toBe("gp22");
  });
});
