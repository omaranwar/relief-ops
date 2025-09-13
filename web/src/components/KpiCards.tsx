import { useEffect, useState } from "react";
import { get } from "../lib/apiClient";

type Summary = {
  incidentsActive: number;
  peopleAffected: number;
  unitsAvailable: number;
  avgEtaMinutes: number | null;
};

export default function KpiCards() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await get<Summary>("/v1/summary");
        if (alive) {
          setData(res);
          setErr(null);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load summary");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, []);

  const fmt = (n: number | null | undefined) =>
    n == null ? "—" : n.toLocaleString();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {/* Incidents */}
      <div className="rounded-xl shadow p-4 border bg-red-50 border-red-200">
        <div className="text-xs text-red-700">Incidents (Active)</div>
        <div className="text-2xl font-semibold mt-1 text-red-800">
          {loading ? "…" : fmt(data?.incidentsActive)}
        </div>
      </div>

      {/* People Affected */}
      <div className="rounded-xl shadow p-4 border bg-amber-50 border-amber-200">
        <div className="text-xs text-amber-700">People Affected (est)</div>
        <div className="text-2xl font-semibold mt-1 text-amber-800">
          {loading ? "…" : fmt(data?.peopleAffected)}
        </div>
      </div>

      {/* Units Available */}
      <div className="rounded-xl shadow p-4 border bg-green-50 border-green-200">
        <div className="text-xs text-green-700">Units Available</div>
        <div className="text-2xl font-semibold mt-1 text-green-800">
          {loading ? "…" : fmt(data?.unitsAvailable)}
        </div>
      </div>

      {/* Avg ETA */}
      <div className="rounded-xl shadow p-4 border bg-blue-50 border-blue-200">
        <div className="text-xs text-blue-700">Avg ETA</div>
        <div className="text-2xl font-semibold mt-1 text-blue-800">
          {loading ? "…" : data?.avgEtaMinutes == null ? "—" : `${data.avgEtaMinutes}m`}
        </div>
      </div>

      {err && (
        <div className="col-span-2 md:col-span-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          {err}
        </div>
      )}
    </div>
  );
}
