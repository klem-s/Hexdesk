import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptReady,
  cancelSearch,
  declineReady,
  findMatch,
  getLobby,
  getReadyCheck,
  getSearchState,
  selectQueue as callSelectQueue,
  setRolePreferences as callSetRolePreferences,
  type RawMember,
} from "../lcu";
import { LCU_TO_ROLE, ROLE_TO_LCU, type MatchState, type PartySlotData, type Player, type Role } from "../types";

const POLL_MS = 1200;

function toPlayer(m: RawMember): Player {
  return {
    summonerId: m.summonerId,
    name: m.name || "Summoner",
    leader: m.isLeader,
    me: m.isLocal,
    roles: [LCU_TO_ROLE[m.firstPosition] ?? "FILL", LCU_TO_ROLE[m.secondPosition] ?? "FILL"],
  };
}

export function useHexdesk() {
  const [party, setParty] = useState<PartySlotData[]>([null, null, null, null, null]);
  const [queueId, setQueueId] = useState<number | null>(null);
  const [inLobby, setInLobby] = useState(false);
  const [state, setState] = useState<MatchState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [localAccepted, setLocalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawLobby, setRawLobby] = useState<unknown>(null);

  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: number;

    async function poll() {
      if (stopped.current) return;
      try {
        const [lobby, search, ready] = await Promise.all([getLobby(), getSearchState(), getReadyCheck()]);
        if (stopped.current) return;

        if (lobby.error) {
          setError(lobby.error);
        } else {
          setError(null);
          setInLobby(lobby.inLobby);
          setQueueId(lobby.inLobby ? lobby.queueId : null);
          setRawLobby(lobby.raw);
          const slots: PartySlotData[] = lobby.members.map(toPlayer);
          while (slots.length < 5) slots.push(null);
          setParty(slots);
        }

        if (ready.state === "InProgress") {
          setState("found");
          setCountdown(Math.max(0, Math.round(ready.timer)));
          setLocalAccepted(ready.playerResponse === "Accepted");
        } else if (search.state === "Searching") {
          setState("searching");
          setElapsed(Math.round(search.timeInQueue));
          setLocalAccepted(false);
        } else {
          setState("idle");
          setLocalAccepted(false);
        }
      } catch (e) {
        if (!stopped.current) setError(String(e));
      } finally {
        if (!stopped.current) timer = window.setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, []);

  const selectQueue = useCallback((id: number) => {
    callSelectQueue(id).catch(() => {});
  }, []);

  const setRole = useCallback(
    (chipIndex: 0 | 1, role: Role) => {
      const me = party.find((p) => p?.me);
      if (!me) return;
      const roles: [Role, Role] = [...me.roles] as [Role, Role];
      roles[chipIndex] = role;
      callSetRolePreferences(ROLE_TO_LCU[roles[0]], ROLE_TO_LCU[roles[1]]).catch(() => {});
    },
    [party]
  );

  const start = useCallback(() => {
    findMatch().catch(() => {});
  }, []);
  const cancel = useCallback(() => {
    cancelSearch().catch(() => {});
  }, []);
  const accept = useCallback(() => {
    acceptReady().catch(() => {});
  }, []);
  const decline = useCallback(() => {
    declineReady().catch(() => {});
  }, []);

  const localIndex = party.findIndex((p) => p?.me);
  const acceptedSlots = new Set<number>(localAccepted && localIndex >= 0 ? [localIndex] : []);

  return {
    party,
    queueId,
    inLobby,
    state,
    elapsed,
    countdown,
    acceptedSlots,
    localIndex,
    error,
    rawLobby,
    selectQueue,
    setRole,
    start,
    cancel,
    accept,
    decline,
  };
}
