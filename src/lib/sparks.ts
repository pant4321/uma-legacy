import type { Spark, SparkSlot, SparkType } from "../types";
import { factorByFactorId, skillName, displayName, charaIdFromCard } from "./names";

const BLUE_KIND: Record<number, string> = {
  1: "Speed",
  2: "Stamina",
  3: "Power",
  4: "Guts",
  5: "Wit",
};

const PINK_KIND: Record<number, string> = {
  11: "Turf",
  12: "Dirt",
  21: "Front Runner",
  22: "Pace Chaser",
  23: "Late Surger",
  24: "End Closer",
  31: "Sprint",
  32: "Mile",
  33: "Medium",
  34: "Long",
};

export const BLUE_KINDS = ["Speed", "Stamina", "Power", "Guts", "Wit"] as const;

/** Sentinel kind: match the strongest spark of that type on the chosen slots. */
export const ANY_FACTOR = "Any";

export const PINK_KINDS = [
  { kind: "Turf", label: "Turf" },
  { kind: "Dirt", label: "Dirt" },
  { kind: "Sprint", label: "Sprint" },
  { kind: "Mile", label: "Mile" },
  { kind: "Medium", label: "Medium" },
  { kind: "Long", label: "Long" },
  { kind: "Front Runner", label: "Front" },
  { kind: "Pace Chaser", label: "Pace" },
  { kind: "Late Surger", label: "Late" },
  { kind: "End Closer", label: "End" },
] as const;

function starsFromId(factorId: number, catalogStars?: number): number {
  if (catalogStars && catalogStars >= 1 && catalogStars <= 9) return catalogStars;
  const lastTwo = factorId % 100;
  if (lastTwo >= 1 && lastTwo <= 9) return lastTwo;
  return 1;
}

function inferType(factorId: number): SparkType {
  const digits = String(factorId).length;
  if (digits === 3) return 1;
  if (digits === 4) return 2;
  if (digits === 8) return 3;
  if (Math.floor(factorId / 100) === 40001) return 7;
  if (digits === 7 && String(factorId).startsWith("30")) return 6;
  if (digits === 7 && String(factorId).startsWith("10")) return 5;
  return 4;
}

function fallbackName(factorId: number, type: SparkType): string {
  if (type === 1) {
    const kind = BLUE_KIND[Math.floor(factorId / 100)];
    return kind ?? `Blue ${factorId}`;
  }
  if (type === 2) {
    const kind = PINK_KIND[Math.floor(factorId / 100)];
    return kind ?? `Pink ${factorId}`;
  }
  if (type === 3) {
    const cardId = Math.floor(factorId / 100);
    return `Unique (${displayName(cardId).name})`;
  }
  if (type === 4) {
    const skillFamily = Math.floor(factorId / 100);
    const guessed = skillName(skillFamily * 10 + 1);
    if (!guessed.startsWith("Skill ")) return guessed;
    return skillName(skillFamily);
  }
  return `Factor ${factorId}`;
}

export function decodeFactor(
  factorId: number,
  level: number | undefined,
  slot: SparkSlot,
): Spark | null {
  if (!Number.isFinite(factorId) || factorId <= 0) return null;
  if (Math.floor(factorId / 100) === 40001) return null;

  const catalog = factorByFactorId(factorId);
  const type = (catalog?.type as SparkType | undefined) ?? inferType(factorId);
  if (type === 7) return null;

  const stars =
    typeof level === "number" && level >= 1 && level <= 9
      ? level
      : starsFromId(factorId, catalog?.stars);

  return {
    factorId,
    name: catalog?.name ?? fallbackName(factorId, type),
    type,
    stars,
    slot,
  };
}

export function decodeFactorList(
  factorInfoArray: unknown,
  factorIdArray: unknown,
  slot: SparkSlot,
): Spark[] {
  if (Array.isArray(factorInfoArray) && factorInfoArray.length > 0) {
    return factorInfoArray
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const rec = row as { factor_id?: unknown; level?: unknown };
        if (typeof rec.factor_id !== "number") return null;
        return decodeFactor(
          rec.factor_id,
          typeof rec.level === "number" ? rec.level : undefined,
          slot,
        );
      })
      .filter((spark): spark is Spark => spark !== null);
  }

  if (Array.isArray(factorIdArray)) {
    return factorIdArray
      .map((id) => (typeof id === "number" ? decodeFactor(id, undefined, slot) : null))
      .filter((spark): spark is Spark => spark !== null);
  }

  return [];
}

export function positionToSlot(positionId: unknown): SparkSlot {
  switch (positionId) {
    case 10:
      return "parent1";
    case 20:
      return "parent2";
    case 11:
      return "gp11";
    case 12:
      return "gp12";
    case 21:
      return "gp21";
    case 22:
      return "gp22";
    default:
      return "gp11";
  }
}

export function sparkColor(type: SparkType): "blue" | "pink" | "green" | "white" | "gold" {
  if (type === 1) return "blue";
  if (type === 2) return "pink";
  if (type === 3) return "green";
  if (type === 5 || type === 6) return "gold";
  return "white";
}

export { charaIdFromCard };
