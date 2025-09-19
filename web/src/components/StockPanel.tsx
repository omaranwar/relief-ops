import { useEffect, useMemo, useState } from "react";
import { get, post } from "../lib/apiClient";

type Item = { key:string; label:string; unit:string };
type StockResp = { region:string; items:Item[]; stock:Record<string,number> };
type SuggestResp = {
  region:string; people:number; days:number; priority:string;
  suggested: { key:string; qty:number; available:number; low:boolean }[];
};

function badgeClass(kind:"ok"|"warn"|"muted"|"primary"="muted"){
  if(kind==="primary") return "bg-blue-50 text-blue-700 border border-blue-200";
  if(kind==="ok") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if(kind==="warn") return "bg-amber-50 text-amber-800 border border-amber-200";
  return "bg-slate-50 text-slate-700 border border-slate-200";
}

function fmt(n:number){ return n.toLocaleString(); }

export default function StockPanel({ incident }: {
  incident: { id:string; region:string; priority:string; peopleAffected?:number } | null
}) {
  const [stock, setStock] = useState<StockResp|null>(null);
  const [suggest, setSuggest] = useState<SuggestResp|null>(null);
  const [days, setDays] = useState(2);

  const region = incident?.region || "UK-North";
  const people = incident?.peopleAffected || 0;
  const priority = incident?.priority || "P2";

  async function load() {
    const s = await get<StockResp>(`/v1/stock?region=${encodeURIComponent(region)}`);
    setStock(s);
    const sg = await get<SuggestResp>(
      `/v1/stock/suggest?region=${encodeURIComponent(region)}&people=${people}&days=${days}&priority=${priority}`
    );
    setSuggest(sg);
  }

  useEffect(() => { if (incident) load(); }, [incident?.id, days]);

  const lowAny = useMemo(() => suggest?.suggested.some(s => s.low) ?? false, [suggest]);

  async function reserve() {
    if (!incident || !suggest) return;
    const reserves = suggest.suggested.filter(s => s.qty>0).map(s => ({ key:s.key, qty:s.qty }));
    try {
      const r = await post(`/v1/stock/reserve`, { region, incidentId: incident.id, reserves });
      setStock({ region, items: stock?.items || [], stock: r.stock });
      await load();
      alert("Stock reserved for this incident.");
    } catch (e:any) {
      alert(e?.message || "Failed to reserve stock");
    }
  }

  return (
    <div className="h-[420px] bg-white rounded-2xl border border-slate-200 p-4 flex flex-col overflow-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">Stock &amp; Alerts</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-lg ${badgeClass("primary")}`}>
            Region: <b className="ml-1">{region}</b>
          </span>
          <span className={`text-xs px-2 py-1 rounded-lg ${badgeClass("muted")}`}>
            Priority: <b className="ml-1">{priority}</b>
          </span>
          <span className={`text-xs px-2 py-1 rounded-lg ${badgeClass("muted")}`}>
            People: <b className="ml-1">{fmt(people)}</b>
          </span>
          <div className="flex items-center gap-1">
            <label className="text-xs text-slate-600">Days</label>
            <input
              type="number" min={1} max={7} value={days}
              onChange={(e)=>setDays(Number(e.target.value||2))}
              className="h-7 w-16 border rounded-lg px-2 text-sm"
            />
            <button className="h-7 rounded-lg border px-2 text-xs hover:bg-slate-50" onClick={load}>
              Recalc
            </button>
          </div>
        </div>
      </div>

      {lowAny && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
          One or more items will be low after this allocation. Consider restocking.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* Current stock */}
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-xs font-medium text-slate-600 mb-2">Current stock</div>
          <div className="space-y-2">
            {stock?.items.map(it => {
              const qty = stock?.stock[it.key] ?? 0;
              return (
                <div key={it.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{it.label}</span>
                  <span className="px-2 py-0.5 rounded-lg text-xs border bg-slate-50">{fmt(qty)} {it.unit}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Suggested allocation */}
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-xs font-medium text-slate-600 mb-2">Suggested allocation</div>
          <div className="space-y-3">
            {suggest?.suggested.map(s => {
              const after = Math.max(0, (s.available || 0) - s.qty);
              const pctAfter = s.available > 0 ? Math.max(0, Math.min(100, Math.round(after / s.available * 100))) : 0;
              const pill = s.low ? badgeClass("warn") : badgeClass("ok");
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{s.key}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${pill}`}>need {fmt(s.qty)}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${badgeClass("muted")}`}>avail {fmt(s.available)}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${s.low ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        after {fmt(after)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${s.low ? "bg-amber-400" : "bg-emerald-500"}`}
                      style={{ width: `${pctAfter}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-200 flex justify-end">
        <button
          className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800"
          onClick={reserve}
        >
          Reserve to this Incident
        </button>
      </div>
    </div>
  );
}
