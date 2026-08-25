import characters from "../data/characters.json";
import skills from "../data/skills.json";
import factors from "../data/factors.json";

type CharacterEntry = {
  name: string;
  cards: Record<string, string>;
};

type SkillEntry = {
  name: string;
  category: string;
  iconId: number;
};

type FactorEntry = {
  id: number;
  name: string;
  type: number;
  stars: number;
};

const characterMap = characters as Record<string, CharacterEntry>;
const skillMap = skills as Record<string, SkillEntry>;
const factorList = factors as FactorEntry[];

const factorById = new Map<number, FactorEntry>();
for (const factor of factorList) {
  factorById.set(factor.id, factor);
}

export function charaIdFromCard(cardId: number): number {
  return Math.floor(cardId / 100);
}

export function characterName(charaId: number): string {
  return characterMap[String(charaId)]?.name ?? `Uma ${charaId}`;
}

export function cardTitle(cardId: number): string {
  const charaId = charaIdFromCard(cardId);
  const title = characterMap[String(charaId)]?.cards[String(cardId)];
  return title ?? "";
}

export function displayName(cardId: number): { name: string; title: string } {
  const charaId = charaIdFromCard(cardId);
  return {
    name: characterName(charaId),
    title: cardTitle(cardId),
  };
}

export function skillName(skillId: number): string {
  return skillMap[String(skillId)]?.name ?? `Skill ${skillId}`;
}

export function skillIconId(skillId: number): number {
  return skillMap[String(skillId)]?.iconId ?? 0;
}

export function skillCategory(skillId: number): string {
  return skillMap[String(skillId)]?.category ?? "Unknown";
}

export function factorByFactorId(id: number): FactorEntry | undefined {
  return factorById.get(id);
}

export function allCharacters(): { charaId: number; name: string }[] {
  return Object.entries(characterMap)
    .map(([id, entry]) => ({ charaId: Number(id), name: entry.name }))
    .filter((row) => row.charaId >= 1000 && row.charaId < 2000)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type FactorOption = { name: string; type: number };

export function uniqueFactorsByTypes(types: number[]): FactorOption[] {
  const wanted = new Set(types);
  const seen = new Set<string>();
  const rows: FactorOption[] = [];
  for (const factor of factorList) {
    if (!wanted.has(factor.type)) continue;
    const key = `${factor.type}:${factor.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ name: factor.name, type: factor.type });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export function uniqueFactorsByType(type: number): FactorOption[] {
  return uniqueFactorsByTypes([type]);
}

export function characterIconUrl(cardId: number): string {
  const charaId = charaIdFromCard(cardId);
  return `https://uma.guide/icon/uma/chr_icon_${charaId}_${cardId}_01.webp`;
}

export function skillIconUrl(iconId: number): string {
  if (!iconId) return "";
  return `https://uma.guide/icon/skill/utx_ico_skill_${iconId}.webp`;
}
