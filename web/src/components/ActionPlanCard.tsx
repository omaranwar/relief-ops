import { usePlan } from "../features/planning/usePlan";

export default function ActionPlanCard() {
  const { incidentId, plan, loading, error } = usePlan();

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 h-96 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="text-base font-semibold text-slate-800">
          Action Plan {plan ? `(v${plan.version})` : ""}
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-slate-600">
            {incidentId ? `Incident: ${incidentId}` : "Region"}
          </span>
          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            {plan?.region ?? "—"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 mt-3 overflow-y-auto">
        {loading && (
          <div className="space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mt-4" />
            <div className="h-3 w-4/5 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
          </div>
        )}

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

            {plan.sitrep && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-50 text-purple-800 text-sm mb-1">
                  SITREP
                </div>
                <p className="text-slate-700">{plan.sitrep}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition">
                Publish SITREP
              </button>
              <button className="flex-1 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 transition">
                Notify Teams
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
