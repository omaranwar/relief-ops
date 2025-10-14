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
  incidentId?: string;
  version?: number;
  region?: string;
  allocations?: Allocation[];
  routes?: Route[];
  sitrep?: string; // optional narrative text
};

type Props = {
  incidentId: string | null;
  /** can be a plain text plan or the legacy structured object */
  plan: string | Plan | null;
};

export default function ActionPlanCard({ incidentId, plan }: Props) {
  if (!incidentId) {
    return (
      <Card>
        <Header />
        <Empty text="Select an incident to view its plan." />
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <Header />
        <Empty
          text={
            <>
              Loading plan for <span className="font-medium">{incidentId}</span>…
            </>
          }
        />
      </Card>
    );
  }

  const isString = typeof plan === "string";
  const obj = !isString ? (plan as Plan) : undefined;

  const planText = isString ? (plan as string) : obj?.sitrep ?? safeStringify(obj);
  const version = obj?.version;
  const region = obj?.region;
  const allocations = obj?.allocations ?? [];
  const routes = obj?.routes ?? [];

  return (
    <Card>
      <Header version={version} />

      {/* Meta row */}
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-slate-600 dark:text-slate-300">Region</span>
        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
          {region || "—"}
        </span>
      </div>

      {/* SCROLL REGION — only this area scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scroll">
        {planText && (
          <section className="mb-4">
            <h4 className="font-medium mb-1 text-slate-700 dark:text-slate-200">Plan</h4>
            <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
              {planText}
            </pre>
          </section>
        )}

        {!!allocations.length && (
          <section className="mb-4">
            <h4 className="font-medium mb-1 text-blue-700 dark:text-blue-300">Allocations</h4>
            <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-200">
              {allocations.map((a, idx) => (
                <li key={`${a.resource}-${idx}`}>
                  <span className="font-medium text-blue-800 dark:text-blue-300">{a.resource}</span>:{" "}
                  {a.quantity}
                  {a.unit ? ` ${a.unit}` : ""}
                  {a.fromDepot ? ` • From ${a.fromDepot}` : ""}
                  {a.toZones?.length ? ` • Zones ${a.toZones.join(", ")}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!routes.length && (
          <section className="mb-4">
            <h4 className="font-medium mb-1 text-green-700 dark:text-green-300">Routes &amp; ETAs</h4>
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
          </section>
        )}

        {/* Optional checklist (kept) */}
        <section className="mb-4">
          <h4 className="font-medium mb-1 text-purple-700 dark:text-purple-300">Coordinator Checklist</h4>
          <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-200">
            <li>Confirm bridge status with council</li>
            <li>Activate SMS to volunteers in Zone H3</li>
            <li>Deploy cold-chain containers to Depot B</li>
          </ul>
        </section>
      </div>

      {/* Static buttons row (non-scrolling) */}
      <div className="flex gap-2 mt-3">
        <button className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition">
          Publish SITREP
        </button>
        <button className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          Notify Teams
        </button>
      </div>
    </Card>
  );
}

/* ---------- Helpers & small components ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-[360px] max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
      {children}
    </div>
  );
}

function Header({ version }: { version?: number }) {
  return (
    <div className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100">
      Action Plan {version ? `(v${version})` : ""}
    </div>
  );
}

function Empty({ text }: { text: React.ReactNode }) {
  return <div className="text-sm text-slate-600 dark:text-slate-300">{text}</div>;
}

function safeStringify(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}