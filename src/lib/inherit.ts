import type { Spark, SparkFocus, SparkType, Veteran } from "../types";
import { FOCUS_SLOTS, TREE_SLOTS } from "../types";

export type SparkChip = {
  name: string;
  type: SparkType;
  totalStars: number;
  parentStars: number;
  inheritPct: number;
};

export type SparkChipGroup = {
  id: "blue" | "pink" | "green" | "white" | "race" | "scenario";
  label: string;
  chips: SparkChip[];
};

const BASE_RATE: Record<"blue" | "pink" | "green" | "white" | "race", [number, number, number]> = {
  blue: [70, 80, 90],
  pink: [1, 3, 5],
  green: [5, 10, 15],
  white: [3, 6, 9],
  race: [1, 2, 3],
};

function rateKey(type: SparkType): keyof typeof BASE_RATE | null {
  if (type === 1) return "blue";
  if (type === 2) return "pink";
  if (type === 3) return "green";
  if (type === 5) return "race";
  if (type === 4 || type === 6) return "white";
  return null;
}

function slotChance(type: SparkType, stars: number): number {
  const key = rateKey(type);
  if (!key || stars < 1) return 0;
  return BASE_RATE[key][Math.max(0, Math.min(2, stars - 1))] / 100;
}

export function inheritChance(type: SparkType, parentStars: number, gp1Stars: number, gp2Stars: number): number {
  const fail =
    (1 - slotChance(type, parentStars)) * (1 - slotChance(type, gp1Stars)) * (1 - slotChance(type, gp2Stars));
  return (1 - fail * fail) * 100;
}

export function formatInheritPct(pct: number): string {
  if (pct >= 99.95) return "100%";
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

type Acc = {
  name: string;
  type: SparkType;
  self: number;
  gp1: number;
  gp2: number;
};

function bump(acc: Acc, slot: Spark["slot"], stars: number) {
  if (slot === "self") acc.self = Math.max(acc.self, stars);
  if (slot === "parent1") acc.gp1 = Math.max(acc.gp1, stars);
  if (slot === "parent2") acc.gp2 = Math.max(acc.gp2, stars);
}

export function sparkChips(veteran: Veteran, focus: SparkFocus): SparkChip[] {
  const acc = new Map<string, Acc>();
  for (const spark of veteran.sparks) {
    if (!TREE_SLOTS.includes(spark.slot)) continue;
    const key = `${spark.type}:${spark.name}`;
    let row = acc.get(key);
    if (!row) {
      row = { name: spark.name, type: spark.type, self: 0, gp1: 0, gp2: 0 };
      acc.set(key, row);
    }
    bump(row, spark.slot, spark.stars);
  }

  const slots = FOCUS_SLOTS[focus];
  const chips: SparkChip[] = [];
  for (const row of acc.values()) {
    let total = 0;
    if (slots.includes("self")) total += row.self;
    if (slots.includes("parent1")) total += row.gp1;
    if (slots.includes("parent2")) total += row.gp2;
    if (total <= 0) continue;
    chips.push({
      name: row.name,
      type: row.type,
      totalStars: total,
      parentStars: row.self,
      inheritPct: inheritChance(row.type, row.self, row.gp1, row.gp2),
    });
  }

  chips.sort((a, b) => a.type - b.type || b.totalStars - a.totalStars || a.name.localeCompare(b.name));
  return chips;
}

export function groupSparkChips(chips: SparkChip[]): SparkChipGroup[] {
  const buckets: Record<SparkChipGroup["id"], SparkChip[]> = {
    blue: [],
    pink: [],
    green: [],
    white: [],
    race: [],
    scenario: [],
  };
  for (const chip of chips) {
    if (chip.type === 1) buckets.blue.push(chip);
    else if (chip.type === 2) buckets.pink.push(chip);
    else if (chip.type === 3) buckets.green.push(chip);
    else if (chip.type === 5) buckets.race.push(chip);
    else if (chip.type === 6) buckets.scenario.push(chip);
    else buckets.white.push(chip);
  }
  const labels: { id: SparkChipGroup["id"]; label: string }[] = [
    { id: "blue", label: "Blue" },
    { id: "pink", label: "Pink" },
    { id: "green", label: "Green" },
    { id: "white", label: "Normal whites" },
    { id: "race", label: "Race whites" },
    { id: "scenario", label: "Scenario whites" },
  ];
  return labels
    .map((row) => ({ ...row, chips: buckets[row.id] }))
    .filter((row) => row.chips.length > 0);
}

export function matchedSparkKeys(filter: {
  tree: { groups: { sparks: { type: number; kind: string }[] }[] };
  main: { groups: { sparks: { type: number; kind: string }[] }[] };
}): Set<string> {
  const keys = new Set<string>();
  for (const node of [filter.tree, filter.main]) {
    for (const group of node.groups) {
      for (const rule of group.sparks) {
        if (rule.kind) keys.add(`${rule.type}:${rule.kind}`);
      }
    }
  }
  return keys;
}
