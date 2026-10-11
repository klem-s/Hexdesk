import { ModeRow } from "./components/ModeRow/ModeRow";
import { PartySlot } from "./components/PartySlot/PartySlot";
import { FindMatchButton } from "./components/FindMatchButton/FindMatchButton";
import { MatchFoundOverlay } from "./components/MatchFoundOverlay/MatchFoundOverlay";
import { useHexdesk } from "./hooks/useHexdesk";
import { QUEUES } from "./queues";
import type { PartySlotData } from "./types";
import styles from "./Lobby.module.css";

function disabledReason(party: PartySlotData[], queueId: number): string | null {
  const filled = party.filter((p): p is NonNullable<PartySlotData> => !!p);
  const duplicate = filled.find((p) => p.roles[0] === p.roles[1]);
  if (duplicate) return `${duplicate.name} needs two different roles`;
  if (queueId === 420 && filled.length === 4) return "Ranked Solo/Duo doesn't allow a party of 4";
  return null;
}

export function Lobby() {
  const {
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
  } = useHexdesk();

  const me = party.find((p) => p?.me);
  const isLeader = me?.leader ?? false;
  const selectedQueueId = queueId ?? QUEUES[0].id;
  const reason = !inLobby ? "Pick a queue to create a lobby" : disabledReason(party, selectedQueueId);
  const locked = state !== "idle";

  return (
    <div className={styles.page}>
      {error && <div className={styles.errorBar}>{error}</div>}

      <ModeRow
        modes={QUEUES}
        selectedId={selectedQueueId}
        onSelect={selectQueue}
        locked={locked}
        elapsed={elapsed}
        canCancel={state === "searching" && isLeader}
        onCancel={cancel}
      />

      <div className={styles.partyRow}>
        {party.map((p, i) => (
          <PartySlot
            key={p?.summonerId ?? `empty-${i}`}
            player={p}
            editable={!!p?.me}
            onRoleChange={p?.me ? (chipIndex, role) => setRole(chipIndex, role) : undefined}
          />
        ))}
      </div>

      <div className={styles.footer}>
        {state === "idle" && <FindMatchButton isLeader={isLeader} disabledReason={reason} onClick={start} />}
      </div>

      {state === "found" && (
        <MatchFoundOverlay
          party={party}
          acceptedSlots={acceptedSlots}
          localIndex={localIndex}
          countdown={countdown}
          onAccept={accept}
          onDecline={decline}
        />
      )}

      <div className={styles.notice}>
        Party chat isn't shown here — connecting to League's chat system falls under Riot's "don't connect to
        systems not included in third-party tools" policy, so this stays in the official client.
      </div>
      <details className={styles.raw}>
        <summary>Raw lobby data</summary>
        <pre>{rawLobby ? JSON.stringify(rawLobby, null, 2) : "—"}</pre>
      </details>
    </div>
  );
}
