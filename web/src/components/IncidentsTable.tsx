import { useEffect, useMemo, useState } from "react";
import { get, post } from "../lib/apiClient";

type Incident = {
  id: string;
  region: string;
  type: string;
  priority: "P1" | "P2" | "P3" | string;
  status: "New" | "Running" | "Planned" | "Published" | "Closed" | string;
  etaSummary?: string;
  lastUpdated?: string;
  lat?: number;
  lon?: number;
};

export default function IncidentsTable({
  onRunPlan,
  onChanged,
}: {
  onRunPlan?: (id: string) => void;
  onChanged?: () => void;
}) {
  const [data, setData] = useState<Incident[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await get<Incident[]>("/v1/incidents");
      setData(res);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((i) =>
      [i.id, i.region, i.type, i.priority, i.status].join(" ").toLowerCase().includes(s)
    );
  }, [data, q]);

  async function closeIncident(id: string) {
    if (!confirm(`Close incident ${id}?`)) return;
    try {
      await post(`/v1/incidents/${id}/close`, {});
      setData((prev) =>
        prev ? prev.map(i => i.id === id ? { ...i, status: "Closed", etaSummary: "—" } : i) : prev
      );
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert("Failed to close incident");
    }
  }

  async function reopenIncident(id: string) {
    try {
      await post(`/v1/incidents/${id}/reopen`, {});
      setData((prev) =>
        prev ? prev.map(i => i.id === id ? { ...i, status: "Running" } : i) : prev
      );
      onChanged?.(); // refresh KPIs/map so marker reappears
    } catch (e) {
      console.error(e);
      alert("Failed to reopen incident");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="text-base font-semibold">Incidents</div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search incidents"
            className="h-9 w-56 rounded-lg border px-3 text-sm"
          />
          <button className="h-9 rounded-lg border px-3 text-sm hover:bg-slate-50" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">{err}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 px-4">ID</th>
              <th className="px-4">Region</th>
              <th className="px-4">Type</th>
              <th className="px-4">Priority</th>
              <th className="px-4">Status</th>
              <th className="px-4">ETA</th>
              <th className="px-4">Updated</th>
              <th className="px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length:3}).map((_,idx)=>(
              <tr key={`s-${idx}`} className="border-t animate-pulse">
                {Array.from({length:8}).map((__,j)=><td key={j} className="py-3 px-4"><div className="h-4 w-24 bg-slate-200 rounded"/></td>)}
              </tr>
            ))}

            {!loading && filtered.map((i, idx) => {
              const priorityClass =
                i.priority==="P1" ? "bg-red-100 text-red-800 border-red-200" :
                i.priority==="P2" ? "bg-amber-100 text-amber-800 border-amber-200" :
                                    "bg-green-100 text-green-800 border-green-200";
              return (
                <tr key={i.id} className={`border-t ${idx%2?"bg-slate-50/50":"bg-white"} hover:bg-blue-50/40 transition`}>
                  <td className="py-2 px-4 font-medium">{i.id}</td>
                  <td className="px-4">{i.region}</td>
                  <td className="px-4">
                    <span className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200">{i.type}</span>
                  </td>
                  <td className="px-4">
                    <span className={`px-2 py-1 rounded-lg text-xs border ${priorityClass}`}>{i.priority}</span>
                  </td>
                  <td className="px-4">{i.status}</td>
                  <td className="px-4">{i.etaSummary ?? "—"}</td>
                  <td className="px-4 text-slate-500">{i.lastUpdated ? new Date(i.lastUpdated).toLocaleTimeString() : "—"}</td>
                  <td className="px-4">
                    <div className="flex gap-2 justify-end">
                      {/* View/Select always available */}
                      <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                              onClick={() => onRunPlan?.(i.id)}>
                        View
                      </button>

                      {i.status !== "Closed" ? (
                        <>
                          <button className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                                  onClick={() => onRunPlan?.(i.id)}>
                            Run Plan
                          </button>
                          <button className="text-sm rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
                                  onClick={() => closeIncident(i.id)}>
                            Close
                          </button>
                        </>
                      ) : (
                        <button className="text-sm rounded-lg bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-700"
                                onClick={() => reopenIncident(i.id)}>
                          Open
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && filtered.length===0 && (
              <tr className="border-t">
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">No incidents match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
