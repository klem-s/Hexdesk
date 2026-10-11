import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function start() {
  if (import.meta.env.DEV && typeof window.getLobby !== "function") {
    const { installDevMock } = await import("./devMock");
    installDevMock();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

start();
