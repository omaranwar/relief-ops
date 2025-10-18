import { useState } from "react";
import { useIncidents } from "./features/incidents/useIncidents";
import { usePlan } from "./features/planning/usePlan";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import KpiCards from "./components/KpiCards";
import IncidentsTable from "./components/IncidentsTable";
import MapView from "./components/MapView";
import ActionPlanCard from "./components/ActionPlanCard";
import SidebarFilters from "./components/SidebarFilters";
import IncidentsTable from "./components/IncidentsTable";
import LogisticsPanel from "./components/LogisticsPanel";
import NewIncidentModal from "./components/NewIncidentModal";
import { get, postSmart } from "./lib/apiClient";

type Incident = {
  id: string;
  region: string;
  type: string;
  priority: "P1" | "P2" | "P3" | string;
  status: string;
  peopleAffected?: number;
  lat?: number;
  lon?: number;
};

const API_BASE =
  (window as any).__RELIEFOPS_API_BASE__ ||
  (import.meta as any).env?.VITE_API_BASE ||
  "";

function App() {
  const { data: incidents, loading, error } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const { plan, regenerate } = usePlan(selectedIncident);

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarFilters />

      <div className="flex-1 flex flex-col">
        <header className="p-4 bg-white shadow">
          <h1 className="text-2xl font-bold">ReliefOps Console</h1>
        </header>

        <main className="flex-1 p-4 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <KpiCards incidents={incidents || []} />
          </div>

          <div className="lg:col-span-2 bg-white rounded shadow p-4">
            <MapView incidents={incidents || []} />
          </div>

          <div className="bg-white rounded shadow p-4">
            <ActionPlanCard
              plan={plan}
              loading={loading}
              onRegenerate={regenerate}
            />
          </div>

          <div className="lg:col-span-3 bg-white rounded shadow p-4">
            <IncidentsTable
              incidents={incidents || []}
              onSelectIncident={setSelectedIncident}
            />
          </div>
        </main>
      </div>

      <NewIncidentModal />
    </div>
  );
}

export default App;
export default function App() {
  // separate keys so incidents can refresh without nuking the plan
  const [incidentsKey, setIncidentsKey] = useState(0);
  const [planKey, setPlanKey] = useState(0);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);

  // gentle auto refresh for incidents ONLY
  const autoRefreshMs = 15_000;
  const intervalRef = useRef<number | null>(null);

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  const refreshIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    setIncidentsError(null);
    try {
      const all = await get<Incident[]>("/v1/incidents");
      setIncidents(all);

      // ensure we always have a valid selection
      if (!selectedIncidentId && all.length) {
        setSelectedIncidentId(all[0].id);
      } else if (selectedIncidentId && !all.some((i) => i.id === selectedIncidentId)) {
        setSelectedIncidentId(all[0]?.id ?? null);
      }
    } catch (e: any) {
      console.error("Failed to load incidents", e);
      setIncidentsError(e?.message ?? "Failed to load incidents");
    } finally {
      setIncidentsLoading(false);
    }
  }, [selectedIncidentId]);

  // fetch stored plan (GET /v1/plan/{id})
  const fetchStoredPlan = useCallback(async (incidentId: string) => {
    setPlanLoading(true);
    setPlanError(null);
    setPlanStatus("Loading stored plan…");
    try {
      const resp = await fetch(
        `${API_BASE}/v1/plan/${encodeURIComponent(incidentId)}?ts=${Date.now()}`,
        { headers: { Accept: "application/json, text/plain" } }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const ct = resp.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await resp.json() : await resp.text();
      const text =
        typeof data === "string"
          ? data
          : typeof (data as any)?.plan === "string"
          ? (data as any).plan
          : typeof (data as any)?.action_plan === "string"
          ? (data as any).action_plan
          : JSON.stringify(data, null, 2);
      setPlan(text || null);
      setPlanStatus("Stored plan loaded.");
    } catch (e: any) {
      console.error("Failed to load plan", e);
      setPlan(null);
      setPlanError(e?.message ?? "Failed to load plan");
      setPlanStatus("Failed to fetch stored plan.");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // generate via POST /v1/actionPlan and display
  const generatePlan = useCallback(async () => {
    if (!selectedIncidentId) return;
    try {
      setPlanLoading(true);
      setPlanError(null);
      setPlanStatus("Generating plan…");
      const resp: any = await postSmart("/v1/actionPlan", { incidentId: selectedIncidentId });
      const planText =
        resp?.plan ??
        resp?.action_plan ??
        (typeof resp === "string" ? resp : JSON.stringify(resp, null, 2));
      setPlan(planText || null);
      setPlanStatus("Plan generated.");
    } catch (e: any) {
      console.error(e);
      setPlanError(e?.message ?? "Failed to generate plan");
      setPlanStatus("Failed to generate plan.");
    } finally {
      setPlanLoading(false);
      setTimeout(() => {
        document
          .getElementById("action-plan")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [selectedIncidentId]);

  // -------- effects --------
  useEffect(() => {
    refreshIncidents();
  }, [incidentsKey, refreshIncidents]);

  useEffect(() => {
    if (!selectedIncidentId) {
      setPlan(null);
      setPlanError(null);
      setPlanStatus(null);
      return;
    }
    // on select, try stored plan first
    fetchStoredPlan(selectedIncidentId);
  }, [selectedIncidentId, planKey, fetchStoredPlan]);

  // auto-refresh incidents ONLY
  useEffect(() => {
    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = window.setInterval(() => {
        setIncidentsKey((k) => k + 1);
      }, autoRefreshMs);
    };
    const stop = () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    const onVis = () =>
      document.visibilityState === "visible" ? start() : stop();
    document.addEventListener("visibilitychange", onVis);
    if (document.visibilityState === "visible") start();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, []);

  // keyboard refresh (R)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && (e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "r") setIncidentsKey((k) => k + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <TopBar onNewIncident={() => setShowNewModal(true)} />

      <NewIncidentModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(id) => {
          setSelectedIncidentId(id);
          setIncidentsKey((k) => k + 1);
          setShowNewModal(false);
          setTimeout(() => {
            document
              .getElementById("action-plan")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        }}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header + KPIs */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            ReliefOps Console
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Climate Disasters &amp; Emergency Response Dashboard
          </p>
          {selectedIncidentId && (
            <p className="text-xs text-slate-500 mt-1">
              Selected Incident:{" "}
              <span className="font-medium">{selectedIncidentId}</span>
            </p>
          )}
        </div>

        {/* >>> KPIs now receive selectedIncidentId so Units Available appears <<< */}
        <KpiCards
          selectedIncidentId={selectedIncidentId ?? undefined}
          refreshKey={incidentsKey}
        />

        {/* ROW 1: Map (left) + Action Plan (right) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* MAP PANEL — fixed height so Leaflet can measure container */}
          <div className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur p-2 h-[420px] xl:h-[520px]">
              {incidentsLoading && (
                <div className="p-4 text-sm text-slate-500">Loading incidents…</div>
              )}
              {incidentsError && (
                <div className="p-4 text-sm text-red-600">Error: {incidentsError}</div>
              )}
              <div className="w-full h-full">
                <MapView
                  key={`map-${selectedIncidentId ?? "none"}-${incidentsKey}`}
                  incidentId={selectedIncidentId}
                  refreshKey={incidentsKey}
                />
              </div>
            </div>
          </div>

          {/* ACTION PLAN PANEL — scrollable interior */}
          <div className="col-span-12 xl:col-span-6">
            <div
              id="action-plan"
              className="rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur p-3 min-h-[420px] xl:min-h-[520px] max-h-[75vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  Action Plan
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!selectedIncidentId || planLoading}
                    onClick={generatePlan}
                    className="rounded-md border border-slate-300 dark:border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-50 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                    title="Generate plan via Bedrock"
                  >
                    {planLoading ? "Generating…" : "Generate / Refresh Plan"}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedIncidentId || planLoading}
                    onClick={() => selectedIncidentId && fetchStoredPlan(selectedIncidentId)}
                    className="rounded-md border border-slate-300 dark:border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-50 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                    title="Reload stored plan"
                  >
                    Reload Stored Plan
                  </button>
                </div>
              </div>

              {/* tiny status line */}
              {(planLoading || planError || planStatus) && (
                <div className="px-1 pb-1 text-xs">
                  {planLoading && <span className="text-slate-500">Loading…</span>}
                  {!planLoading && planError && (
                    <span className="text-amber-500">
                      No plan yet or failed to load: {planError}
                    </span>
                  )}
                  {!planLoading && !planError && planStatus && (
                    <span className="text-slate-400">{planStatus}</span>
                  )}
                </div>
              )}

              <ActionPlanCard incidentId={selectedIncidentId} plan={plan} />
            </div>
          </div>
        </div>

        {/* ROW 2: Logistics */}
        <div className="grid grid-cols-12 gap-6 mt-2">
          <div className="col-span-12">
            <div className="rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur p-2">
              <LogisticsPanel
                incident={selectedIncident}
                onReserved={() => setIncidentsKey((k) => k + 1)}
              />
            </div>
          </div>
        </div>

        {/* ROW 3: Incidents table */}
        <div className="rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur p-2 mt-2">
          <IncidentsTable
            onView={(id) => {
              setSelectedIncidentId(id);
              setPlanKey((k) => k + 1);
              setTimeout(() => {
                document
                  .getElementById("action-plan")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 0);
            }}
            onRunPlan={async (id) => {
              setSelectedIncidentId(id);
              try {
                setPlanLoading(true);
                setPlanError(null);
                setPlanStatus("Generating plan…");
                const resp: any = await postSmart("/v1/actionPlan", { incidentId: id });
                const planText =
                  resp?.plan ??
                  resp?.action_plan ??
                  (typeof resp === "string" ? resp : JSON.stringify(resp, null, 2));
                setPlan(planText || null);
                setPlanStatus("Plan generated.");
              } catch (e: any) {
                setPlanError(e?.message ?? "Failed to generate plan");
                setPlanStatus("Failed to generate plan.");
              } finally {
                setPlanLoading(false);
                setTimeout(() => {
                  document
                    .getElementById("action-plan")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }
            }}
            onChanged={() => setIncidentsKey((k) => k + 1)}
            key={`table-${incidentsKey}`}
          />
        </div>

        <footer className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t dark:border-slate-700">
          ReliefOps v0.1 • Demo data • {new Date().toISOString().slice(0, 10)}
          <button
            onClick={() => setIncidentsKey((k) => k + 1)}
            className="ml-3 inline-flex items-center rounded-md border border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-50 px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-600"
            title="Refresh incidents (R)"
          >
            Refresh Incidents
          </button>
        </footer>
      </div>
    </div>
  );
}
