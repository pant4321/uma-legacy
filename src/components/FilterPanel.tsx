import { useMemo, useState } from "react";
import type { FilterState, NodeFilter, NodeKey, SparkFocus, SparkRule, Veteran } from "../types";
import { APTITUDE_LETTERS } from "../types";
import { FocusTabs } from "./FocusTabs";
import { cycleStars, editingNode, emptyFilter, nodeHasRules, upsertSparkRule } from "../lib/filter";
import { allCharacters, uniqueFactorsByType } from "../lib/names";
import { BLUE_KINDS, PINK_KINDS } from "../lib/sparks";
import styles from "./FilterPanel.module.css";

type Props = {
  veterans: Veteran[];
  filter: FilterState;
  onChange: (next: FilterState) => void;
  onClearRoster: () => void;
};

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
  sparks,
  onSparks,
}: {
  label: string;
  type: 3 | 4;
  catalog: { name: string; type: number }[];
  sparks: SparkRule[];
  onSparks: (next: SparkRule[]) => void;
}) {
  const [query, setQuery] = useState("");
  const hits = catalog
    .filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 12);
  const selected = sparks.filter((rule) => rule.type === type);

  return (
    <div className={styles.block}>
      <p className={styles.blockTitle}>{label}</p>
      {selected.map((rule) => (
        <div key={rule.kind} className={styles.sparkRow}>
          <span>
            {rule.kind} {"★".repeat(rule.minStars)}
          </span>
          <button
            type="button"
            className={styles.clearMini}
            onClick={() => onSparks(upsertSparkRule(sparks, type, rule.kind, 0))}
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
                  onSparks(upsertSparkRule(sparks, type, row.name, 1));
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

const NODE_COPY: Record<
  SparkFocus,
  { character: string; sparks: string }
> = {
  all: { character: "Main parent", sparks: "Anywhere on main or either grandparent" },
  main: { character: "Main parent", sparks: "On the main parent only" },
  gp1: { character: "Grandparent 1", sparks: "On grandparent 1 only" },
  gp2: { character: "Grandparent 2", sparks: "On grandparent 2 only" },
};

function updateNode(filter: FilterState, key: NodeKey, node: NodeFilter): FilterState {
  return { ...filter, [key]: node };
}

export function FilterPanel({ veterans, filter, onChange, onClearRoster }: Props) {
  const nodeKey = editingNode(filter.focus);
  const sparkTarget = filter.focus === "all" ? filter.tree : filter[filter.focus];
  const charaTarget = filter.focus === "gp1" || filter.focus === "gp2" ? filter[filter.focus] : filter.main;

  const owned = useMemo(() => {
    const ids = new Set(veterans.map((v) => v.charaId));
    return allCharacters().filter((row) => ids.has(row.charaId));
  }, [veterans]);
  const gp1Options = useMemo(() => {
    const ids = new Set<number>();
    for (const veteran of veterans) {
      const parent = veteran.family.find((row) => row.slot === "parent1");
      if (parent) ids.add(parent.charaId);
    }
    return allCharacters().filter((row) => ids.has(row.charaId));
  }, [veterans]);
  const gp2Options = useMemo(() => {
    const ids = new Set<number>();
    for (const veteran of veterans) {
      const parent = veteran.family.find((row) => row.slot === "parent2");
      if (parent) ids.add(parent.charaId);
    }
    return allCharacters().filter((row) => ids.has(row.charaId));
  }, [veterans]);
  const whites = useMemo(() => uniqueFactorsByType(4), []);
  const greens = useMemo(() => uniqueFactorsByType(3), []);

  const charaOptions =
    filter.focus === "gp1" ? gp1Options : filter.focus === "gp2" ? gp2Options : owned;

  function setFocus(focus: SparkFocus) {
    onChange({ ...filter, focus });
  }

  function setSparks(sparks: SparkRule[]) {
    const key = editingNode(filter.focus);
    onChange(updateNode(filter, key, { ...filter[key], sparks }));
  }

  function setChara(charaId: number | null) {
    const key: NodeKey = filter.focus === "gp1" || filter.focus === "gp2" ? filter.focus : "main";
    onChange(updateNode(filter, key, { ...filter[key], charaId }));
  }

  function setSpark(type: SparkRule["type"], kind: string, minStars: number) {
    setSparks(upsertSparkRule(sparkTarget.sparks, type, kind, minStars));
  }

  const otherNodes = (
    [
      ["tree", "All"],
      ["main", "Main"],
      ["gp1", "GP 1"],
      ["gp2", "GP 2"],
    ] as const
  ).filter(([key]) => key !== nodeKey && nodeHasRules(filter[key]));

  const copy = NODE_COPY[filter.focus];

  return (
    <aside className={styles.panel}>
      <div className={styles.top}>
        <h2>Filters</h2>
        <button type="button" className={styles.clearMini} onClick={() => onChange(emptyFilter())}>
          Reset
        </button>
      </div>

      <FocusTabs value={filter.focus} onChange={setFocus} />
      <p className={styles.hint}>{copy.sparks}</p>

      <label className={styles.field}>
        Search
        <input
          value={filter.query}
          placeholder="Name, skill, spark, parent"
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
        />
      </label>

      <Combobox
        label={copy.character}
        valueId={charaTarget.charaId}
        options={charaOptions}
        onChange={setChara}
      />

      <div className={styles.block}>
        <p className={styles.blockTitle}>Blue sparks</p>
        <div className={styles.chips}>
          {BLUE_KINDS.map((kind) => (
            <StarButton
              key={kind}
              label={kind}
              tone="blue"
              stars={starsFor(sparkTarget.sparks, 1, kind)}
              onCycle={() => setSpark(1, kind, cycleStars(starsFor(sparkTarget.sparks, 1, kind)))}
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
              stars={starsFor(sparkTarget.sparks, 2, row.kind)}
              onCycle={() => setSpark(2, row.kind, cycleStars(starsFor(sparkTarget.sparks, 2, row.kind)))}
            />
          ))}
        </div>
      </div>

      <SparkSearch
        label="Green uniques"
        type={3}
        catalog={greens}
        sparks={sparkTarget.sparks}
        onSparks={setSparks}
      />
      <SparkSearch
        label="White skills"
        type={4}
        catalog={whites}
        sparks={sparkTarget.sparks}
        onSparks={setSparks}
      />

      {otherNodes.length > 0 ? (
        <div className={styles.other}>
          <p className={styles.blockTitle}>Also required</p>
          {otherNodes.map(([key, label]) => {
            const extra = filter[key];
            const bits = [
              extra.charaId ? allCharacters().find((row) => row.charaId === extra.charaId)?.name : null,
              ...extra.sparks.map((rule) => `${rule.kind} ${"★".repeat(rule.minStars)}`),
            ].filter(Boolean);
            return (
              <p key={key} className={styles.otherRow}>
                <button type="button" className={styles.clearMini} onClick={() => setFocus(key === "tree" ? "all" : key)}>
                  {label}
                </button>
                {bits.join(" · ")}
              </p>
            );
          })}
        </div>
      ) : null}

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
