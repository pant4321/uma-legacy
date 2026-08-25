import type { FilterState, NodeFilter, Spark, SparkRule, SparkSlot, Veteran } from "../types";
import { MAIN_SLOTS, TREE_SLOTS } from "../types";

export function emptyNode(): NodeFilter {
  return { sparks: [] };
}

export function emptyFilter(): FilterState {
  return {
    query: "",
    tree: emptyNode(),
    main: emptyNode(),
    sort: "rankScore",
  };
}

export function newSparkRule(type: SparkRule["type"]): SparkRule {
  return {
    id: crypto.randomUUID(),
    type,
    kind: "",
    minStars: 1,
  };
}

function sortSparks(sparks: Spark[]): Spark[] {
  return [...sparks].sort((a, b) => a.type - b.type || b.stars - a.stars || a.name.localeCompare(b.name));
}

export function lineageSparks(veteran: Veteran): Spark[] {
  const raw = veteran.sparks.filter((spark) => TREE_SLOTS.includes(spark.slot));
  const best = new Map<string, Spark>();
  for (const spark of raw) {
    const key = `${spark.type}:${spark.name}`;
    const prev = best.get(key);
    if (!prev || spark.stars > prev.stars) best.set(key, spark);
  }
  return sortSparks([...best.values()]);
}

export function sparksForFocus(veteran: Veteran, focus: "all" | "main"): Spark[] {
  if (focus === "all") return lineageSparks(veteran);
  return sortSparks(veteran.sparks.filter((spark) => MAIN_SLOTS.includes(spark.slot)));
}

export function parentsOf(veteran: Veteran) {
  return {
    gp1: veteran.family.find((row) => row.slot === "parent1") ?? null,
    gp2: veteran.family.find((row) => row.slot === "parent2") ?? null,
  };
}

function nodeMatches(veteran: Veteran, node: NodeFilter, slots: SparkSlot[]): boolean {
  for (const rule of node.sparks) {
    if (!rule.kind || rule.minStars <= 0) continue;
    const hit = veteran.sparks.some(
      (spark) =>
        slots.includes(spark.slot) &&
        spark.type === rule.type &&
        spark.name === rule.kind &&
        spark.stars >= rule.minStars,
    );
    if (!hit) return false;
  }
  return true;
}

function matchesQuery(veteran: Veteran, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (veteran.name.toLowerCase().includes(q)) return true;
  if (veteran.title.toLowerCase().includes(q)) return true;
  if (veteran.skills.some((skill) => skill.name.toLowerCase().includes(q))) return true;
  const lineage = veteran.sparks.filter((spark) => TREE_SLOTS.includes(spark.slot));
  if (lineage.some((spark) => spark.name.toLowerCase().includes(q))) return true;
  const parents = parentsOf(veteran);
  if (parents.gp1?.name.toLowerCase().includes(q)) return true;
  if (parents.gp2?.name.toLowerCase().includes(q)) return true;
  return false;
}

export function veteranMatches(veteran: Veteran, filter: FilterState): boolean {
  if (!matchesQuery(veteran, filter.query)) return false;
  if (!nodeMatches(veteran, filter.tree, TREE_SLOTS)) return false;
  if (!nodeMatches(veteran, filter.main, MAIN_SLOTS)) return false;
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

export function updateSparkRule(sparks: SparkRule[], id: string, patch: Partial<SparkRule>): SparkRule[] {
  return sparks.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule));
}

export function removeSparkRule(sparks: SparkRule[], id: string): SparkRule[] {
  return sparks.filter((rule) => rule.id !== id);
}
