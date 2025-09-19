import React, { useEffect, useMemo, useState } from "react";
import { get, post } from "../lib/apiClient";

type Incident = {
  id: string;
  region: string;
  priority: "P1" | "P2" | "P3" | string;
  peopleAffected?: number;
};

type Props = {
  incident: Incident | null;
  onReserved?: () => void;
};

// --- heuristics for demo planning ---
function calcSuggestions(people = 0, days = 1, priority: string = "P3") {
  const d = Math.max(1, Math.floor(days));
  const p = Math.max(0, Math.floor(people));

  const waterL = p * d * 3;                   // 3 L/person/day
  const foodPacks = Math.ceil(p * d * 1.2);   // 1.2 packs/person/day (20% buffer)
  const blankets = Math.ceil(p * d * 0.25);   // 0.25/person/day
  const als = priority === "P1" ? 3 : priority === "P2" ? 2 : 1;

  return [
    { key: "waterL",   label: "Water",          value: `${waterL.toLocaleString()} L`,        note: "3 L/person/day" },
    { key: "foodPacks",label: "Food Packs",     value: `${foodPacks.toLocaleString()} packs`, note: "1.2 packs/person/day (20% buffer)" },
    { key: "blankets", label: "Blankets",       value: `${blankets.toLocaleString()} units`,  note: "0.25/person/day" },
    { key: "als",      label: "Medical (ALS)",  value: `${als}`,                              note: `Based on priority ${priority}` },
  ];
}

function onlyNumber(s: string | number | undefined) {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function LogisticsPanel({ incident, onReserved }: Props) {
  const [days, setDays] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");
  const [stockJson, setStockJson] = useState<string>("");

  const city = useMemo(
    () => (incident?.region ? incident.region.split(",")[0].trim() : ""),
    [incident?.region]
  );

  const suggestions = useMemo(
    () => calcSuggestions(incident?.peopleAffected ?? 0, days, incident?.priority ?? "P3"),
    [incident?.peopleAffected, incident?.priority, days]
  );

  useEffect(() => {
    setDays(2);
    setNotes("");
  }, [incident?.id]);

  useEffect(() => {
    (async () => {
      if (!city) { setStockJson(""); return; }
      try {
        const s = await get<any>(`/v1/stock/${city}`);
        const { waterL, foodPacks, blankets, als } = s || {};
        setStockJson(JSON.stringify({ waterL, foodPacks, blankets, als }, null, 2));
      } catch {
        setStockJson("");
      }
    })();
  }, [city]);

  async function handleSaveStock() {
    if (!city) return;
    try {
      const payload = JSON.parse(stockJson || "{}");
      await post(`/v1/stock/${city}/update`, payload);
      alert("Stock updated.");
    } catch {
      alert("Failed to update stock. Ensure the JSON has numeric fields.");
    }
  }

  async function handleReserve() {
    if (!incident) return;
    const items = {
      waterL:   onlyNumber(suggestions.find(s => s.key === "waterL")?.value),
      foodPacks:onlyNumber(suggestions.find(s => s.key === "foodPacks")?.value),
      blankets: onlyNumber(suggestions.find(s => s.key === "blankets")?.value),
      als:      onlyNumber(suggestions.find(s => s.key === "als")?.value),
    };
    try {
      const resp = await post("/v1/logistics/reserve", {
        incidentId: incident.id,
        days,
        items
      });
      alert(
        `Reserved to ${incident.id}.\n` +
        `City: ${resp.city}\n` +
        `Remaining stock: ${JSON.stringify(resp.stock, null, 2)}`
      );
      const { waterL, foodPacks, blankets, als } = resp.stock || {};
      setStockJson(JSON.stringify({ waterL, foodPacks, blankets, als }, null, 2));
      onReserved?.();
    } catch (e: any) {
      alert(e?.message || "Reservation failed (insufficient stock?)");
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Logistics</h3>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Region:</span>
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
              {incident?.region ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Priority:</span>
            <span className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {incident?.priority ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">People:</span>
            <span className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(incident?.peopleAffected ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-600 dark:text-slate-300">Days</span>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value || 1))}
              className="w-20 rounded-lg border px-2 py-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => {/* suggestions recompute automatically */}}
              className="rounded-lg border px-3 py-1.5 dark:border-slate-700"
            >
              Recalc
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-600 dark:text-slate-300 text-sm">Current stock ({city || "—"})</div>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700"
                  onClick={handleSaveStock}
                  disabled={!city}
                >
                  Save Stock
                </button>
              </div>
              <textarea
                value={stockJson}
                onChange={(e) => setStockJson(e.target.value)}
                placeholder='{"waterL": 60000, "foodPacks": 25000, "blankets": 9000, "als": 6}'
                className="w-full h-48 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2 resize-none font-mono text-sm"
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-600 dark:text-slate-300 text-sm mb-2">Suggested allocation</div>
              <ul className="space-y-2 text-slate-800 dark:text-slate-100">
                {suggestions.map((s) => (
                  <li key={s.key} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium">{s.label}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">{s.note}</span>
                    </div>
                    <span className="font-semibold">{s.value}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special constraints, road closures, perishables, etc."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2 resize-none h-20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleReserve}
            className="rounded-xl bg-slate-900 text-white px-4 py-2"
            disabled={!incident}
          >
            {incident ? `Reserve to ${incident.id}` : "Reserve to this Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}