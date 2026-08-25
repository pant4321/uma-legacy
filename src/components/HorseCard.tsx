import { useState } from "react";
import type { AptitudeKey, SparkFocus, Veteran } from "../types";
import { APTITUDE_LETTERS } from "../types";
import { parentsOf } from "../lib/filter";
import { formatInheritPct, groupSparkChips, sparkChips } from "../lib/inherit";
import { sparkColor } from "../lib/sparks";
import { UmaIcon } from "./UmaIcon";
import styles from "./HorseCard.module.css";

type Props = {
  veteran: Veteran;
  focus: SparkFocus;
  matchedKeys: Set<string>;
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

function SparkBoard({
  veteran,
  focus,
  matchedKeys,
}: {
  veteran: Veteran;
  focus: SparkFocus;
  matchedKeys: Set<string>;
}) {
  const groups = groupSparkChips(sparkChips(veteran, focus));
  if (groups.length === 0) return null;
  const showParentStars = focus !== "main";

  return (
    <div className={styles.board}>
      {groups.map((group) => {
        const body = (
          <ul className={styles.sparks}>
            {group.chips.map((chip) => {
              const matched = matchedKeys.has(`${chip.type}:${chip.name}`);
              return (
                <li
                  key={`${chip.type}:${chip.name}`}
                  className={`${styles.chip} ${styles[sparkColor(chip.type)]} ${matched ? styles.matched : ""}`}
                  title={`${chip.name}: ${chip.totalStars}★ total, ${formatInheritPct(chip.inheritPct)} inherit over a career`}
                >
                  <span className={styles.chipStars}>
                    {chip.totalStars}
                    <span className={styles.starMark}>★</span>
                  </span>
                  <span className={styles.chipName}>{chip.name}</span>
                  <span className={styles.chipPct}>{formatInheritPct(chip.inheritPct)}</span>
                  {showParentStars && chip.parentStars > 0 ? (
                    <span className={styles.chipParent} title="Main parent stars">
                      👤 {chip.parentStars}★
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        );

        if (group.id === "white" || group.id === "race" || group.id === "scenario") {
          return (
            <details key={group.id} className={styles.group} open>
              <summary>
                {group.label} ({group.chips.length})
              </summary>
              {body}
            </details>
          );
        }

        return (
          <div key={group.id} className={styles.group}>
            <p className={styles.groupLabel}>{group.label}</p>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function HorseCard({ veteran, focus, matchedKeys, onFocus }: Props) {
  const [open, setOpen] = useState(false);
  const parents = parentsOf(veteran);

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
            <span title="Race-title saddles this veteran earned">Saddles {veteran.winSaddleCount}</span>
            <span title="White / race / scenario sparks on the main parent">
              Parent whites {veteran.whiteParentCount}
            </span>
          </p>
        </div>
      </button>
      <SparkBoard veteran={veteran} focus={focus} matchedKeys={matchedKeys} />
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
