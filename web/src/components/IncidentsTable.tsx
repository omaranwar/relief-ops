import { get } from "../lib/apiClient";
import { useEffect, useState, useCallback } from "react";

type IncidentRow = {
  id: string;
  region: string;
  type: string;
  priority: string;
  status: string;
  peopleAffected?: number;
  etaMinutes?: number;
  lastUpdated?: string;
};

type Props = {
  onView?: (id: string) => void;
  onRunPlan?: (id: string) => void; // App reads & shows the plan panel
  onChanged?: () => void;
};

/** Resolve the API base the same way App.tsx does */
function apiBase(): string {
  const w: any = window as any;
  return w.__RELIEFOPS_API_BASE__ || (import.meta as any).env?.VITE_API_BASE || "";
}

/** Ultra-explicit POST JSON (bypasses apiClient for these calls) */
async function postJson<T = any>(path: string, body: any): Promise<T> {
  const url = apiBase() + path;
  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain",
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await resp.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }

  if (!resp.ok) {
    // surface the backend reason (we saw "incidentId required" etc.)
    const reason =
      data?.error ||
      data?.message ||
      (typeof data === "string" ? data : JSON.stringify(data)) ||
      text ||
      `HTTP ${resp.status}`;
    const err = new Error(reason) as any;
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

function explainError(e: any): string {
  if (!e) return "Unknown error";
  if (e.message) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function IncidentsTable({ onView, onRunPlan, onChanged }: Props) {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const all = await get<IncidentRow[]>("/v1/incidents");
    setRows(all);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    r.id?.toLowerCase().includes(s) ||
    r.region?.toLowerCase().includes(s) ||
    r.type?.toLowerCase().includes(s) ||
    r.status?.toLowerCase().includes(s) ||
    r.priority?.toLowerCase().includes(s)
  );
});


  /** Generate/refresh plan for a specific incident */
  async function runPlanFor(id: string) {
    try {
      // Be ultra-robust: provide id in BOTH query and body
      const qs = `/v1/actionPlan?incidentId=${encodeURIComponent(id)}`;
      await postJson(qs, { incidentId: id });

      onRunPlan?.(id); // let the App read & show the plan panel
      onChanged?.();   // e.g. KPI refresh
      await load();    // ETA/Updated might change
      alert(`Plan generated for ${id}`);
    } catch (e: any) {
      alert(`Failed to run plan.\n\n${explainError(e)}`);
    }
  }

  /** Recalculate ETA – try path-param route, then body route as fallback */
  async function recalcEta(id: string) {
    try {
      // Primary (path param) route
      await postJson(`/v1/incidents/${encodeURIComponent(id)}/recalcEta`, {});
    } catch (e: any) {
      // If backend insists on body-based incidentId, fall back gracefully
      try {
        await postJson(`/v1/eta/recalc`, { incidentId: id });
      } catch (e2: any) {
        alert(`Failed to recalc ETA.\n\n${explainError(e2)}`);
        return;
      }
    }
    await load();
  }

  async function closeIncident(id: string) {
    try {
      await postJson("/v1/incidents/close", { id });
      onChanged?.();
      await load();
      alert(`Closed ${id}`);
    } catch (e: any) {
      alert(`Failed to close incident.\n\n${explainError(e)}`);
    }
  }

  async function deleteIncident(id: string) {
    if (!confirm(`Delete incident ${id}? This cannot be undone.`)) return;
    try {
      await postJson("/v1/incidents/delete", { id });
      onChanged?.();
      await load();
      alert(`Deleted ${id}`);
    } catch (e: any) {
      alert(`Failed to delete incident.\n\n${explainError(e)}`);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold dark:text-slate-100">Incidents</h2>
        <div className="flex items-center gap-2">
          <input
            className="rounded-xl border px-3 py-2 w-64 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            placeholder="Search incidents"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:text-slate-100"
            onClick={load}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600 dark:text-slate-300">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Region</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Priority</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">ETA (min)</th>
              <th className="py-2 px-3">Updated</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t dark:border-slate-700">
                <td className="py-2 px-3 font-medium dark:text-slate-100">{r.id}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.region}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.type}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.priority}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.status}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.etaMinutes ?? "—"}</td>
                <td className="py-2 px-3 dark:text-slate-100">
                  {r.lastUpdated?.slice(11, 19) ?? "—"}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border px-3 py-1.5 dark:border-slate-700 dark:text-slate-100"
                      onClick={() => onView?.(r.id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 text-white px-3 py-1.5"
                      onClick={() => runPlanFor(r.id)}
                    >
                      Run Plan
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border px-3 py-1.5 dark:border-slate-700 dark:text-slate-100"
                      onClick={() => recalcEta(r.id)}
                    >
                      Recalc ETA
                    </button>

                    {r.status === "Closed" ? (
                      <span className="rounded-lg bg-slate-700 text-white px-3 py-1.5 select-none">
                        Closed
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-900 text-white px-3 py-1.5"
                          onClick={() => closeIncident(r.id)}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-red-600 text-white px-3 py-1.5"
                          onClick={() => deleteIncident(r.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-6 px-3 text-slate-500 dark:text-slate-400" colSpan={8}>
                  No incidents match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}