import { useEffect, useMemo, useState } from "react";
import sample from "./data/sample-roster.json";
import { FilterPanel } from "./components/FilterPanel";
import { HorseGrid } from "./components/HorseGrid";
import { UploadPanel } from "./components/UploadPanel";
import { applyFilter, emptyFilter } from "./lib/filter";
import { ParseError, parseDump, parseDumpText } from "./lib/parseDump";
import { clearRoster, loadRoster, saveRoster } from "./lib/storage";
import type { FilterState, Veteran } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [veterans, setVeterans] = useState<Veteran[] | null>(null);
  const [filter, setFilter] = useState<FilterState>(emptyFilter);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    loadRoster()
      .then((stored) => {
        if (stored && stored.length > 0) setVeterans(stored);
      })
      .finally(() => setReady(true));
  }, []);

  function accept(next: Veteran[]) {
    setVeterans(next);
    setError(null);
    setFilter(emptyFilter());
    void saveRoster(next);
  }

  function loadText(text: string) {
    try {
      accept(parseDumpText(text));
    } catch (err) {
      setError(err instanceof ParseError ? err.message : "Could not read that dump.");
    }
  }

  const filtered = useMemo(
    () => (veterans ? applyFilter(veterans, filter) : []),
    [veterans, filter],
  );

  if (!ready) {
    return <p className={styles.boot}>Loading saved roster…</p>;
  }

  if (!veterans) {
    return (
      <UploadPanel
        error={error}
        onText={loadText}
        onLoadSample={() => accept(parseDump(sample))}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <div>
          <p className={styles.kicker}>Uma Legacy</p>
          <strong>{veterans.length} loaded</strong>
        </div>
        <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? "Hide filters" : "Show filters"}
        </button>
      </header>
      <div className={styles.body}>
        {menuOpen ? (
          <FilterPanel
            veterans={veterans}
            filter={filter}
            onChange={setFilter}
            onClearRoster={() => {
              setVeterans(null);
              setFilter(emptyFilter());
              void clearRoster();
            }}
          />
        ) : null}
        <HorseGrid
          veterans={filtered}
          total={veterans.length}
          focus={filter.focus}
          onFocus={(focus) => setFilter({ ...filter, focus })}
        />
      </div>
    </div>
  );
}
