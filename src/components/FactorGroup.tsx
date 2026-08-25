import { useMemo, useState } from "react";
import type { FactorOption } from "../lib/names";
import { newSparkRule, removeSparkRule, updateSparkRule } from "../lib/filter";
import type { SparkRule } from "../types";
import styles from "./FactorGroup.module.css";

type Props = {
  title: string;
  addLabel: string;
  placeholder: string;
  types: SparkRule["type"][];
  catalog: FactorOption[];
  sparks: SparkRule[];
  onSparks: (next: SparkRule[]) => void;
};

function FactorRow({
  rule,
  placeholder,
  catalog,
  taken,
  onChange,
  onRemove,
}: {
  rule: SparkRule;
  placeholder: string;
  catalog: FactorOption[];
  taken: Set<string>;
  onChange: (patch: Partial<SparkRule>) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const query = open ? text : rule.kind || text;
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((row) => {
        const key = `${row.type}:${row.name}`;
        if (taken.has(key) && !(row.type === rule.type && row.name === rule.kind)) return false;
        if (!q) return true;
        return row.name.toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [catalog, query, rule.kind, rule.type, taken]);

  return (
    <div className={styles.row}>
      <div className={styles.search}>
        <input
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={!rule.kind}
          onFocus={() => {
            setOpen(true);
            setText(rule.kind);
          }}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            if (!event.target.value) onChange({ kind: "" });
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
        <button type="button" className={styles.remove} onClick={onRemove} aria-label="Remove factor">
          ×
        </button>
        {open ? (
          <ul className={styles.menu} role="listbox">
            {hits.map((row) => (
              <li key={`${row.type}:${row.name}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({ kind: row.name, type: row.type as SparkRule["type"] });
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
      </div>
      <div className={styles.sliderBlock}>
        <input
          className={styles.slider}
          type="range"
          min={1}
          max={3}
          step={1}
          value={rule.minStars}
          aria-label="Minimum stars"
          onChange={(event) => onChange({ minStars: Number(event.target.value) })}
        />
        <div className={styles.starMarks} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= rule.minStars ? styles.starOn : styles.starOff}>
              {"★".repeat(n)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FactorGroup({
  title,
  addLabel,
  placeholder,
  types,
  catalog,
  sparks,
  onSparks,
}: Props) {
  const rows = sparks.filter((rule) => types.includes(rule.type));
  const taken = new Set(
    rows.filter((rule) => rule.kind).map((rule) => `${rule.type}:${rule.kind}`),
  );

  return (
    <div className={styles.group}>
      <p className={styles.title}>{title}</p>
      {rows.map((rule) => (
        <FactorRow
          key={rule.id}
          rule={rule}
          placeholder={placeholder}
          catalog={catalog}
          taken={taken}
          onChange={(patch) => onSparks(updateSparkRule(sparks, rule.id, patch))}
          onRemove={() => onSparks(removeSparkRule(sparks, rule.id))}
        />
      ))}
      <button
        type="button"
        className={styles.add}
        onClick={() => onSparks([...sparks, newSparkRule(types[0] ?? 4)])}
      >
        <span aria-hidden="true">+</span> {addLabel}
      </button>
    </div>
  );
}
