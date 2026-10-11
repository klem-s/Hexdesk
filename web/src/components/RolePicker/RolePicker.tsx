import { useEffect } from "react";
import { ROLES, type Role } from "../../types";
import styles from "./RolePicker.module.css";

interface RolePickerProps {
  currentRoles: [Role, Role];
  editingIndex: 0 | 1;
  onPick: (role: Role) => void;
  onClose: () => void;
}

export function RolePicker({ currentRoles, editingIndex, onPick, onClose }: RolePickerProps) {
  const otherRole = currentRoles[editingIndex === 0 ? 1 : 0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.popover} role="listbox" aria-label="Choose role">
        {ROLES.map((role) => {
          const disabled = role === otherRole;
          return (
            <button
              key={role}
              type="button"
              className={`${styles.option} ${role === currentRoles[editingIndex] ? styles.selected : ""}`}
              disabled={disabled}
              onClick={() => {
                onPick(role);
                onClose();
              }}
            >
              {role}
            </button>
          );
        })}
      </div>
    </>
  );
}
