import { describe, expect, it } from "vitest";
import sample from "../data/sample-roster.json";
import { parseDump, parseDumpText, ParseError } from "./parseDump";

describe("parseDump", () => {
  it("loads the sample roster", () => {
    const veterans = parseDump(sample);
    expect(veterans).toHaveLength(2);
    expect(veterans[0].name).toBe("Mejiro McQueen");
    expect(veterans[1].name).toBe("Oguri Cap");
    expect(veterans[0].sparks.some((s) => s.name === "Stamina" && s.stars === 3 && s.slot === "self")).toBe(true);
    expect(veterans[0].family.find((m) => m.slot === "parent1")?.name).toBe("Gold Ship");
  });

  it("accepts trained_chara_array wrappers", () => {
    const veterans = parseDump({ trained_chara_array: sample });
    expect(veterans).toHaveLength(2);
  });

  it("rejects empty and invalid payloads", () => {
    expect(() => parseDump([])).toThrow(ParseError);
    expect(() => parseDump({ horses: [] })).toThrow(ParseError);
    expect(() => parseDumpText("not json")).toThrow(/not valid JSON/);
  });
});
