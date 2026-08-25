import type {
  FilterState,
  JoinMode,
  NodeFilter,
  SortKey,
  Spark,
  SparkGroup,
  SparkRule,
  SparkSlot,
  Veteran,
} from "../types";
import { MAIN_SLOTS, SORT_KEYS, TREE_SLOTS } from "../types";

export function emptyGroup(): SparkGroup {
  return { id: crypto.randomUUID(), join: "and", sparks: [] };
}

export function emptyNode(): NodeFilter {
  return { join: "and", groups: [emptyGroup()] };
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

function isActiveRule(rule: SparkRule): boolean {
  return Boolean(rule.kind) && rule.minStars > 0;
}

function ruleMatches(veteran: Veteran, rule: SparkRule, slots: SparkSlot[]): boolean {
  return veteran.sparks.some(
    (spark) =>
      slots.includes(spark.slot) &&
      spark.type === rule.type &&
      spark.name === rule.kind &&
      spark.stars >= rule.minStars,
  );
}

function groupMatches(veteran: Veteran, group: SparkGroup, slots: SparkSlot[]): boolean {
  const rules = group.sparks.filter(isActiveRule);
  if (rules.length === 0) return true;
  if (group.join === "or") return rules.some((rule) => ruleMatches(veteran, rule, slots));
  return rules.every((rule) => ruleMatches(veteran, rule, slots));
}

function activeGroups(node: NodeFilter): SparkGroup[] {
  return node.groups.filter((group) => group.sparks.some(isActiveRule));
}

function nodeMatches(veteran: Veteran, node: NodeFilter, slots: SparkSlot[]): boolean {
  const groups = activeGroups(node);
  if (groups.length === 0) return true;
  if (node.join === "or") return groups.some((group) => groupMatches(veteran, group, slots));
  return groups.every((group) => groupMatches(veteran, group, slots));
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

export function updateGroup(node: NodeFilter, id: string, patch: Partial<SparkGroup>): NodeFilter {
  return {
    ...node,
    groups: node.groups.map((group) => (group.id === id ? { ...group, ...patch } : group)),
  };
}

export function addGroup(node: NodeFilter): NodeFilter {
  return { ...node, groups: [...node.groups, emptyGroup()] };
}

export function removeGroup(node: NodeFilter, id: string): NodeFilter {
  const groups = node.groups.filter((group) => group.id !== id);
  return { ...node, groups: groups.length > 0 ? groups : [emptyGroup()] };
}

function describeGroup(group: SparkGroup): string {
  const bits = group.sparks.filter(isActiveRule).map((rule) => `${rule.kind} ${"★".repeat(rule.minStars)}`);
  if (bits.length === 0) return "";
  const glue = group.join === "or" ? " OR " : " AND ";
  return bits.length > 1 ? `(${bits.join(glue)})` : bits[0];
}

export function describeNode(node: NodeFilter): string {
  const parts = activeGroups(node).map(describeGroup).filter(Boolean);
  if (parts.length === 0) return "";
  const glue = node.join === "or" ? " OR " : " AND ";
  return parts.join(glue);
}

function asJoin(value: unknown): JoinMode {
  return value === "or" ? "or" : "and";
}

function asRule(raw: unknown): SparkRule | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const type = rec.type;
  if (type !== 1 && type !== 2 && type !== 3 && type !== 4 && type !== 5 && type !== 6) return null;
  const minStars = typeof rec.minStars === "number" && rec.minStars >= 1 && rec.minStars <= 3 ? rec.minStars : 1;
  return {
    id: typeof rec.id === "string" && rec.id ? rec.id : crypto.randomUUID(),
    type,
    kind: typeof rec.kind === "string" ? rec.kind : "",
    minStars,
  };
}

function asGroup(raw: unknown): SparkGroup {
  if (!raw || typeof raw !== "object") return emptyGroup();
  const rec = raw as Record<string, unknown>;
  const sparks = Array.isArray(rec.sparks)
    ? rec.sparks.map(asRule).filter((row): row is SparkRule => row !== null)
    : [];
  return {
    id: typeof rec.id === "string" && rec.id ? rec.id : crypto.randomUUID(),
    join: asJoin(rec.join),
    sparks,
  };
}

export function normalizeNode(raw: unknown): NodeFilter {
  if (!raw || typeof raw !== "object") return emptyNode();
  const rec = raw as Record<string, unknown>;
  if (Array.isArray(rec.groups) && rec.groups.length > 0) {
    return { join: asJoin(rec.join), groups: rec.groups.map(asGroup) };
  }
  if (Array.isArray(rec.sparks)) {
    const sparks = rec.sparks.map(asRule).filter((row): row is SparkRule => row !== null);
    return { join: "and", groups: [{ id: crypto.randomUUID(), join: "and", sparks }] };
  }
  return emptyNode();
}

export function normalizeFilter(raw: unknown): FilterState | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const sort: SortKey = SORT_KEYS.includes(rec.sort as SortKey) ? (rec.sort as SortKey) : "rankScore";
  return {
    query: typeof rec.query === "string" ? rec.query : "",
    sort,
    tree: normalizeNode(rec.tree),
    main: normalizeNode(rec.main),
  };
}

export function cloneFilter(filter: FilterState): FilterState {
  return normalizeFilter(JSON.parse(JSON.stringify(filter))) ?? emptyFilter();
}
