import { useEffect, useRef, useState } from "react";
import { getWallet } from "./lcu";
import type { RawWallet } from "./lcu";
import styles from "./Wallet.module.css";

const POLL_MS = 5000;

export function Wallet() {
  const [data, setData] = useState<RawWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: number;
    async function poll() {
      if (stopped.current) return;
      try {
        const w = await getWallet();
        if (stopped.current) return;
        if (w.error) setError(w.error);
        else {
          setError(null);
          setData(w);
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

  return (
    <div className={styles.page}>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.currencies}>
            <div className={`${styles.currency} ${styles.rp}`}>
              <p className={styles.label}>RP</p>
              <p className={styles.value}>{data ? Math.round(data.rp).toLocaleString() : "—"}</p>
            </div>
            <div className={styles.currency}>
              <p className={styles.label}>Blue Essence</p>
              <p className={styles.value}>{data ? Math.round(data.blueEssence).toLocaleString() : "—"}</p>
            </div>
          </div>
          {data && <div className={styles.source}>source: {data.source}</div>}
        </>
      )}
      <details className={styles.raw}>
        <summary>Raw response</summary>
        <pre>{data ? JSON.stringify(data.raw, null, 2) : "—"}</pre>
      </details>
    </div>
  );
}
