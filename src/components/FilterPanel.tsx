import { useMemo, useState } from "react";
import type { FilterState, SparkRule, SparkWhere, Veteran } from "../types";
import { APTITUDE_LETTERS } from "../types";
import { cycleStars, emptyFilter, upsertSparkRule } from "../lib/filter";
import { allCharacters, uniqueFactorsByType } from "../lib/names";
import { BLUE_KINDS, PINK_KINDS } from "../lib/sparks";
import styles from "./FilterPanel.module.css";

type Props = {
  veterans: Veteran[];
  filter: FilterState;
  onChange: (next: FilterState) => void;
  onClearRoster: () => void;
};

const WHERE_OPTIONS: { value: SparkWhere; label: string }[] = [
  { value: "any", label: "Anywhere" },
  { value: "self", label: "Self" },
  { value: "parent1", label: "Parent 1" },
  { value: "parent2", label: "Parent 2" },
  { value: "grandparents", label: "Grandparents" },
];

function starsFor(sparks: SparkRule[], type: SparkRule["type"], kind: string): number {
  return sparks.find((rule) => rule.type === type && rule.kind === kind)?.minStars ?? 0;
}

function StarButton({
  label,
  stars,
  tone,
  onCycle,
}: {
  label: string;
  stars: number;
  tone: "blue" | "pink";
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${styles[tone]} ${stars ? styles.on : ""}`}
      onClick={onCycle}
      aria-pressed={stars > 0}
    >
      <span>{label}</span>
      <span className={styles.stars}>{stars ? "★".repeat(stars) : "☆"}</span>
    </button>
  );
}

function Combobox({
  label,
  valueId,
  options,
  onChange,
}: {
  label: string;
  valueId: number | null;
  options: { charaId: number; name: string }[];
  onChange: (charaId: number | null) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((row) => row.charaId === valueId);
  const query = open ? text : selected?.name ?? text;
  const hits = options
    .filter((row) => row.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  return (
    <label className={styles.field}>
      {label}
      <input
        value={query}
        placeholder="Any"
        onFocus={() => {
          setOpen(true);
          setText(selected?.name ?? "");
        }}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          if (!event.target.value) onChange(null);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {valueId !== null ? (
        <button
          type="button"
          className={styles.clearMini}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setText("");
            onChange(null);
          }}
        >
          Clear
        </button>
      ) : null}
      {open ? (
        <ul className={styles.menu}>
          {hits.map((row) => (
            <li key={row.charaId}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(row.charaId);
                  setText(row.name);
                  setOpen(false);
                }}
              >
                {row.name}
              </button>
            </li>
          ))}
          {hits.length === 0 ? <li className={styles.empty}>No matches</li> : null}
        </ul>
      ) : null}
    </label>
  );
}

function SparkSearch({
  label,
  type,
  catalog,
  filter,
  onChange,
}: {
  label: string;
  type: 3 | 4;
  catalog: { name: string; type: number }[];
  filter: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const [query, setQuery] = useState("");
  const hits = catalog
    .filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 12);
  const selected = filter.sparks.filter((rule) => rule.type === type);

  return (
    <div className={styles.block}>
      <p className={styles.blockTitle}>{label}</p>
      {selected.map((rule) => (
        <div key={rule.kind} className={styles.sparkRow}>
          <span>
            {rule.kind} {"★".repeat(rule.minStars)}
          </span>
          {filter.advanced ? (
            <select
              value={rule.where}
              onChange={(event) =>
                onChange({
                  ...filter,
                  sparks: filter.sparks.map((item) =>
                    item.type === type && item.kind === rule.kind
                      ? { ...item, where: event.target.value as SparkWhere }
                      : item,
                  ),
                })
              }
            >
              {WHERE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className={styles.clearMini}
            onClick={() =>
              onChange({
                ...filter,
                sparks: upsertSparkRule(filter.sparks, type, rule.kind, 0),
              })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <input
        value={query}
        placeholder={`Search ${label.toLowerCase()}`}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim() ? (
        <ul className={styles.menu}>
          {hits.map((row) => (
            <li key={row.name}>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...filter,
                    sparks: upsertSparkRule(filter.sparks, type, row.name, 1),
                  });
                  setQuery("");
                }}
              >
                {row.name}
              </button>
            </li>
          ))}
          {hits.length === 0 ? <li className={styles.empty}>No matches</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

export function FilterPanel({ veterans, filter, onChange, onClearRoster }: Props) {
  const owned = useMemo(() => {
    const ids = new Set(veterans.map((v) => v.charaId));
    return allCharacters().filter((row) => ids.has(row.charaId));
  }, [veterans]);
  const parentOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const veteran of veterans) {
      for (const member of veteran.family) ids.add(member.charaId);
    }
    return allCharacters().filter((row) => ids.has(row.charaId));
  }, [veterans]);
  const whites = useMemo(() => uniqueFactorsByType(4), []);
  const greens = useMemo(() => uniqueFactorsByType(3), []);

  function setSpark(type: SparkRule["type"], kind: string, minStars: number) {
    onChange({ ...filter, sparks: upsertSparkRule(filter.sparks, type, kind, minStars) });
  }

  function setWhere(type: SparkRule["type"], kind: string, where: SparkWhere) {
    onChange({
      ...filter,
      sparks: filter.sparks.map((rule) =>
        rule.type === type && rule.kind === kind ? { ...rule, where } : rule,
      ),
    });
  }

  const activeBlues = BLUE_KINDS.filter((kind) => starsFor(filter.sparks, 1, kind) > 0);
  const activePinks = PINK_KINDS.filter((row) => starsFor(filter.sparks, 2, row.kind) > 0);

  return (
    <aside className={styles.panel}>
      <div className={styles.top}>
        <h2>Filters</h2>
        <button type="button" className={styles.clearMini} onClick={() => onChange(emptyFilter())}>
          Reset
        </button>
      </div>

      <label className={styles.field}>
        Search
        <input
          value={filter.query}
          placeholder="Name, skill, spark, parent"
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
        />
      </label>

      <Combobox
        label="Character"
        valueId={filter.charaId}
        options={owned}
        onChange={(charaId) => onChange({ ...filter, charaId })}
      />
      <Combobox
        label="Parent"
        valueId={filter.parentCharaId}
        options={parentOptions}
        onChange={(parentCharaId) => onChange({ ...filter, parentCharaId })}
      />

      <div className={styles.block}>
        <p className={styles.blockTitle}>Blue sparks</p>
        <div className={styles.chips}>
          {BLUE_KINDS.map((kind) => (
            <StarButton
              key={kind}
              label={kind}
              tone="blue"
              stars={starsFor(filter.sparks, 1, kind)}
              onCycle={() => setSpark(1, kind, cycleStars(starsFor(filter.sparks, 1, kind)))}
            />
          ))}
        </div>
      </div>

      <div className={styles.block}>
        <p className={styles.blockTitle}>Pink sparks</p>
        <div className={styles.chips}>
          {PINK_KINDS.map((row) => (
            <StarButton
              key={row.kind}
              label={row.label}
              tone="pink"
              stars={starsFor(filter.sparks, 2, row.kind)}
              onCycle={() => setSpark(2, row.kind, cycleStars(starsFor(filter.sparks, 2, row.kind)))}
            />
          ))}
        </div>
      </div>

      {filter.advanced ? (
        <div className={styles.block}>
          <p className={styles.blockTitle}>Spark slots</p>
          {[...activeBlues.map((kind) => ({ type: 1 as const, kind })), ...activePinks.map((row) => ({ type: 2 as const, kind: row.kind }))].map(
            (row) => (
              <label key={`${row.type}-${row.kind}`} className={styles.sparkRow}>
                {row.kind}
                <select
                  value={
                    filter.sparks.find((rule) => rule.type === row.type && rule.kind === row.kind)
                      ?.where ?? "any"
                  }
                  onChange={(event) =>
                    setWhere(row.type, row.kind, event.target.value as SparkWhere)
                  }
                >
                  {WHERE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
        </div>
      ) : null}

      <SparkSearch
        label="Green uniques"
        type={3}
        catalog={greens}
        filter={filter}
        onChange={onChange}
      />
      <SparkSearch
        label="White skills"
        type={4}
        catalog={whites}
        filter={filter}
        onChange={onChange}
      />

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={filter.advanced}
          onChange={(event) => onChange({ ...filter, advanced: event.target.checked })}
        />
        Advanced slot targeting
      </label>

      <label className={styles.field}>
        Sort
        <select
          value={filter.sort}
          onChange={(event) =>
            onChange({ ...filter, sort: event.target.value as FilterState["sort"] })
          }
        >
          <option value="rankScore">Rank score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="whiteCount">White sparks</option>
          <option value="g1">Win saddles</option>
          <option value="speed">Speed</option>
          <option value="stamina">Stamina</option>
          <option value="power">Power</option>
          <option value="guts">Guts</option>
          <option value="wit">Wit</option>
        </select>
      </label>

      <details className={styles.more}>
        <summary>More filters</summary>
        <label className={styles.field}>
          Min rank score
          <input
            type="number"
            min={0}
            value={filter.minRankScore ?? ""}
            onChange={(event) =>
              onChange({
                ...filter,
                minRankScore: event.target.value === "" ? null : Number(event.target.value),
              })
            }
          />
        </label>
        {(["speed", "stamina", "power", "guts", "wit"] as const).map((stat) => (
          <label key={stat} className={styles.field}>
            Min {stat}
            <input
              type="number"
              min={0}
              value={filter.minStats[stat] ?? ""}
              onChange={(event) =>
                onChange({
                  ...filter,
                  minStats: {
                    ...filter.minStats,
                    [stat]: event.target.value === "" ? null : Number(event.target.value),
                  },
                })
              }
            />
          </label>
        ))}
        <label className={styles.field}>
          Min turf
          <select
            value={filter.minAptitudes.turf ?? ""}
            onChange={(event) =>
              onChange({
                ...filter,
                minAptitudes: {
                  ...filter.minAptitudes,
                  turf: event.target.value === "" ? undefined : Number(event.target.value),
                },
              })
            }
          >
            <option value="">Any</option>
            {APTITUDE_LETTERS.map((letter, index) =>
              index === 0 ? null : (
                <option key={letter} value={index}>
                  {letter}+
                </option>
              ),
            )}
          </select>
        </label>
      </details>

      <button type="button" className={styles.danger} onClick={onClearRoster}>
        Clear loaded dump
      </button>
    </aside>
  );
}
