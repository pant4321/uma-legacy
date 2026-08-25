import type { FilterState, Spark, SparkRule, SparkWhere, Veteran } from "../types";
import { SLOT_TO_WHERE } from "../types";

export function emptyFilter(): FilterState {
  return {
    query: "",
    charaId: null,
    parentCharaId: null,
    sparks: [],
    advanced: false,
    minRankScore: null,
    minStats: {
      speed: null,
      stamina: null,
      power: null,
      guts: null,
      wit: null,
    },
    minAptitudes: {},
    sort: "rankScore",
  };
}

function slotsFor(where: SparkWhere, advanced: boolean): SparkWhere[] {
  if (!advanced || where === "any") return ["any"];
  return [where];
}

function sparkMatchesWhere(spark: Spark, where: SparkWhere, advanced: boolean): boolean {
  if (!advanced || where === "any") return true;
  const mapped = SLOT_TO_WHERE[spark.slot];
  return mapped === where;
}

function ruleMatches(veteran: Veteran, rule: SparkRule, advanced: boolean): boolean {
  const where = slotsFor(rule.where, advanced)[0];
  return veteran.sparks.some(
    (spark) =>
      spark.type === rule.type &&
      spark.name === rule.kind &&
      spark.stars >= rule.minStars &&
      sparkMatchesWhere(spark, where, advanced),
  );
}

function matchesQuery(veteran: Veteran, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (veteran.name.toLowerCase().includes(q)) return true;
  if (veteran.title.toLowerCase().includes(q)) return true;
  if (veteran.skills.some((skill) => skill.name.toLowerCase().includes(q))) return true;
  if (veteran.sparks.some((spark) => spark.name.toLowerCase().includes(q))) return true;
  if (veteran.family.some((member) => member.name.toLowerCase().includes(q))) return true;
  return false;
}

export function veteranMatches(veteran: Veteran, filter: FilterState): boolean {
  if (!matchesQuery(veteran, filter.query)) return false;
  if (filter.charaId !== null && veteran.charaId !== filter.charaId) return false;
  if (
    filter.parentCharaId !== null &&
    !veteran.family.some((member) => member.charaId === filter.parentCharaId)
  ) {
    return false;
  }
  if (filter.minRankScore !== null && veteran.rankScore < filter.minRankScore) return false;

  for (const [stat, min] of Object.entries(filter.minStats)) {
    if (min === null) continue;
    const value = veteran[stat as "speed" | "stamina" | "power" | "guts" | "wit"];
    if (value < min) return false;
  }

  for (const [key, min] of Object.entries(filter.minAptitudes)) {
    if (min === undefined) continue;
    if (veteran.aptitudes[key as keyof Veteran["aptitudes"]] < min) return false;
  }

  for (const rule of filter.sparks) {
    if (rule.minStars <= 0) continue;
    if (!ruleMatches(veteran, rule, filter.advanced)) return false;
  }

  return true;
}

function compareVeterans(a: Veteran, b: Veteran, sort: FilterState["sort"]): number {
  switch (sort) {
    case "newest":
      return b.createdAt - a.createdAt;
    case "oldest":
      return a.createdAt - b.createdAt;
    case "whiteCount":
      return b.whiteCount - a.whiteCount;
    case "g1":
      return b.winSaddleCount - a.winSaddleCount;
    case "speed":
      return b.speed - a.speed;
    case "stamina":
      return b.stamina - a.stamina;
    case "power":
      return b.power - a.power;
    case "guts":
      return b.guts - a.guts;
    case "wit":
      return b.wit - a.wit;
    case "rankScore":
    default:
      return b.rankScore - a.rankScore;
  }
}

export function applyFilter(veterans: Veteran[], filter: FilterState): Veteran[] {
  return veterans.filter((veteran) => veteranMatches(veteran, filter)).sort((a, b) => {
    const diff = compareVeterans(a, b, filter.sort);
    if (diff !== 0) return diff;
    return a.id - b.id;
  });
}

export function upsertSparkRule(
  sparks: SparkRule[],
  type: SparkRule["type"],
  kind: string,
  minStars: number,
  where: SparkWhere = "any",
): SparkRule[] {
  const next = sparks.filter((rule) => !(rule.type === type && rule.kind === kind));
  if (minStars > 0) {
    const existing = sparks.find((rule) => rule.type === type && rule.kind === kind);
    next.push({
      type,
      kind,
      minStars,
      where: existing?.where ?? where,
    });
  }
  return next;
}

export function cycleStars(current: number): number {
  if (current >= 3) return 0;
  return current + 1;
}
