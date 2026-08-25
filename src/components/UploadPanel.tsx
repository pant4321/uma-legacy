import { useState } from "react";
import styles from "./UploadPanel.module.css";

type Props = {
  error: string | null;
  onText: (text: string) => void;
  onLoadSample: () => void;
};

export function UploadPanel({ error, onText, onLoadSample }: Props) {
  const [paste, setPaste] = useState("");
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => onText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <section className={styles.wrap}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Local roster</p>
        <h1>Search your veterans</h1>
        <p className={styles.lede}>
          Upload a dump from{" "}
          <a href="https://github.com/xancia/UmaExtractor">UmaExtractor</a>. Run
          it while the game is on the Veteran List screen (Enhance → List). The
          file never leaves this browser.
        </p>
      </header>

      <label
        className={`${styles.drop} ${dragging ? styles.dragging : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) readFile(file);
        }}
      >
        <input
          type="file"
          accept="application/json,.json"
          className={styles.file}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readFile(file);
          }}
        />
        <strong>Drop data.json here</strong>
        <span>or click to choose a file</span>
      </label>

      <label className={styles.pasteLabel}>
        Paste JSON
        <textarea
          className={styles.paste}
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder='[{ "card_id": 100101, ... }]'
          rows={6}
        />
      </label>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => onText(paste)}>
          Load paste
        </button>
        <button type="button" className={styles.ghost} onClick={onLoadSample}>
          Load sample roster
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}
