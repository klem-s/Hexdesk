import type { ModeDef } from "./types";

// Mirrors the Go side's queue constants in lobby.go, confirmed against
// Riot's own published queues.json — not a guess.
export const QUEUES: ModeDef[] = [
  { id: 420, name: "Ranked Solo/Duo" },
  { id: 440, name: "Ranked Flex" },
  { id: 490, name: "Quickplay" },
  { id: 450, name: "ARAM" },
  { id: 1700, name: "Arena" },
];
