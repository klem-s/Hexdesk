import { useState } from "react";
import { Avatar } from "../Avatar/Avatar";
import { RolePicker } from "../RolePicker/RolePicker";
import type { PartySlotData, Role } from "../../types";
import styles from "./PartySlot.module.css";

interface PartySlotProps {
  player: PartySlotData;
  editable: boolean;
  acceptProgress?: number;
  onRoleChange?: (index: 0 | 1, role: Role) => void;
  onInvite?: () => void;
}

export function PartySlot({ player, editable, acceptProgress, onRoleChange, onInvite }: PartySlotProps) {
  const [editingIndex, setEditingIndex] = useState<0 | 1 | null>(null);

  if (!player) {
    return (
      <button type="button" className={styles.empty} onClick={onInvite}>
        <div className={styles.dashedCircle}>+</div>
        <span className={styles.inviteLabel}>Invite</span>
      </button>
    );
  }

  return (
    <div className={styles.slot}>
      <div className={styles.avatarWrap}>
        <Avatar name={player.name} isMe={player.me} acceptProgress={acceptProgress} />
      </div>
      <div className={styles.name}>
        {player.leader && <span className={styles.crown}>♛</span>}
        {player.name}
      </div>
      <div className={styles.chips}>
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            type="button"
            className={`${styles.chip} ${i === 0 ? styles.filled : ""} ${editable ? styles.editable : ""}`}
            disabled={!editable}
            onClick={() => editable && setEditingIndex(i)}
          >
            {player.roles[i]}
          </button>
        ))}
        {editable && editingIndex !== null && onRoleChange && (
          <RolePicker
            currentRoles={player.roles}
            editingIndex={editingIndex}
            onPick={(role) => onRoleChange(editingIndex, role)}
            onClose={() => setEditingIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
