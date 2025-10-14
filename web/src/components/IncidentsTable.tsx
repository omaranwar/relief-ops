import { useEffect, useState, useCallback } from "react";
import { get, post } from "../lib/apiClient";

type IncidentRow = {
  id: string;
  region: string;
  type: string;
  priority: string;
  status: string;
  peopleAffected?: number;
  lat?: number | null;
  lon?: number | null;
  updatedAt?: number | string | null;
  etaMinutes?: number | null;            // <- new
  etaLastCalculatedAt?: number | null;   // <- new
};

type Props = {
  onView?: (id: string) => void;
  onRunPlan?: (id: string) => void;
  onChanged?: () => void;
};

export default function IncidentsTable({ onView, onRunPlan, onChanged }: Props) {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Record<string, string | null>>({}); // per-row status
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await get<IncidentRow[]>("/v1/incidents");
      setRows(all);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.id.toLowerCase().includes(s) ||
      (r.region ?? "").toLowerCase().includes(s) ||
      (r.type ?? "").toLowerCase().includes(s)
    );
  });

  async function recalcEta(id: string) {
    try {
      setBusy((b) => ({ ...b, [id]: "eta" }));
      await post(`/v1/incidents/${id}/recalcEta`, {}); // Lambda will cache etaMinutes in Dynamo
      await load();
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert("Failed to recalc ETA");
    } finally {
      setBusy((b) => ({ ...b, [id]: null }));
    }
  }

  async function runPlan(id: string) {
    try {
      setBusy((b) => ({ ...b, [id]: "plan" }));
      await post(`/v1/actionPlan`, { incidentId: id });
      onRunPlan?.(id);
      onChanged?.();
      // optional: reload to reflect any plan-linked updates downstream
      await load();
      alert(`Plan generated for ${id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to run plan");
    } finally {
      setBusy((b) => ({ ...b, [id]: null }));
    }
  }

  function fmtTime(val?: number | string | null) {
    if (val == null) return "—";
    // numeric epoch ms → hh:mm:ss; string ISO → hh:mm:ss
    try {
      const d = typeof val === "number" ? new Date(val) : new Date(val);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toISOString().slice(11, 19);
    } catch {
      return "—";
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
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600 dark:text-slate-300">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Region</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Priority</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">ETA (min)</th> {/* per-incident */}
              <th className="py-2 px-3">Updated</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isBusyEta = busy[r.id] === "eta";
              const isBusyPlan = busy[r.id] === "plan";
              return (
                <tr key={r.id} className="border-t dark:border-slate-700">
                  <td className="py-2 px-3 font-medium dark:text-slate-100">{r.id}</td>
                  <td className="py-2 px-3 dark:text-slate-100">{r.region}</td>
                  <td className="py-2 px-3 dark:text-slate-100">{r.type}</td>
                  <td className="py-2 px-3 dark:text-slate-100">{r.priority}</td>
                  <td className="py-2 px-3 dark:text-slate-100">{r.status}</td>
                  <td className="py-2 px-3 dark:text-slate-100">
                    {typeof r.etaMinutes === "number" ? r.etaMinutes : "—"}
                  </td>
                  <td className="py-2 px-3 dark:text-slate-100">{fmtTime(r.updatedAt)}</td>
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
                        className="rounded-lg bg-blue-600 text-white px-3 py-1.5 disabled:opacity-60"
                        disabled={isBusyPlan}
                        onClick={() => runPlan(r.id)}
                        title="Generate/refresh plan via Bedrock"
                      >
                        {isBusyPlan ? "Running…" : "Run Plan"}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-900 text-white px-3 py-1.5 disabled:opacity-60"
                        disabled={isBusyEta || r.lat == null || r.lon == null}
                        onClick={() => recalcEta(r.id)}
                        title={r.lat == null || r.lon == null ? "Set lat/lon first" : "Recalculate ETA via ORS"}
                      >
                        {isBusyEta ? "Recalc…" : "Recalc ETA"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && !loading && (
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