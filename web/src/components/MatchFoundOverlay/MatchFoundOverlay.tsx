import { Avatar } from "../Avatar/Avatar";
import type { PartySlotData } from "../../types";
import styles from "./MatchFoundOverlay.module.css";

interface MatchFoundOverlayProps {
  party: PartySlotData[];
  acceptedSlots: Set<number>;
  localIndex: number;
  countdown: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function MatchFoundOverlay({
  party,
  acceptedSlots,
  localIndex,
  countdown,
  onAccept,
  onDecline,
}: MatchFoundOverlayProps) {
  const localAccepted = acceptedSlots.has(localIndex);

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        <div className={styles.title}>Match Found</div>
        <div className={styles.countdown}>Accept in {countdown}s</div>
        <div className={styles.avatars}>
          {party.map((p, i) =>
            p ? (
              <div key={i} className={styles.avatarCol}>
                <Avatar name={p.name} isMe={p.me} acceptProgress={acceptedSlots.has(i) ? 1 : 0} />
                <span className={styles.avatarName}>{p.name}</span>
              </div>
            ) : null
          )}
        </div>
        <div className={styles.actions}>
          {localAccepted ? (
            <span className={styles.waitingText}>Waiting for others…</span>
          ) : (
            <>
              <button type="button" className={styles.accept} onClick={onAccept}>
                Accept
              </button>
              <button type="button" className={styles.decline} onClick={onDecline}>
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
