import type { CSSProperties } from "react";
import styles from "./Avatar.module.css";

const PALETTES: [string, string][] = [
  ["#3a4f7a", "#1c2740"],
  ["#4f3a7a", "#271c40"],
  ["#2f6b5c", "#163a30"],
  ["#7a4f3a", "#402718"],
  ["#3a6b7a", "#163640"],
];

function paletteFor(name: string): [string, string] {
  const hash = name.split("").reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7);
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  isMe?: boolean;
  acceptProgress?: number;
}

export function Avatar({ name, size = 76, isMe, acceptProgress }: AvatarProps) {
  const [c1, c2] = paletteFor(name);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const style = {
    "--size": `${size}px`,
    "--c1": c1,
    "--c2": c2,
    "--progress": acceptProgress ?? 0,
  } as CSSProperties;

  return (
    <div className={`${styles.wrap} ${isMe ? styles.me : ""}`} style={style}>
      <div className={`${styles.ring} ${acceptProgress ? styles.visible : ""}`} />
      <div className={styles.circle}>{initial}</div>
    </div>
  );
}
