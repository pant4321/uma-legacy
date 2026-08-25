import { useState } from "react";
import type { AptitudeKey, Spark, SparkFocus, Veteran } from "../types";
import { APTITUDE_LETTERS } from "../types";
import { parentsOf, sparksForFocus } from "../lib/filter";
import { sparkColor } from "../lib/sparks";
import { UmaIcon } from "./UmaIcon";
import styles from "./HorseCard.module.css";

type Props = {
  veteran: Veteran;
  focus: SparkFocus;
  onFocus: (focus: SparkFocus) => void;
};

const APT_ORDER: { key: AptitudeKey; label: string }[] = [
  { key: "turf", label: "Turf" },
  { key: "dirt", label: "Dirt" },
  { key: "short", label: "Sprint" },
  { key: "mile", label: "Mile" },
  { key: "middle", label: "Med" },
  { key: "long", label: "Long" },
  { key: "nige", label: "Front" },
  { key: "senko", label: "Pace" },
  { key: "sashi", label: "Late" },
  { key: "oikomi", label: "End" },
];

function letter(value: number): string {
  return APTITUDE_LETTERS[value] ?? "";
}

function SparkPills({ sparks }: { sparks: Spark[] }) {
  if (sparks.length === 0) return null;
  return (
    <ul className={styles.sparks}>
      {sparks.map((spark) => (
        <li
          key={`${spark.slot}-${spark.factorId}-${spark.name}`}
          className={`${styles.pill} ${styles[sparkColor(spark.type)]}`}
        >
          {spark.name} {"★".repeat(spark.stars)}
        </li>
      ))}
    </ul>
  );
}

export function HorseCard({ veteran, focus, onFocus }: Props) {
  const [open, setOpen] = useState(false);
  const parents = parentsOf(veteran);
  const shownSparks = sparksForFocus(veteran, focus);

  return (
    <article className={`${styles.card} ${open ? styles.open : ""}`}>
      <button type="button" className={styles.main} onClick={() => setOpen((value) => !value)}>
        <UmaIcon cardId={veteran.cardId} name={veteran.name} size="lg" />
        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <h3>{veteran.name}</h3>
            <span className={styles.rank}>{veteran.rankScore.toLocaleString()}</span>
          </div>
          {veteran.title ? <p className={styles.subtitle}>{veteran.title}</p> : null}
          <p className={styles.stats}>
            <span>Spd {veteran.speed}</span>
            <span>Sta {veteran.stamina}</span>
            <span>Pow {veteran.power}</span>
            <span>Gut {veteran.guts}</span>
            <span>Wit {veteran.wit}</span>
          </p>
          <SparkPills sparks={shownSparks} />
        </div>
      </button>
      <div className={styles.parents}>
        {parents.gp1 ? (
          <button
            type="button"
            className={`${styles.parent} ${focus === "gp1" ? styles.parentOn : ""}`}
            onClick={() => onFocus("gp1")}
          >
            <UmaIcon cardId={parents.gp1.cardId} name={parents.gp1.name} size="sm" />
            <span>
              <span className={styles.parentLabel}>GP 1</span>
              {parents.gp1.name}
            </span>
          </button>
        ) : null}
        {parents.gp2 ? (
          <button
            type="button"
            className={`${styles.parent} ${focus === "gp2" ? styles.parentOn : ""}`}
            onClick={() => onFocus("gp2")}
          >
            <UmaIcon cardId={parents.gp2.cardId} name={parents.gp2.name} size="sm" />
            <span>
              <span className={styles.parentLabel}>GP 2</span>
              {parents.gp2.name}
            </span>
          </button>
        ) : null}
      </div>
      {open ? (
        <div className={styles.details}>
          <p className={styles.apt}>
            {APT_ORDER.map((row) => (
              <span key={row.key}>
                {row.label} {letter(veteran.aptitudes[row.key]) || "-"}
              </span>
            ))}
          </p>
          <ul className={styles.skills}>
            {veteran.skills.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
