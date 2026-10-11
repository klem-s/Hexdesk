import { useState } from "react";
import { Lobby } from "./Lobby";
import { Wallet } from "./Wallet";
import styles from "./App.module.css";

type Tab = "lobby" | "wallet";

function App() {
  const [tab, setTab] = useState<Tab>("lobby");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>Hexdesk</h1>
        <nav className={styles.tabs}>
          <button type="button" className={tab === "lobby" ? styles.active : ""} onClick={() => setTab("lobby")}>
            Lobby
          </button>
          <button type="button" className={tab === "wallet" ? styles.active : ""} onClick={() => setTab("wallet")}>
            Wallet
          </button>
        </nav>
      </header>
      <div className={styles.pane}>{tab === "lobby" ? <Lobby /> : <Wallet />}</div>
    </div>
  );
}

export default App;
