import type { Veteran } from "../types";
import { parseDump } from "./parseDump";

const DB_NAME = "uma-legacy";
const STORE = "roster";
const KEY = "veterans";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRoster(veterans: Veteran[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(veterans, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadRoster(): Promise<Veteran[] | null> {
  const db = await openDb();
  const veterans = await new Promise<Veteran[] | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
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
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
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
