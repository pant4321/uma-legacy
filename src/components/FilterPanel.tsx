import { useMemo } from "react";
import type { FactorOption } from "../lib/names";
import { uniqueFactorsByTypes } from "../lib/names";
import {
  addGroup,
  describeNode,
  emptyFilter,
  removeGroup,
  updateGroup,
} from "../lib/filter";
import { BLUE_KINDS, PINK_KINDS } from "../lib/sparks";
import type { FilterState, JoinMode, NodeFilter, NodeKey, SparkGroup } from "../types";
import { FactorGroup } from "./FactorGroup";
import { PresetBar } from "./PresetBar";
import styles from "./FilterPanel.module.css";

type Props = {
  filter: FilterState;
  onChange: (next: FilterState) => void;
  onClearRoster: () => void;
};

const BLUE_CATALOG: FactorOption[] = BLUE_KINDS.map((name) => ({ name, type: 1 }));
const PINK_CATALOG: FactorOption[] = PINK_KINDS.map((row) => ({ name: row.kind, type: 2 }));

function JoinToggle({
  value,
  onChange,
  andLabel,
  orLabel,
}: {
  value: JoinMode;
  onChange: (join: JoinMode) => void;
  andLabel: string;
  orLabel: string;
}) {
  return (
    <div className={styles.join} role="group">
      <button
        type="button"
        className={value === "and" ? styles.joinOn : ""}
        aria-pressed={value === "and"}
        onClick={() => onChange("and")}
      >
        {andLabel}
      </button>
      <button
        type="button"
        className={value === "or" ? styles.joinOn : ""}
        aria-pressed={value === "or"}
        onClick={() => onChange("or")}
      >
        {orLabel}
      </button>
    </div>
  );
}

function Combination({
  index,
  total,
  group,
  greens,
  whites,
  onGroup,
  onRemove,
}: {
  index: number;
  total: number;
  group: SparkGroup;
  greens: FactorOption[];
  whites: FactorOption[];
  onGroup: (group: SparkGroup) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.combo}>
      <header className={styles.comboHead}>
        <strong>Combination {index + 1}</strong>
        <JoinToggle
          value={group.join}
          onChange={(join) => onGroup({ ...group, join })}
          andLabel="All (AND)"
          orLabel="Any (OR)"
        />
        {total > 1 ? (
          <button type="button" className={styles.clearMini} onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </header>
      <FactorGroup
        title="Blue Factors (Stats)"
        addLabel="Add Blue Factor"
        placeholder="Find blue factors"
        types={[1]}
        catalog={BLUE_CATALOG}
        sparks={group.sparks}
        onSparks={(sparks) => onGroup({ ...group, sparks })}
      />
      <FactorGroup
        title="Pink Factors (Aptitude)"
        addLabel="Add Pink Factor"
        placeholder="Find pink factors"
        types={[2]}
        catalog={PINK_CATALOG}
        sparks={group.sparks}
        onSparks={(sparks) => onGroup({ ...group, sparks })}
      />
      <FactorGroup
        title="Green Factors (Unique)"
        addLabel="Add Green Factor"
        placeholder="Find green factors"
        types={[3]}
        catalog={greens}
        sparks={group.sparks}
        onSparks={(sparks) => onGroup({ ...group, sparks })}
      />
      <FactorGroup
        title="White Factors (Skills / Races)"
        addLabel="Add White Factor"
        placeholder="Find white factors"
        types={[4, 5, 6]}
        catalog={whites}
        sparks={group.sparks}
        onSparks={(sparks) => onGroup({ ...group, sparks })}
      />
    </div>
  );
}

function FactorColumn({
  title,
  hint,
  node,
  onNode,
  greens,
  whites,
}: {
  title: string;
  hint: string;
  node: NodeFilter;
  onNode: (node: NodeFilter) => void;
  greens: FactorOption[];
  whites: FactorOption[];
}) {
  const summary = describeNode(node);

  return (
    <section className={styles.column}>
      <header className={styles.columnHead}>
        <h3>{title}</h3>
        <p>{hint}</p>
        <JoinToggle
          value={node.join}
          onChange={(join) => onNode({ ...node, join })}
          andLabel="Every combo (AND)"
          orLabel="Any combo (OR)"
        />
        {summary ? <p className={styles.summary}>{summary}</p> : null}
      </header>
      {node.groups.map((group, index) => (
        <Combination
          key={group.id}
          index={index}
          total={node.groups.length}
          group={group}
          greens={greens}
          whites={whites}
          onGroup={(next) => onNode(updateGroup(node, group.id, next))}
          onRemove={() => onNode(removeGroup(node, group.id))}
        />
      ))}
      <button type="button" className={styles.addCombo} onClick={() => onNode(addGroup(node))}>
        + Add combination
      </button>
    </section>
  );
}

export function FilterPanel({ filter, onChange, onClearRoster }: Props) {
  const greens = useMemo(() => uniqueFactorsByTypes([3]), []);
  const whites = useMemo(() => uniqueFactorsByTypes([4, 5, 6]), []);

  function setNode(key: NodeKey, node: NodeFilter) {
    onChange({ ...filter, [key]: node });
  }

  return (
    <section className={styles.panel}>
      <div className={styles.top}>
        <div>
          <h2>Property Filters</h2>
          <p className={styles.lead}>
            Factors in a combination can be All (AND) or Any (OR). Multiple combinations then combine with Every/Any.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.clearMini} onClick={() => onChange(emptyFilter())}>
            Reset
          </button>
          <button type="button" className={styles.danger} onClick={onClearRoster}>
            Clear loaded dump
          </button>
        </div>
      </div>
      <PresetBar filter={filter} onLoad={onChange} />
      <div className={styles.columns}>
        <FactorColumn
          title="All"
          hint="Spark on the parent or either grandparent"
          node={filter.tree}
          onNode={(node) => setNode("tree", node)}
          greens={greens}
          whites={whites}
        />
        <FactorColumn
          title="Main Parent"
          hint="Spark on the main parent only"
          node={filter.main}
          onNode={(node) => setNode("main", node)}
          greens={greens}
          whites={whites}
        />
      </div>
    </section>
  );
}
