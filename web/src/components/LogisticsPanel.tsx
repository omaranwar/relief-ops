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

type Stock = {
  waterL: number;
  foodPacks: number;
  blankets: number;
  als: number;
};

type DepotNear = {
  name: string;
  cityKey: string; // e.g. "Leeds"
  lat: number;
  lon: number;
  distanceKm: number;
  stock?: Partial<Stock> & { city?: string };
};

function num(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function fmt(n: number) {
  return n.toLocaleString();
}

function calcSuggestions(people = 0, days = 1, priority: string = "P3") {
  const d = Math.max(1, Math.floor(days));
  const p = Math.max(0, Math.floor(people));

  const water = p * d * 3;
  const food = Math.ceil(p * d * 1.2);
  const blnk = Math.ceil(p * d * 0.25);
  const als = priority === "P1" ? 3 : priority === "P2" ? 2 : 1;

  return {
    waterL:   { n: water, label: "Water",          unit: "L",     note: "3 L/person/day" },
    foodPacks:{ n: food,  label: "Food Packs",     unit: "packs", note: "1.2 packs/person/day (+20%)" },
    blankets: { n: blnk,  label: "Blankets",       unit: "units", note: "0.25/person/day" },
    als:      { n: als,   label: "Medical (ALS)",  unit: "",      note: `Based on priority ${priority}` },
  };
}

export default function LogisticsPanel({ incident, onReserved }: Props) {
  const [days, setDays] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");

  // City stock editor (bound to selected depot city)
  const [selectedDepotCity, setSelectedDepotCity] = useState<string>("");
  const [stock, setStock] = useState<Stock>({ waterL: 0, foodPacks: 0, blankets: 0, als: 0 });
  const [enabled, setEnabled] = useState<{waterL:boolean;foodPacks:boolean;blankets:boolean;als:boolean}>({
    waterL: true, foodPacks: true, blankets: true, als: false
  });

  // Nearby depots for the incident
  const [depotsNear, setDepotsNear] = useState<DepotNear[]>([]);
  const [depotsLoading, setDepotsLoading] = useState(false);
  const [depotsError, setDepotsError] = useState<string | null>(null);
  const [depotsRefreshKey, setDepotsRefreshKey] = useState(0);

  // Allow partial reserve toggle
  const [allowPartial, setAllowPartial] = useState(true);

  const suggestions = useMemo(
    () => calcSuggestions(incident?.peopleAffected ?? 0, days, incident?.priority ?? "P3"),
    [incident?.peopleAffected, incident?.priority, days]
  );

  // Reset when incident changes
  useEffect(() => {
    setDays(2);
    setNotes("");
    setDepotsNear([]);
    setSelectedDepotCity("");
    setStock({ waterL: 0, foodPacks: 0, blankets: 0, als: 0 });
    setDepotsRefreshKey((k) => k + 1); // ensure a fresh fetch for new incident
  }, [incident?.id]);

  // Load nearby depots for the incident (with cache-busting + explicit refresh key)
  useEffect(() => {
    (async () => {
      if (!incident?.id) return;
      setDepotsLoading(true);
      setDepotsError(null);
      try {
        const ts = Date.now();
        const res = await get<{ depots: DepotNear[] }>(
          `/v1/depotsNear?incidentId=${encodeURIComponent(incident.id)}&ts=${ts}`
        );
        const list = Array.isArray(res?.depots) ? res.depots : [];
        setDepotsNear(list);

        // Keep existing selection if still present, else choose nearest
        setSelectedDepotCity((prev) =>
          list.some((d) => d.cityKey === prev) ? prev : (list[0]?.cityKey || "")
        );
      } catch (e: any) {
        setDepotsError(e?.message || "Failed to load nearby depots");
        setDepotsNear([]);
      } finally {
        setDepotsLoading(false);
      }
    })();
  }, [incident?.id, depotsRefreshKey]);

  // Load stock for the selected depot city
  useEffect(() => {
    (async () => {
      if (!selectedDepotCity) return;
      try {
        const s = await get<Partial<Stock>>(`/v1/stock/${encodeURIComponent(selectedDepotCity)}`);
        setStock({
          waterL: num(s?.waterL),
          foodPacks: num(s?.foodPacks),
          blankets: num(s?.blankets),
          als: num(s?.als),
        });
      } catch {
        setStock({ waterL: 0, foodPacks: 0, blankets: 0, als: 0 });
      }
    })();
  }, [selectedDepotCity]);

  async function handleSaveStock() {
    if (!selectedDepotCity) return;
    const payload: Stock = {
      waterL: enabled.waterL ? num(stock.waterL) : 0,
      foodPacks: enabled.foodPacks ? num(stock.foodPacks) : 0,
      blankets: enabled.blankets ? num(stock.blankets) : 0,
      als: enabled.als ? num(stock.als) : 0,
    };
    try {
      for (const v of Object.values(payload)) {
        if (!Number.isFinite(v) || v < 0) throw new Error("Please enter valid numbers.");
      }
      await post(`/v1/stock/${encodeURIComponent(selectedDepotCity)}/update`, payload);
      alert(`Stock saved for ${selectedDepotCity}.`);
      // Refresh the nearby list to show updated numbers
      setDepotsRefreshKey((k) => k + 1);
    } catch (e: any) {
      alert(e?.message || "Failed to update stock. Please enter valid numbers.");
    }
  }

  // Reserve (server allocates across nearby depots; allow partial via query flag)
  async function handleReserve() {
    if (!incident) return;

    const items = {
      waterL: suggestions.waterL.n,
      foodPacks: suggestions.foodPacks.n,
      blankets: suggestions.blankets.n,
      als: suggestions.als.n,
    };

    try {
      const qs = allowPartial ? "?allowPartial=true" : "";
      const resp = await post(`/v1/logistics/reserve${qs}`, {
        incidentId: incident.id,
        days,
        items,
      });

      // Show a concise summary
      const allocs = Array.isArray(resp?.allocations) ? resp.allocations : [];
      const fulfilled = resp?.fulfilled ?? {};
      const shortfall = resp?.shortfall ?? {};
      const lines = [
        `Reserved to ${incident.id} (${incident.region})`,
        `Fulfilled: ${fmt(num(fulfilled.waterL))}L water, ${fmt(num(fulfilled.foodPacks))} food, ${fmt(num(fulfilled.blankets))} blankets, ALS ${fmt(num(fulfilled.als))}`,
        (num(shortfall.waterL) + num(shortfall.foodPacks) + num(shortfall.blankets) + num(shortfall.als) > 0)
          ? `Shortfall: ${fmt(num(shortfall.waterL))}L, ${fmt(num(shortfall.foodPacks))} food, ${fmt(num(shortfall.blankets))} blankets, ALS ${fmt(num(shortfall.als))}`
          : `Shortfall: 0`,
        allocs.length ? `Allocations:\n${allocs.map((a:any)=>`• ${a.depot}: +${fmt(num(a.contribution?.waterL))}L, ${fmt(num(a.contribution?.foodPacks))} food, ${fmt(num(a.contribution?.blankets))} blankets, ALS ${fmt(num(a.contribution?.als))}`).join("\n")}` : `Allocations: (none)`,
      ].join("\n");
      alert(lines);

      // Refresh depot list & the selected depot stock display
      setDepotsRefreshKey((k) => k + 1);

      // If server returned remainingByDepot, and the current selected depot exists there, reflect it locally
      const remainingByDepot = resp?.remainingByDepot || {};
      if (selectedDepotCity && remainingByDepot[selectedDepotCity]) {
        const st = remainingByDepot[selectedDepotCity] as Partial<Stock>;
        setStock({
          waterL: num(st.waterL),
          foodPacks: num(st.foodPacks),
          blankets: num(st.blankets),
          als: num(st.als),
        });
      }

      onReserved?.();
    } catch (e: any) {
      alert(e?.message || "Reservation failed");
    }
  }

  const available = stock;
  const needed = {
    waterL: Math.max(0, suggestions.waterL.n - available.waterL),
    foodPacks: Math.max(0, suggestions.foodPacks.n - available.foodPacks),
    blankets: Math.max(0, suggestions.blankets.n - available.blankets),
    als: Math.max(0, suggestions.als.n - available.als),
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Logistics</h3>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        {/* === TOP INFO BAR === */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-800 dark:text-slate-100 font-medium">Region:</span>
            <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
              {incident?.region ?? "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-800 dark:text-slate-100 font-medium">Priority:</span>
            <span className="px-2 py-1 rounded-lg border border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-200">
              {incident?.priority ?? "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-800 dark:text-slate-100 font-medium">People:</span>
            <span className="px-2 py-1 rounded-lg border border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-200">
              {(incident?.peopleAffected ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Depot selector + partial toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <label className="flex items-center gap-2">
              <span className="text-slate-800 dark:text-slate-100 font-medium">Depot</span>
              <select
                className="rounded-lg border px-2 py-1 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                value={selectedDepotCity}
                onChange={(e) => setSelectedDepotCity(e.target.value)}
                disabled={!depotsNear.length}
              >
                {depotsNear.map((d) => (
                  <option key={d.cityKey} value={d.cityKey}>
                    {d.name} ({Math.round(d.distanceKm)} km)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={allowPartial}
                onChange={(e) => setAllowPartial(e.target.checked)}
              />
              <span className="text-slate-800 dark:text-slate-100">Allow partial reserve</span>
            </label>
          </div>
        </div>

        {/* Nearby depots list */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-800 dark:text-slate-100 font-medium">
              Nearby depots (within radius)
            </div>
            <button
              onClick={() => setDepotsRefreshKey((k) => k + 1)}
              className="rounded-md border border-slate-400 dark:border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-50 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              🔄 Refresh
            </button>
          </div>

          {depotsLoading && <div className="text-xs text-slate-600 dark:text-slate-300">Loading…</div>}
          {depotsError && <div className="text-xs text-amber-500">Error: {depotsError}</div>}
          {!depotsLoading && !depotsError && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-700 dark:text-slate-100 text-left border-b dark:border-slate-600">
                    <th className="py-1 pr-3">Depot</th>
                    <th className="py-1 pr-3">Distance</th>
                    <th className="py-1 pr-3">Water (L)</th>
                    <th className="py-1 pr-3">Food</th>
                    <th className="py-1 pr-3">Blankets</th>
                    <th className="py-1 pr-3">ALS</th>
                  </tr>
                </thead>
                <tbody>
                  {depotsNear.map((d) => (
                    <tr key={d.cityKey} className="border-t dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{d.name}</td>
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{Math.round(d.distanceKm)} km</td>
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{fmt(num(d.stock?.waterL))}</td>
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{fmt(num(d.stock?.foodPacks))}</td>
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{fmt(num(d.stock?.blankets))}</td>
                      <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">{fmt(num(d.stock?.als))}</td>
                    </tr>
                  ))}
                  {depotsNear.length === 0 && (
                    <tr>
                      <td className="py-2 text-slate-600 dark:text-slate-400" colSpan={6}>
                        No depots in range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* === TWO COLUMN GRID === */}
        <div className="grid grid-cols-12 gap-3">
          {/* LEFT: Editable stock (for selected depot) */}
          <div className="col-span-12 md:col-span-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-700 dark:text-slate-200 text-sm">
                  Edit stock ({selectedDepotCity || "—"})
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEnabled({ waterL: true, foodPacks: true, blankets: true, als: false });
                      setStock({ waterL: 0, foodPacks: 0, blankets: 0, als: 0 });
                    }}
                    className="rounded-lg border px-3 py-1.5 text-sm border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-100"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-sm border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-100"
                    onClick={handleSaveStock}
                    disabled={!selectedDepotCity}
                  >
                    Save Stock
                  </button>
                </div>
              </div>

              {[
                { key: "waterL", label: "Water", unit: "L" },
                { key: "foodPacks", label: "Food Packs", unit: "packs" },
                { key: "blankets", label: "Blankets", unit: "units" },
                { key: "als", label: "Medical (ALS)", unit: "" },
              ].map((r) => {
                const k = r.key as keyof Stock;
                const checked = enabled[k as keyof typeof enabled];
                return (
                  <div key={r.key} className="mb-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={!!checked}
                        onChange={(e) =>
                          setEnabled((prev) => ({ ...prev, [k]: e.target.checked }))
                        }
                      />
                      {/* lighter label text */}
                      <span className="w-36 text-slate-700 dark:text-slate-200">{r.label}</span>
                      <input
                        type="number"
                        min={0}
                        value={stock[k]}
                        onChange={(e) =>
                          setStock((prev) => ({ ...prev, [k]: num(e.target.value) }))
                        }
                        disabled={!checked}
                        className="flex-1 rounded-lg border px-3 py-2 bg-white text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      />
                      <span className="w-16 text-right text-slate-600 dark:text-slate-400">{r.unit}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Suggested vs available vs shortfall (for the selected depot) */}
          <div className="col-span-12 md:col-span-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-700 dark:text-slate-200 text-sm mb-2">
                Suggested allocation (vs selected depot stock)
              </div>
              <ul className="space-y-2 text-slate-800 dark:text-slate-100">
                {[
                  { id: "waterL"   as const, conf: suggestions.waterL   },
                  { id: "foodPacks"as const, conf: suggestions.foodPacks},
                  { id: "blankets" as const, conf: suggestions.blankets },
                  { id: "als"      as const, conf: suggestions.als      },
                ].map(({ id, conf }) => {
                  const have = (available as any)[id] as number;
                  const need = Math.max(0, conf.n - have);
                  return (
                    <li key={id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-700 dark:text-slate-200">{conf.label}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{conf.note}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">
                          {fmt(conf.n)} {conf.unit}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="opacity-70">Available:</span> {fmt(have)} {conf.unit}
                          {need > 0 ? (
                            <>
                              {" "}<span className="opacity-70">• Need:</span>{" "}
                              <span className="text-amber-500 font-semibold">
                                {fmt(need)} {conf.unit}
                              </span>
                            </>
                          ) : (
                            <>
                              {" "}<span className="opacity-70">• Need:</span>{" "}
                              <span className="text-emerald-500 font-semibold">0</span>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3">
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special constraints, road closures, perishables, etc."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 p-2 resize-none h-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reserve */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleReserve}
            className="rounded-xl bg-slate-800 text-white px-4 py-2 hover:bg-slate-700"
            disabled={!incident}
          >
            {incident ? `Reserve to ${incident.id}` : "Reserve to this Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}