import { useMemo } from "react";
import type { FilterState, NodeFilter, NodeKey } from "../types";
import { emptyFilter } from "../lib/filter";
import { uniqueFactorsByTypes, type FactorOption } from "../lib/names";
import { BLUE_KINDS, PINK_KINDS } from "../lib/sparks";
import { FactorGroup } from "./FactorGroup";
import styles from "./FilterPanel.module.css";

type Props = {
  filter: FilterState;
  onChange: (next: FilterState) => void;
  onClearRoster: () => void;
};

const BLUE_CATALOG: FactorOption[] = BLUE_KINDS.map((name) => ({ name, type: 1 }));
const PINK_CATALOG: FactorOption[] = PINK_KINDS.map((row) => ({ name: row.kind, type: 2 }));

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
  return (
    <section className={styles.column}>
      <header className={styles.columnHead}>
        <h3>{title}</h3>
        <p>{hint}</p>
      </header>
      <FactorGroup
        title="Blue Factors (Stats)"
        addLabel="Add Blue Factor"
        placeholder="Find blue factors"
        types={[1]}
        catalog={BLUE_CATALOG}
        sparks={node.sparks}
        onSparks={(sparks) => onNode({ sparks })}
      />
      <FactorGroup
        title="Pink Factors (Aptitude)"
        addLabel="Add Pink Factor"
        placeholder="Find pink factors"
        types={[2]}
        catalog={PINK_CATALOG}
        sparks={node.sparks}
        onSparks={(sparks) => onNode({ sparks })}
      />
      <FactorGroup
        title="Green Factors (Unique)"
        addLabel="Add Green Factor"
        placeholder="Find green factors"
        types={[3]}
        catalog={greens}
        sparks={node.sparks}
        onSparks={(sparks) => onNode({ sparks })}
      />
      <FactorGroup
        title="White Factors (Skills / Races)"
        addLabel="Add White Factor"
        placeholder="Find white factors"
        types={[4, 5, 6]}
        catalog={whites}
        sparks={node.sparks}
        onSparks={(sparks) => onNode({ sparks })}
      />
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
            All looks anywhere on the card. Main Parent only checks the veteran herself.
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
