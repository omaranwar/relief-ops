import { useEffect, useMemo, useState } from "react";
import { get } from "../lib/apiClient";

type Incident = {
  id: string;
  region: string;
  type: string;
  priority: "P1" | "P2" | "P3" | string;
  status: "New" | "Running" | "Planned" | "Published" | string;
  etaSummary?: string;
  lastUpdated?: string;
};

export default function IncidentsTable() {
  const [data, setData] = useState<Incident[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await get<Incident[]>("/v1/incidents");
        if (alive) {
          setData(res);
          setErr(null);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load incidents");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((i) =>
      [i.id, i.region, i.type, i.priority, i.status]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [data, q]);

  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="text-base font-semibold">Incidents</div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search incidents"
            className="h-9 w-56 rounded-lg border px-3 text-sm"
          />
          <button
            className="h-9 rounded-lg border px-3 text-sm hover:bg-slate-50"
            onClick={() => window.location.reload()}
            title="Reload page to refetch"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">
          {err}
        </div>
      )}

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
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={`s-${idx}`} className="border-t animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-5 w-16 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-5 w-10 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-4 w-8 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="h-8 w-28 bg-slate-200 rounded" />
                  </td>
                </tr>
              ))}

            {!loading &&
              filtered.map((i, idx) => (
                <tr
                  key={i.id}
                  className={`border-t ${
                    idx % 2 ? "bg-slate-50/50" : "bg-white"
                  } hover:bg-blue-50/40 transition`}
                >
                  <td className="py-2 px-4 font-medium">{i.id}</td>
                  <td className="px-4">{i.region}</td>
                  <td className="px-4">
                    <span className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {i.type}
                    </span>
                  </td>
                  <td className="px-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs border ${
                        i.priority === "P1"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : i.priority === "P2"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      }`}
                    >
                      {i.priority}
                    </span>
                  </td>
                  <td className="px-4">{i.status}</td>
                  <td className="px-4">{i.etaSummary ?? "—"}</td>
                  <td className="px-4 text-slate-500">
                    {i.lastUpdated
                      ? new Date(i.lastUpdated).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td className="px-4">
                    <div className="flex gap-2 justify-end">
                      <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">
                        Open
                      </button>
                      <button className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">
                        Run Plan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && filtered.length === 0 && (
              <tr className="border-t">
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No incidents match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
