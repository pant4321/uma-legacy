import { useState } from "react";
import type { AptitudeKey, FamilyMember, Spark, Veteran } from "../types";
import { APTITUDE_LETTERS } from "../types";
import { sparkColor } from "../lib/sparks";
import { UmaIcon } from "./UmaIcon";
import styles from "./HorseCard.module.css";

type Props = {
  veteran: Veteran;
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
  const shown = [...sparks]
    .sort((a, b) => a.type - b.type || b.stars - a.stars)
    .filter((spark) => spark.slot === "self")
    .slice(0, 12);
  return (
    <ul className={styles.sparks}>
      {shown.map((spark) => (
        <li
          key={`${spark.slot}-${spark.factorId}`}
          className={`${styles.pill} ${styles[sparkColor(spark.type)]}`}
        >
          {spark.name} {"★".repeat(spark.stars)}
        </li>
      ))}
    </ul>
  );
}

function FamilyStrip({ family }: { family: FamilyMember[] }) {
  const parents = family.filter((row) => row.slot === "parent1" || row.slot === "parent2");
  if (parents.length === 0) return null;
  return (
    <div className={styles.parents}>
      {parents.map((row) => (
        <span key={row.slot} className={styles.parent}>
          <UmaIcon cardId={row.cardId} name={row.name} size="sm" />
          {row.name}
        </span>
      ))}
    </div>
  );
}

const TREE_SLOTS: { slot: FamilyMember["slot"]; label: string }[] = [
  { slot: "parent1", label: "Parent 1" },
  { slot: "gp11", label: "GP 1-1" },
  { slot: "gp12", label: "GP 1-2" },
  { slot: "parent2", label: "Parent 2" },
  { slot: "gp21", label: "GP 2-1" },
  { slot: "gp22", label: "GP 2-2" },
];

export function HorseCard({ veteran }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <article className={styles.card}>
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
          <SparkPills sparks={veteran.sparks} />
          <FamilyStrip family={veteran.family} />
        </div>
      </button>
      {open ? (
        <div className={styles.details}>
          <p className={styles.apt}>
            {APT_ORDER.map((row) => (
              <span key={row.key}>
                {row.label} {letter(veteran.aptitudes[row.key]) || "-"}
              </span>
            ))}
          </p>
          <div className={styles.tree}>
            {TREE_SLOTS.map((row) => {
              const member = veteran.family.find((item) => item.slot === row.slot);
              if (!member) return null;
              return (
                <div key={row.slot} className={styles.treeNode}>
                  <UmaIcon cardId={member.cardId} name={member.name} size="sm" />
                  <div>
                    <p className={styles.treeLabel}>{row.label}</p>
                    <p>{member.name}</p>
                    <ul className={styles.sparks}>
                      {member.sparks.map((spark) => (
                        <li
                          key={spark.factorId}
                          className={`${styles.pill} ${styles[sparkColor(spark.type)]}`}
                        >
                          {spark.name} {"★".repeat(spark.stars)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
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
