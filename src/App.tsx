import { useEffect, useMemo, useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { HorseGrid } from "./components/HorseGrid";
import { UploadPanel } from "./components/UploadPanel";
import { applyFilter, emptyFilter, enrichVeterans } from "./lib/filter";
import { matchedSparkKeys } from "./lib/inherit";
import { ParseError, parseDumpText } from "./lib/parseDump";
import { clearRoster, loadRoster, saveRoster } from "./lib/storage";
import type { FilterState, SparkFocus, Veteran } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [veterans, setVeterans] = useState<Veteran[] | null>(null);
  const [filter, setFilter] = useState<FilterState>(emptyFilter);
  const [focus, setFocus] = useState<SparkFocus>("all");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    loadRoster()
      .then((stored) => {
        if (stored && stored.length > 0) {
          const enriched = enrichVeterans(stored);
          setVeterans(enriched);
          void saveRoster(enriched);
        }
      })
      .finally(() => setReady(true));
  }, []);

  function accept(next: Veteran[]) {
    const enriched = enrichVeterans(next);
    setVeterans(enriched);
    setError(null);
    setFilter(emptyFilter());
    void saveRoster(enriched);
  }

  function loadText(text: string) {
    try {
      accept(parseDumpText(text));
    } catch (err) {
      setError(err instanceof ParseError ? err.message : "Could not read that dump.");
    }
  }

  async function loadSample() {
    setSampleLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample-data.json`);
      if (!response.ok) {
        throw new Error(`Could not load sample data (${response.status}).`);
      }
      loadText(await response.text());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sample data.");
    } finally {
      setSampleLoading(false);
    }
  }

  const filtered = useMemo(
    () => (veterans ? applyFilter(veterans, filter) : []),
    [veterans, filter],
  );

  const matchedKeys = useMemo(() => matchedSparkKeys(filter), [filter]);

  if (!ready) {
    return <p className={styles.boot}>Loading saved roster…</p>;
  }

  if (!veterans) {
    return (
      <UploadPanel
        error={error}
        sampleLoading={sampleLoading}
        onText={loadText}
        onLoadSample={() => void loadSample()}
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
      {menuOpen ? (
        <FilterPanel
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
        query={filter.query}
        sort={filter.sort}
        focus={focus}
        matchedKeys={matchedKeys}
        onQuery={(query) => setFilter({ ...filter, query })}
        onSort={(sort) => setFilter({ ...filter, sort })}
        onFocus={setFocus}
      />
    </div>
  );
}
