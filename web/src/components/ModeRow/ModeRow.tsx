import type { ReactElement } from "react";
import type { ModeDef } from "../../types";
import styles from "./ModeRow.module.css";

const GRADIENTS: Record<number, string> = {
  420: "linear-gradient(160deg, #31405f 0%, #121722 70%)",
  440: "linear-gradient(160deg, #2a3f5a 0%, #121722 70%)",
  490: "linear-gradient(160deg, #1f4a45 0%, #121722 70%)",
  450: "linear-gradient(160deg, #22435a 0%, #121722 70%)",
  1700: "linear-gradient(160deg, #452a52 0%, #121722 70%)",
};

const ICONS: Record<number, ReactElement> = {
  420: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <path d="M12 2l7 3v6c0 5-3.2 8.2-7 11-3.8-2.8-7-6-7-11V5l7-3z" stroke="#e8bb4e" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4.5" stroke="#e8bb4e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  440: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <path d="M8 2l6 2.5v5C14 13.5 11.5 16 8 18c-3.5-2-6-4.5-6-8.5v-5L8 2z" stroke="#7fb4ea" strokeWidth="1.5" />
      <path d="M14 7l6-2.5v5c0 4-2.5 6.5-6 8.5" stroke="#7fb4ea" strokeWidth="1.5" strokeOpacity="0.55" />
    </svg>
  ),
  490: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#35d6b8" />
    </svg>
  ),
  450: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <path
        d="M12 2v20M4 7l16 10M20 7L4 17M12 2l-2.5 3M12 2l2.5 3M12 22l-2.5-3M12 22l2.5-3"
        stroke="#9fd6ea"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  1700: (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
      <path d="M12 2l10 10-10 10L2 12z" stroke="#d98ae8" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" fill="#d98ae8" />
    </svg>
  ),
};

function ModeArt({ id }: { id: number }) {
  return (
    <div className={styles.art} style={{ background: GRADIENTS[id] ?? GRADIENTS[420] }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {ICONS[id] ?? null}
      </div>
    </div>
  );
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ModeRowProps {
  modes: ModeDef[];
  selectedId: number;
  onSelect: (id: number) => void;
  locked: boolean;
  elapsed: number;
  canCancel: boolean;
  onCancel: () => void;
}

export function ModeRow({ modes, selectedId, onSelect, locked, elapsed, canCancel, onCancel }: ModeRowProps) {
  const selected = modes.find((m) => m.id === selectedId) ?? modes[0];

  if (locked) {
    return (
      <div className={styles.row}>
        <div className={styles.searchStrip}>
          <span className={styles.searchLabel}>{selected.name}</span>
          <span className={styles.searchTime}>{formatElapsed(elapsed)}</span>
          {canCancel && (
            <button type="button" className={styles.cancelBtn} onClick={onCancel} aria-label="Cancel search">
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      {modes.map((mode) => {
        if (mode.id === selected.id) {
          return (
            <div key={mode.id} className={`${styles.tile} ${styles.expanded}`}>
              <div className={styles.expandedArt}>
                <ModeArt id={mode.id} />
              </div>
              <div className={styles.expandedInfo}>
                <div className={styles.modeName}>{mode.name}</div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={mode.id}
            className={`${styles.tile} ${styles.collapsed}`}
            onClick={() => onSelect(mode.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(mode.id)}
          >
            <ModeArt id={mode.id} />
            <span className={styles.label}>{mode.name}</span>
          </div>
        );
      })}
    </div>
  );
}
