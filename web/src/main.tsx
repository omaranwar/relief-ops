// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { setApiBase } from "./lib/apiClient";

async function bootstrap() {
  // 1) Prefer env var from .env.local
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "");

  // 2) Fallback to /config.json if env not provided
  let cfgBase: string | undefined;
  if (!envBase) {
    try {
      const res = await fetch("/config.json");
      if (res.ok) {
        const cfg = await res.json();
        cfgBase = (cfg?.apiBaseUrl as string | undefined)?.replace(/\/$/, "");
        // eslint-disable-next-line no-console
        console.log("ReliefOps config loaded:", cfg);
      } else {
        // eslint-disable-next-line no-console
        console.warn("No /config.json or not ok:", res.status);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load /config.json", e);
    }
  }

  // 3) Apply base (env wins), can be empty to allow absolute URLs in callers
  const base = envBase || cfgBase || "";
  setApiBase(base);

  // TEMP sanity log (remove later)
  // eslint-disable-next-line no-console
  console.log("API BASE in use =", base || "(empty) — callers must use absolute URLs");

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();