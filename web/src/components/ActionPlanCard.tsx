import { usePlan } from "../features/planning/usePlan";
import { post } from "../lib/apiClient";
import { useState } from "react";

export default function ActionPlanCard({ incidentId }: { incidentId: string | null }) {
  const { plan, loading, error, regenerate } = usePlan(incidentId);
  const [sitrep, setSitrep] = useState<string | null>(null);
  const [sitrepLoading, setSitrepLoading] = useState(false);

  async function generateSitrep() {
    if (!incidentId) return;
    try {
      setSitrepLoading(true);
      const result = await post<{ sitrep: string }>("/v1/agent/sitrep", { incidentId });
      setSitrep(result.sitrep);
    } catch (e) {
      console.error(e);
      alert("Failed to generate SITREP");
    } finally {
      setSitrepLoading(false);
    }
  }

  return (
    <div className="relative bg-white rounded-2xl shadow border border-slate-200 h-96 flex flex-col">
      {(loading || sitrepLoading) && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="px-3 py-2 rounded-lg border bg-white shadow text-sm">
            {sitrepLoading ? "Generating SITREP…" : "Loading plan…"}
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="text-base font-semibold text-slate-800">
          Action Plan {plan ? `(v${plan.version})` : ""}
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-slate-600">Incident: {incidentId ?? "—"}</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {plan?.region ?? "—"}
            </span>
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={regenerate}
              disabled={!incidentId || loading}
            >
              Regenerate Plan
            </button>
            <button
              className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700"
              onClick={generateSitrep}
              disabled={!incidentId || sitrepLoading}
            >
              Generate SITREP
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 mt-3 overflow-y-auto">
        {error && !loading && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {!loading && plan && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-sm mb-1">
                Allocations
              </div>
              <ul className="list-disc ml-5 space-y-1 text-slate-700">
                {plan.allocations.map((a, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-blue-800">{a.resource}</span>: {a.quantity}
                    {a.unit ? ` ${a.unit}` : ""}{a.fromDepot ? ` → ${a.fromDepot}` : ""}
                    {a.toZones?.length ? ` → Zones ${a.toZones.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-green-50 text-green-800 text-sm mb-1">
                Routes &amp; ETAs
              </div>
              <ul className="list-disc ml-5 space-y-1 text-slate-700">
                {plan.routes.map((r) => (
                  <li key={r.vehicleId}>
                    <span className="font-medium text-green-800">{r.vehicleId}</span> → {r.to} (from {r.from}): ETA <span className="text-green-700 font-semibold">{r.etaMinutes}m</span>
                    {r.distanceKm ? ` • ${r.distanceKm} km` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {sitrep && (
          <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-slate-800 whitespace-pre-line">
            {sitrep}
          </div>
        )}
      </div>
    </div>
  );
}
