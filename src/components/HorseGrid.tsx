import { useEffect, useRef, useState } from "react";
import type { SortKey, Veteran } from "../types";
import { HorseCard } from "./HorseCard";
import styles from "./HorseGrid.module.css";

const PAGE = 30;

type Props = {
  veterans: Veteran[];
  total: number;
  query: string;
  sort: SortKey;
  onQuery: (query: string) => void;
  onSort: (sort: SortKey) => void;
};

export function HorseGrid({ veterans, total, query, sort, onQuery, onSort }: Props) {
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
        <label className={styles.search}>
          Search
          <input
            value={query}
            placeholder="Name, skill, spark, parent"
            onChange={(event) => onQuery(event.target.value)}
          />
        </label>
        <label className={styles.search}>
          Sort
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as SortKey)}
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
        <p className={styles.count}>
          {veterans.length} of {total} veterans
        </p>
      </div>
      {visible.length === 0 ? (
        <p className={styles.empty}>No veterans match those filters.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((veteran) => (
            <HorseCard key={veteran.id} veteran={veteran} />
          ))}
        </div>
      )}
      <div ref={sentinel} className={styles.sentinel} />
    </section>
  );
}
