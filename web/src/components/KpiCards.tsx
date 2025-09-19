import { useEffect, useState } from "react";
import { get } from "../lib/apiClient";

type Summary = {
  incidentsActive: number;
  peopleAffected: number;
  unitsAvailable: number;
  avgEtaMinutes: number | null;
};

export default function KpiCards({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // cache-bust to avoid any stale dev-server caching
      const d = await get<Summary>(`/v1/summary?ts=${Date.now()}`);
      setData(d);
    } catch (e) {
      console.error("Failed to load summary", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const s = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-2xl p-5">
        <div className="text-red-700 dark:text-red-300 text-sm font-medium">Incidents (Active)</div>
        <div className="text-3xl font-semibold text-red-800 dark:text-red-200 mt-2">
          {loading || !s ? "—" : s.incidentsActive}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5">
        <div className="text-amber-700 dark:text-amber-300 text-sm font-medium">People Affected (est)</div>
        <div className="text-3xl font-semibold text-amber-800 dark:text-amber-200 mt-2">
          {loading || !s ? "—" : s.peopleAffected.toLocaleString()}
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5">
        <div className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Units Available</div>
        <div className="text-3xl font-semibold text-emerald-800 dark:text-emerald-200 mt-2">
          {loading || !s ? "—" : s.unitsAvailable}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-5">
        <div className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">Avg ETA</div>
        <div className="text-3xl font-semibold text-indigo-800 dark:text-indigo-200 mt-2">
          {loading || !s ? "—" : (s.avgEtaMinutes == null ? "—" : `${s.avgEtaMinutes}m`)}
        </div>
      </div>
    </div>
  );
}