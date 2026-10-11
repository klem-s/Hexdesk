// Dev-only stand-in for the Go bindings, so `npm run dev` is usable without
// a running League client. Mirrors the exact contract main.go exposes:
// every window.<fn>() resolves to a JSON *string*. Never bundled into the
// production (Hexdesk-embedded) build — see the import.meta.env.DEV guard
// in main.tsx, which Vite dead-code-eliminates for `vite build`.
import type { RawLobby, RawMember, RawReadyCheck, RawSearchState, RawWallet } from "./lcu";

const ok = (v: unknown) => JSON.stringify(v);

let members: RawMember[] = [
  { summonerId: 1, name: "You#EUW", isLeader: true, firstPosition: "MIDDLE", secondPosition: "UTILITY", isLocal: true },
  { summonerId: 2, name: "Rook#EUW", isLeader: false, firstPosition: "TOP", secondPosition: "JUNGLE", isLocal: false },
  { summonerId: 3, name: "Nyx#EUW", isLeader: false, firstPosition: "JUNGLE", secondPosition: "MIDDLE", isLocal: false },
];
let queueId = 420;

let searchState: RawSearchState["state"] = "Invalid";
let searchStarted = 0;
let readyState: RawReadyCheck["state"] = "Invalid";
let readyDeadline = 0;
const accepted = new Set<number>();

function tickBots() {
  if (readyState !== "InProgress") return;
  for (const m of members) {
    if (m.isLocal || accepted.has(m.summonerId)) continue;
    if (Math.random() < 0.15) accepted.add(m.summonerId);
  }
  if (accepted.size >= members.length) {
    readyState = "Invalid";
    accepted.clear();
    searchState = "Invalid";
  }
}

export function installDevMock() {
  window.getLobby = async () =>
    ok({
      inLobby: true,
      queueId,
      isLeader: members.find((m) => m.isLocal)?.isLeader ?? false,
      members,
      raw: { mocked: true },
    } satisfies RawLobby);

  window.getSearchState = async () => {
    tickBots();
    if (searchState === "Searching" && Date.now() - searchStarted > 4000) {
      searchState = "Invalid";
      readyState = "InProgress";
      readyDeadline = Date.now() + 10000;
    }
    if (readyState === "InProgress" && Date.now() > readyDeadline) {
      readyState = "Invalid";
      accepted.clear();
    }
    return ok({
      state: searchState,
      timeInQueue: searchState === "Searching" ? (Date.now() - searchStarted) / 1000 : 0,
      estimatedSec: 90,
      raw: { mocked: true },
    } satisfies RawSearchState);
  };

  window.getReadyCheck = async () => {
    const me = members.find((m) => m.isLocal);
    const mine = !!me && accepted.has(me.summonerId);
    return ok({
      state: readyState,
      playerResponse: mine ? "Accepted" : "None",
      timer: readyState === "InProgress" ? Math.max(0, (readyDeadline - Date.now()) / 1000) : 0,
    } satisfies RawReadyCheck);
  };

  window.findMatch = async () => {
    searchState = "Searching";
    searchStarted = Date.now();
    return ok({ ok: true });
  };
  window.cancelSearch = async () => {
    searchState = "Invalid";
    return ok({ ok: true });
  };
  window.acceptReady = async () => {
    const me = members.find((m) => m.isLocal);
    if (me) accepted.add(me.summonerId);
    return ok({ ok: true });
  };
  window.declineReady = async () => {
    readyState = "Invalid";
    accepted.clear();
    return ok({ ok: true });
  };
  window.selectQueue = async (id: number) => {
    queueId = id;
    return ok({ ok: true });
  };
  window.setRolePreferences = async (first: string, second: string) => {
    const me = members.find((m) => m.isLocal);
    if (me) {
      me.firstPosition = first;
      me.secondPosition = second;
    }
    return ok({ ok: true });
  };

  window.getWallet = async () =>
    ok({ rp: 1830, blueEssence: 12450, source: "mock", raw: { mocked: true } } satisfies RawWallet);
}
