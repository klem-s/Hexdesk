// Real LCU position-preference values (see lobby.go on the Go side). FILL is
// a UI sentinel only — there's no such LCU value, it maps to "" (no
// preference) when sent, and "" maps back to FILL when displayed.
export type Role = "TOP" | "JGL" | "MID" | "BOT" | "SUP" | "FILL";

export const ROLES: Role[] = ["TOP", "JGL", "MID", "BOT", "SUP", "FILL"];

// Go's firstPosition/secondPosition <-> this app's short Role codes.
export const LCU_TO_ROLE: Record<string, Role> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MIDDLE: "MID",
  BOTTOM: "BOT",
  UTILITY: "SUP",
  "": "FILL",
};
export const ROLE_TO_LCU: Record<Role, string> = {
  TOP: "TOP",
  JGL: "JUNGLE",
  MID: "MIDDLE",
  BOT: "BOTTOM",
  SUP: "UTILITY",
  FILL: "",
};

export interface Player {
  summonerId: number;
  name: string;
  leader: boolean;
  me: boolean;
  roles: [Role, Role];
}

export type PartySlotData = Player | null;

export interface ModeDef {
  id: number;
  name: string;
}

export type MatchState = "idle" | "searching" | "found";
