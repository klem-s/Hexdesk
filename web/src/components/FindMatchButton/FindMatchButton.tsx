import { useState } from "react";
import styles from "./FindMatchButton.module.css";

interface FindMatchButtonProps {
  isLeader: boolean;
  disabledReason: string | null;
  onClick: () => void;
}

export function FindMatchButton({ isLeader, disabledReason, onClick }: FindMatchButtonProps) {
  const [hover, setHover] = useState(false);

  if (!isLeader) {
    return (
      <div className={styles.wrap}>
        <span className={styles.waiting}>Waiting for leader…</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {hover && disabledReason && <div className={styles.tooltip}>{disabledReason}</div>}
      <button
        type="button"
        className={styles.pill}
        disabled={!!disabledReason}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        Find Match
      </button>
    </div>
  );
}
