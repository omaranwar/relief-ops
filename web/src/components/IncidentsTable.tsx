import { get, post } from "../lib/apiClient";
import { useEffect, useState, useCallback } from "react";

type IncidentRow = {
  id: string;
  region: string;
  type: string;
  priority: string;
  status: string;
  etaSummary?: string;
  lastUpdated?: string;
};

type Props = {
  onView?: (id: string) => void;
  onRunPlan?: (id: string) => void;
  onChanged?: () => void;
};

async function tryRunPlan(id: string) {
  const attempts: Array<[string, any]> = [
    ["/v1/agent/runPlan", { incidentId: id }],
    ["/agent/runPlan", { incidentId: id }],
    [`/v1/incidents/${id}/runPlan`, {}],
  ];
  let lastErr: any;
  for (const [path, body] of attempts) {
    try { return await post(path, body); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("runPlan failed");
}

export default function IncidentsTable({ onView, onRunPlan, onChanged }: Props) {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const all = await get<IncidentRow[]>("/v1/incidents");
    setRows(all);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return r.id.toLowerCase().includes(s) || r.region.toLowerCase().includes(s);
  });

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
          <button type="button" className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:text-slate-100" onClick={load}>
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
              <th className="py-2 px-3">ETA</th>
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
                <td className="py-2 px-3 dark:text-slate-100">{r.etaSummary ?? "—"}</td>
                <td className="py-2 px-3 dark:text-slate-100">{r.lastUpdated?.slice(11, 19) ?? "—"}</td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    {r.status === "Closed" ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 text-white px-3 py-1.5"
                          onClick={async () => {
                            try {
                              await post("/v1/incidents/open", { id: r.id });
                              onChanged?.();
                              await load();
                              onView?.(r.id); // focus selection again
                              alert(`Reopened ${r.id}`);
                            } catch {
                              alert("Failed to reopen incident.");
                            }
                          }}
                        >
                          Reopen
                        </button>
                        <span className="rounded-lg bg-slate-700 text-white px-3 py-1.5 select-none">
                          Closed
                        </span>
                      </>
                    ) : (
                      <>
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
                          onClick={async () => {
                            try {
                              await tryRunPlan(r.id);
                              onRunPlan?.(r.id);
                              onChanged?.();
                              await load();
                              alert(`Plan regenerated for ${r.id}`);
                            } catch {
                              alert("Failed to run plan (mock API).");
                            }
                          }}
                        >
                          Run Plan
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-900 text-white px-3 py-1.5"
                          onClick={async () => {
                            try {
                              await post("/v1/incidents/close", { id: r.id });
                              onChanged?.();
                              await load();
                              alert(`Closed ${r.id}`);
                            } catch {
                              alert("Failed to close incident.");
                            }
                          }}
                        >
                          Close
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