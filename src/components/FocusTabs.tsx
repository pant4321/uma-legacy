import type { SparkFocus } from "../types";
import { FOCUS_LABELS } from "../types";
import styles from "./FocusTabs.module.css";

type Props = {
  value: SparkFocus;
  onChange: (focus: SparkFocus) => void;
};

export function FocusTabs({ value, onChange }: Props) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Spark focus">
      {FOCUS_LABELS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          title={tab.title}
          aria-selected={value === tab.id}
          className={`${styles.tab} ${value === tab.id ? styles.on : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
