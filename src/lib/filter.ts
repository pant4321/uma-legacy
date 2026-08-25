import type {
  FilterState,
  NodeFilter,
  NodeKey,
  Spark,
  SparkFocus,
  SparkRule,
  SparkSlot,
  Veteran,
} from "../types";
import { FOCUS_SLOTS } from "../types";

export function emptyNode(): NodeFilter {
  return { charaId: null, sparks: [] };
}

export function emptyFilter(): FilterState {
  return {
    query: "",
    focus: "all",
    tree: emptyNode(),
    main: emptyNode(),
    gp1: emptyNode(),
    gp2: emptyNode(),
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

export function editingNode(focus: SparkFocus): NodeKey {
  return focus === "all" ? "tree" : focus;
}

function sortSparks(sparks: Spark[]): Spark[] {
  return [...sparks].sort((a, b) => a.type - b.type || b.stars - a.stars || a.name.localeCompare(b.name));
}

export function sparksForFocus(veteran: Veteran, focus: SparkFocus): Spark[] {
  const slots = FOCUS_SLOTS[focus];
  const raw = veteran.sparks.filter((spark) => slots.includes(spark.slot));
  if (focus !== "all") return sortSparks(raw);

  const best = new Map<string, Spark>();
  for (const spark of raw) {
    const key = `${spark.type}:${spark.name}`;
    const prev = best.get(key);
    if (!prev || spark.stars > prev.stars) best.set(key, spark);
  }
  return sortSparks([...best.values()]);
}

export function parentsOf(veteran: Veteran) {
  return {
    gp1: veteran.family.find((row) => row.slot === "parent1") ?? null,
    gp2: veteran.family.find((row) => row.slot === "parent2") ?? null,
  };
}

function charaOnSlots(veteran: Veteran, slots: SparkSlot[], charaId: number): boolean {
  for (const slot of slots) {
    if (slot === "self" && veteran.charaId === charaId) return true;
    if (veteran.family.some((member) => member.slot === slot && member.charaId === charaId)) {
      return true;
    }
  }
  return false;
}

function nodeMatches(veteran: Veteran, node: NodeFilter, slots: SparkSlot[]): boolean {
  if (node.charaId !== null && !charaOnSlots(veteran, slots, node.charaId)) return false;
  for (const rule of node.sparks) {
    if (rule.minStars <= 0) continue;
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
  const lineage = veteran.sparks.filter((spark) =>
    FOCUS_SLOTS.all.includes(spark.slot),
  );
  if (lineage.some((spark) => spark.name.toLowerCase().includes(q))) return true;
  const parents = parentsOf(veteran);
  if (parents.gp1?.name.toLowerCase().includes(q)) return true;
  if (parents.gp2?.name.toLowerCase().includes(q)) return true;
  return false;
}

export function veteranMatches(veteran: Veteran, filter: FilterState): boolean {
  if (!matchesQuery(veteran, filter.query)) return false;
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

  if (!nodeMatches(veteran, filter.tree, FOCUS_SLOTS.all)) return false;
  if (!nodeMatches(veteran, filter.main, FOCUS_SLOTS.main)) return false;
  if (!nodeMatches(veteran, filter.gp1, FOCUS_SLOTS.gp1)) return false;
  if (!nodeMatches(veteran, filter.gp2, FOCUS_SLOTS.gp2)) return false;

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

export function upsertSparkRule(sparks: SparkRule[], type: SparkRule["type"], kind: string, minStars: number): SparkRule[] {
  const next = sparks.filter((rule) => !(rule.type === type && rule.kind === kind));
  if (minStars > 0) next.push({ type, kind, minStars });
  return next;
}

export function cycleStars(current: number): number {
  if (current >= 3) return 0;
  return current + 1;
}

export function nodeHasRules(node: NodeFilter): boolean {
  return node.charaId !== null || node.sparks.some((rule) => rule.minStars > 0);
}
