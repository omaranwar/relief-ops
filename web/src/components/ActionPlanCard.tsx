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

const allocations: Allocation[] = [
  { resource: "Water", quantity: 8000, unit: "L", fromDepot: "Depot A (Leeds)", toZones: ["H1", "H3"] },
  { resource: "Food Packs", quantity: 2500, fromDepot: "Depot B (York)", toZones: ["H2"] },
  { resource: "Medical (ALS)", quantity: 3, toZones: ["H1", "H2"] },
];

const routes: Route[] = [
  { vehicleId: "T-12", from: "Depot A", to: "H1", etaMinutes: 14, distanceKm: 8.4 },
  { vehicleId: "AMB-03", from: "Clinic North", to: "H2", etaMinutes: 9, distanceKm: 4.2 },
];

export default function ActionPlanCard() {
  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 h-96 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="text-base font-semibold text-slate-800">Action Plan (v2)</div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-slate-600">Region</span>
          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            UK — North
          </span>
        </div>
      </div>

      {/* Scrollable body so the card height stays fixed */}
      <div className="px-4 pb-4 mt-3 overflow-y-auto">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-sm mb-1">
            Allocations
          </div>
          <ul className="list-disc ml-5 space-y-1 text-slate-700">
            {allocations.map((a, idx) => (
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
            {routes.map((r) => (
              <li key={r.vehicleId}>
                <span className="font-medium text-green-800">{r.vehicleId}</span> → {r.to} (from {r.from}): ETA <span className="text-green-700 font-semibold">{r.etaMinutes}m</span>
                {r.distanceKm ? ` • ${r.distanceKm} km` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-50 text-purple-800 text-sm mb-1">
            Coordinator Checklist
          </div>
          <ul className="list-disc ml-5 space-y-1 text-slate-700">
            <li>Confirm bridge status with council</li>
            <li>Activate SMS to volunteers in Zone H3</li>
            <li>Deploy cold-chain containers to Depot B</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition">
            Publish SITREP
          </button>
          <button className="flex-1 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 transition">
            Notify Teams
          </button>
        </div>
      </div>
    </div>
  );
}
