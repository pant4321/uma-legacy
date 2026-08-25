import { useEffect, useRef, useState } from "react";
import { cloneFilter } from "../lib/filter";
import { deletePreset, loadPresets, parsePresetFile, upsertPreset } from "../lib/storage";
import type { FilterPreset, FilterState } from "../types";
import styles from "./PresetBar.module.css";

type Props = {
  filter: FilterState;
  onLoad: (filter: FilterState) => void;
};

export function PresetBar({ filter, onLoad }: Props) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadPresets().then(setPresets);
  }, []);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name the filter before saving.");
      return;
    }
    setError(null);
    setPresets(await upsertPreset(trimmed, filter));
    setName("");
  }

  function download() {
    const payload = {
      name: name.trim() || "Uma Legacy filter",
      savedAt: Date.now(),
      filter: cloneFilter(filter),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.name.replace(/[^\w.-]+/g, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function readImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parsePresetFile(JSON.parse(String(reader.result ?? "")));
        if (!parsed) {
          setError("Could not read that filter file.");
          return;
        }
        setError(null);
        if ("filter" in parsed) {
          onLoad(cloneFilter(parsed.filter));
          void upsertPreset(parsed.name, parsed.filter).then(setPresets);
        } else {
          onLoad(cloneFilter(parsed));
        }
      } catch {
        setError("Could not read that filter file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.bar}>
      <div className={styles.saveRow}>
        <input
          type="text"
          value={name}
          placeholder="Name this filter"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void save();
          }}
        />
        <button type="button" onClick={() => void save()}>
          Save
        </button>
        <button type="button" className={styles.ghost} onClick={download}>
          Export
        </button>
        <button type="button" className={styles.ghost} onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className={styles.file}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readImport(file);
            event.target.value = "";
          }}
        />
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {presets.length > 0 ? (
        <ul className={styles.list}>
          {presets.map((preset) => (
            <li key={preset.id}>
              <button type="button" className={styles.load} onClick={() => onLoad(cloneFilter(preset.filter))}>
                {preset.name}
              </button>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Delete ${preset.name}`}
                onClick={() => void deletePreset(preset.id).then(setPresets)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.hint}>Save a named preset, or export a JSON file to reuse later.</p>
      )}
    </div>
  );
}
