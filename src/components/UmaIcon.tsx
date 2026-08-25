import { useState } from "react";
import { characterIconUrl } from "../lib/names";
import styles from "./UmaIcon.module.css";

type Props = {
  cardId: number;
  name: string;
  size?: "sm" | "md" | "lg";
};

export function UmaIcon({ cardId, name, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  if (failed || !cardId) {
    return (
      <span className={`${styles.fallback} ${styles[size]}`} aria-hidden="true">
        {letter}
      </span>
    );
  }
  return (
    <img
      className={`${styles.img} ${styles[size]}`}
      src={characterIconUrl(cardId)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
