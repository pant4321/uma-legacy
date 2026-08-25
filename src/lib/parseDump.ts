import type { Aptitudes, FamilyMember, Skill, Veteran } from "../types";
import { TREE_SLOTS } from "../types";
import { characterName, displayName, skillName } from "./names";
import { charaIdFromCard, decodeFactorList, positionToSlot } from "./sparks";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function aptitudesFrom(raw: Record<string, unknown>): Aptitudes {
  return {
    short: num(raw.proper_distance_short),
    mile: num(raw.proper_distance_mile),
    middle: num(raw.proper_distance_middle),
    long: num(raw.proper_distance_long),
    turf: num(raw.proper_ground_turf),
    dirt: num(raw.proper_ground_dirt),
    nige: num(raw.proper_running_style_nige),
    senko: num(raw.proper_running_style_senko),
    sashi: num(raw.proper_running_style_sashi),
    oikomi: num(raw.proper_running_style_oikomi),
  };
}

function skillsFrom(raw: Record<string, unknown>): Skill[] {
  const list = Array.isArray(raw.skill_array)
    ? raw.skill_array
    : Array.isArray(raw.skills)
      ? raw.skills
      : [];
  const skills: Skill[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const rec = row as { skill_id?: unknown; id?: unknown; level?: unknown };
    const id = num(rec.skill_id || rec.id);
    if (!id) continue;
    skills.push({
      id,
      name: skillName(id),
      level: num(rec.level, 1) || 1,
    });
  }
  return skills;
}

function familyFrom(raw: Record<string, unknown>): FamilyMember[] {
  const list = Array.isArray(raw.succession_chara_array) ? raw.succession_chara_array : [];
  const family: FamilyMember[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const cardId = num(rec.card_id);
    if (!cardId) continue;
    const slot = positionToSlot(rec.position_id);
    const charaId = charaIdFromCard(cardId);
    const { name, title } = displayName(cardId);
    family.push({
      slot,
      cardId,
      charaId,
      name,
      title,
      talentLevel: num(rec.talent_level, 1),
      sparks: decodeFactorList(rec.factor_info_array, rec.factor_id_array, slot),
    });
  }
  const order: FamilyMember["slot"][] = [
    "parent1",
    "parent2",
    "gp11",
    "gp12",
    "gp21",
    "gp22",
  ];
  family.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
  return family;
}

function parseCreated(value: unknown): { createdAt: number; createdText: string } {
  if (typeof value !== "string" || !value) {
    return { createdAt: 0, createdText: "" };
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ms = Date.parse(normalized);
  if (Number.isNaN(ms)) return { createdAt: 0, createdText: value };
  return { createdAt: ms, createdText: value };
}

export function veteranFromRaw(raw: unknown, index: number): Veteran | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const cardId = num(rec.card_id);
  if (!cardId) return null;

  const charaId = charaIdFromCard(cardId);
  const { name, title } = displayName(cardId);
  const selfSparks = decodeFactorList(rec.factor_info_array, rec.factor_id_array, "self");
  const family = familyFrom(rec);
  const sparks = [...selfSparks, ...family.flatMap((member) => member.sparks)];
  const created = parseCreated(rec.create_time ?? rec.register_time);
  const saddles = Array.isArray(rec.win_saddle_id_array) ? rec.win_saddle_id_array.length : 0;

  return {
    id: num(rec.trained_chara_id, index + 1),
    cardId,
    charaId,
    name: name || characterName(charaId),
    title,
    talentLevel: num(rec.talent_level, 1),
    rarity: num(rec.rarity),
    rank: num(rec.rank),
    rankScore: num(rec.rank_score),
    speed: num(rec.speed),
    stamina: num(rec.stamina),
    power: num(rec.power),
    guts: num(rec.guts),
    wit: num(rec.wiz ?? rec.wisdom ?? rec.wit),
    aptitudes: aptitudesFrom(rec),
    skills: skillsFrom(rec),
    sparks,
    family,
    winSaddleCount: saddles,
    createdAt: created.createdAt,
    createdText: created.createdText,
    whiteCount: sparks.filter(
      (spark) => spark.type === 4 && TREE_SLOTS.includes(spark.slot),
    ).length,
    whiteParentCount: selfSparks.filter((spark) => spark.type === 4).length,
  };
}

export function extractRawList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (Array.isArray(rec.trained_chara_array)) return rec.trained_chara_array;
  }
  throw new ParseError("JSON must be an array, or { trained_chara_array: [...] }.");
}

export function parseDump(data: unknown): Veteran[] {
  const list = extractRawList(data);
  const veterans: Veteran[] = [];
  for (let i = 0; i < list.length; i++) {
    const veteran = veteranFromRaw(list[i], i);
    if (veteran) veterans.push(veteran);
  }
  if (veterans.length === 0) {
    throw new ParseError("No veterans with a card_id were found in that file.");
  }
  return veterans;
}

export function parseDumpText(text: string): Veteran[] {
  const trimmed = text.trim();
  if (!trimmed) throw new ParseError("Paste or drop a UmaExtractor JSON dump.");
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new ParseError("That file is not valid JSON.");
  }
  return parseDump(data);
}
