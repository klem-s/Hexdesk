// Thin typed wrapper over the Go bindings exposed on `window` via
// webview.Bind (see main.go). Each bound function returns a Promise
// resolving to a JSON *string* (the Go side marshals its own return value),
// so every call here needs a JSON.parse — this file is the one place that
// knows that.

export interface RawMember {
  summonerId: number;
  name: string;
  isLeader: boolean;
  firstPosition: string;
  secondPosition: string;
  isLocal: boolean;
}

export interface RawLobby {
  inLobby: boolean;
  queueId: number;
  isLeader: boolean;
  members: RawMember[];
  raw: unknown;
  error?: string;
}

export interface RawSearchState {
  state: string; // "Invalid" | "Searching" | "Found" | "Error"
  timeInQueue: number;
  estimatedSec: number;
  raw: unknown;
  error?: string;
}

export interface RawReadyCheck {
  state: string; // "Invalid" | "InProgress" | "Accepted" | "Declined"
  playerResponse: string; // the local player's own response: "None" | "Accepted" | "Declined"
  timer: number; // seconds left to respond
  error?: string;
}

export interface RawWallet {
  rp: number;
  blueEssence: number;
  raw: unknown;
  source: string;
  error?: string;
}

declare global {
  interface Window {
    getWallet?: () => Promise<string>;
    getLobby?: () => Promise<string>;
    getSearchState?: () => Promise<string>;
    getReadyCheck?: () => Promise<string>;
    findMatch?: () => Promise<string>;
    cancelSearch?: () => Promise<string>;
    acceptReady?: () => Promise<string>;
    declineReady?: () => Promise<string>;
    selectQueue?: (queueId: number) => Promise<string>;
    setRolePreferences?: (first: string, second: string) => Promise<string>;
  }
}

// True once main.tsx has confirmed the Go bindings exist (either for real,
// inside WebView2, or via the dev-only mock — see devMock.ts).
export function hasBindings(): boolean {
  return typeof window.getLobby === "function";
}

async function call<T>(fn: (() => Promise<string>) | undefined): Promise<T> {
  if (!fn) throw new Error("not running inside Hexdesk");
  return JSON.parse(await fn()) as T;
}

export const getWallet = () => call<RawWallet>(window.getWallet);
export const getLobby = () => call<RawLobby>(window.getLobby);
export const getSearchState = () => call<RawSearchState>(window.getSearchState);
export const getReadyCheck = () => call<RawReadyCheck>(window.getReadyCheck);
export const findMatch = () => call<{ ok?: boolean; error?: string }>(window.findMatch);
export const cancelSearch = () => call<{ ok?: boolean; error?: string }>(window.cancelSearch);
export const acceptReady = () => call<{ ok?: boolean; error?: string }>(window.acceptReady);
export const declineReady = () => call<{ ok?: boolean; error?: string }>(window.declineReady);

export const selectQueue = (queueId: number) =>
  call<{ ok?: boolean; error?: string }>(() => window.selectQueue!(queueId));

export const setRolePreferences = (first: string, second: string) =>
  call<{ ok?: boolean; error?: string }>(() => window.setRolePreferences!(first, second));
