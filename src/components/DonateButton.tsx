import styles from "./DonateButton.module.css";

const KO_FI_URL = "https://ko-fi.com/pant4321/donate";

export function DonateButton() {
  return (
    <a
      href={KO_FI_URL}
      className={styles.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support the developer on Ko-fi (opens in a new tab)"
    >
      <span className={styles.icon} aria-hidden="true">
        ☕
      </span>
      Support
    </a>
  );
}
