import type { FilterPreset, FilterState, Veteran } from "../types";
import { cloneFilter, normalizeFilter } from "./filter";
import { parseDump } from "./parseDump";

const DB_NAME = "uma-legacy";
const DB_VERSION = 2;
const ROSTER_STORE = "roster";
const PRESET_STORE = "presets";
const ROSTER_KEY = "veterans";
const PRESET_KEY = "list";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ROSTER_STORE)) db.createObjectStore(ROSTER_STORE);
      if (!db.objectStoreNames.contains(PRESET_STORE)) db.createObjectStore(PRESET_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRoster(veterans: Veteran[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ROSTER_STORE, "readwrite");
    tx.objectStore(ROSTER_STORE).put(veterans, ROSTER_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadRoster(): Promise<Veteran[] | null> {
  const db = await openDb();
  const veterans = await new Promise<Veteran[] | null>((resolve, reject) => {
    const tx = db.transaction(ROSTER_STORE, "readonly");
    const req = tx.objectStore(ROSTER_STORE).get(ROSTER_KEY);
    req.onsuccess = () => {
      const value = req.result;
      resolve(Array.isArray(value) ? (value as Veteran[]) : null);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return veterans;
}

export async function clearRoster(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ROSTER_STORE, "readwrite");
    tx.objectStore(ROSTER_STORE).delete(ROSTER_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function reviveRoster(value: unknown): Veteran[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value[0] && typeof value[0] === "object" && "cardId" in value[0] && "sparks" in value[0]) {
    return value as Veteran[];
  }
  try {
    return parseDump(value);
  } catch {
    return null;
  }
}

function asPreset(raw: unknown): FilterPreset | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const filter = normalizeFilter(rec.filter);
  if (!filter) return null;
  return {
    id: typeof rec.id === "string" && rec.id ? rec.id : crypto.randomUUID(),
    name: typeof rec.name === "string" && rec.name.trim() ? rec.name.trim() : "Untitled",
    savedAt: typeof rec.savedAt === "number" ? rec.savedAt : Date.now(),
    filter,
  };
}

export async function loadPresets(): Promise<FilterPreset[]> {
  const db = await openDb();
  const rows = await new Promise<FilterPreset[]>((resolve, reject) => {
    const tx = db.transaction(PRESET_STORE, "readonly");
    const req = tx.objectStore(PRESET_STORE).get(PRESET_KEY);
    req.onsuccess = () => {
      const value = req.result;
      resolve(Array.isArray(value) ? value.map(asPreset).filter((row): row is FilterPreset => row !== null) : []);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => b.savedAt - a.savedAt);
}

async function writePresets(presets: FilterPreset[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PRESET_STORE, "readwrite");
    tx.objectStore(PRESET_STORE).put(presets, PRESET_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function upsertPreset(name: string, filter: FilterState): Promise<FilterPreset[]> {
  const trimmed = name.trim();
  if (!trimmed) return loadPresets();
  const current = await loadPresets();
  const existing = current.find((row) => row.name.toLowerCase() === trimmed.toLowerCase());
  const next: FilterPreset = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmed,
    savedAt: Date.now(),
    filter: cloneFilter(filter),
  };
  const presets = existing
    ? current.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current];
  await writePresets(presets);
  return presets.sort((a, b) => b.savedAt - a.savedAt);
}

export async function deletePreset(id: string): Promise<FilterPreset[]> {
  const presets = (await loadPresets()).filter((row) => row.id !== id);
  await writePresets(presets);
  return presets;
}

export function parsePresetFile(raw: unknown): FilterPreset | FilterState | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const asSaved = asPreset(rec);
  if (asSaved) return asSaved;
  return normalizeFilter(raw);
}
