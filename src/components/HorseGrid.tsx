import { useEffect, useRef, useState } from "react";
import type { SparkFocus, Veteran } from "../types";
import { FocusTabs } from "./FocusTabs";
import { HorseCard } from "./HorseCard";
import styles from "./HorseGrid.module.css";

const PAGE = 30;

type Props = {
  veterans: Veteran[];
  total: number;
  focus: SparkFocus;
  onFocus: (focus: SparkFocus) => void;
};

export function HorseGrid({ veterans, total, focus, onFocus }: Props) {
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShown(PAGE);
  }, [veterans]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShown((count) => Math.min(count + PAGE, veterans.length));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [veterans.length]);

  const visible = veterans.slice(0, shown);

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.count}>
          {veterans.length} of {total} veterans
        </p>
        <FocusTabs value={focus} onChange={onFocus} />
      </div>
      {visible.length === 0 ? (
        <p className={styles.empty}>No veterans match those filters.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((veteran) => (
            <HorseCard key={veteran.id} veteran={veteran} focus={focus} onFocus={onFocus} />
          ))}
        </div>
      )}
      <div ref={sentinel} className={styles.sentinel} />
    </section>
  );
}
