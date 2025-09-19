import React from "react";

type Allocation = {
  resource: string;
  quantity: number | string;
  unit?: string;
  fromDepot?: string;
  toZones?: string[];
};

type Route = {
  vehicleId: string;
  from: string;
  to: string;
  etaMinutes: number;
  distanceKm?: number;
};

type Plan = {
  incidentId: string;
  version?: number;
  region?: string;
  allocations?: Allocation[];
  routes?: Route[];
  sitrep?: string;
};

type Props = {
  incidentId: string | null;
  plan: Plan | null;
};

export default function ActionPlanCard({ incidentId, plan }: Props) {
  if (!incidentId) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100">
          Action Plan
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Select an incident to view its plan.
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100">
          Action Plan
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Loading plan for <span className="font-medium">{incidentId}</span>…
        </div>
      </div>
    );
  }

  const { version, region, allocations = [], routes = [] } = plan;

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-slate-200 dark:border-slate-700 flex flex-col overflow-auto">
      <div className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100">
        Action Plan {version ? `(v${version})` : ""}
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-slate-600 dark:text-slate-300">Region</span>
        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
          {region || "—"}
        </span>
      </div>

      <div className="mb-4">
        <div className="font-medium mb-1 text-blue-700 dark:text-blue-300">Allocations</div>
        {allocations.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">No allocations.</div>
        ) : (
          <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-200">
            {allocations.map((a, idx) => (
              <li key={`${a.resource}-${idx}`}>
                <span className="font-medium text-blue-800 dark:text-blue-300">{a.resource}</span>:{" "}
                {a.quantity}
                {a.unit ? ` ${a.unit}` : ""}
                {a.fromDepot ? ` → ${a.fromDepot}` : ""}
                {a.toZones?.length ? ` → Zones ${a.toZones.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <div className="font-medium mb-1 text-green-700 dark:text-green-300">Routes &amp; ETAs</div>
        {routes.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">No routes planned.</div>
        ) : (
          <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-200">
            {routes.map((r) => (
              <li key={r.vehicleId}>
                <span className="font-medium text-green-800 dark:text-green-300">{r.vehicleId}</span>{" "}
                → {r.to} (from {r.from}): ETA{" "}
                <span className="text-green-700 font-semibold dark:text-green-300">
                  {r.etaMinutes}m
                </span>
                {r.distanceKm ? ` • ${r.distanceKm} km` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <div className="font-medium mb-1 text-purple-700 dark:text-purple-300">
          Coordinator Checklist
        </div>
        <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-200">
          <li>Confirm bridge status with council</li>
          <li>Activate SMS to volunteers in Zone H3</li>
          <li>Deploy cold-chain containers to Depot B</li>
        </ul>
      </div>

      <div className="flex gap-2 mb-2">
        <button className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition">
          Publish SITREP
        </button>
        <button className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          Notify Teams
        </button>
      </div>
    </div>
  );
}