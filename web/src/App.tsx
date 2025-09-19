import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import KpiCards from "./components/KpiCards";
import MapView from "./components/MapView";
import ActionPlanCard from "./components/ActionPlanCard";
import IncidentsTable from "./components/IncidentsTable";
import LogisticsPanel from "./components/LogisticsPanel";
import NewIncidentModal from "./components/NewIncidentModal"; // <-- import modal
import { get } from "./lib/apiClient";

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

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [plan, setPlan] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false); // <-- track modal

  // Load incidents list
  useEffect(() => {
    (async () => {
      try {
        const all = await get<Incident[]>("/v1/incidents");
        setIncidents(all);
        if (!selectedIncidentId && all.length) setSelectedIncidentId(all[0].id);
      } catch (e) {
        console.error("Failed to load incidents", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Load plan for the selected incident (cache-busted)
  useEffect(() => {
    if (!selectedIncidentId) {
      setPlan(null);
      return;
    }
    (async () => {
      try {
        const p = await get<any>(`/v1/plan/${selectedIncidentId}?ts=${Date.now()}`);
        setPlan(p);
      } catch (e) {
        console.error("Failed to load plan", e);
        setPlan(null);
      }
    })();
  }, [selectedIncidentId, refreshKey]);

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* Top bar triggers modal */}
      <TopBar onNewIncident={() => setShowNewModal(true)} />

      {/* New Incident Modal */}
      <NewIncidentModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(id) => {
          setSelectedIncidentId(id);
          setRefreshKey((k) => k + 1);
          setShowNewModal(false);
          setTimeout(() => {
            document
              .getElementById("action-plan")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        }}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ReliefOps Console</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Climate Disasters &amp; Emergency Response Dashboard
          </p>
          {selectedIncidentId && (
            <p className="text-xs text-slate-500 mt-1">
              Selected Incident: <span className="font-medium">{selectedIncidentId}</span>
            </p>
          )}
        </div>

        <KpiCards refreshKey={refreshKey} />

        <div className="grid grid-cols-12 gap-4 items-stretch">
          <div className="col-span-12 xl:col-span-6">
            <MapView
              key={`map-${selectedIncidentId}-${refreshKey}`}
              incidentId={selectedIncidentId}
              refreshKey={refreshKey}
            />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <div id="action-plan">
              <ActionPlanCard incidentId={selectedIncidentId} plan={plan} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <LogisticsPanel
              incident={selectedIncident}
              onReserved={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </div>

        <IncidentsTable
          onView={(id) => {
            setSelectedIncidentId(id);
            setTimeout(() => {
              document
                .getElementById("action-plan")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
          }}
          onRunPlan={(id) => {
            setSelectedIncidentId(id);
            setRefreshKey((k) => k + 1);
            setTimeout(() => {
              document
                .getElementById("action-plan")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
          }}
          onChanged={() => setRefreshKey((k) => k + 1)}
          key={`table-${refreshKey}`}
        />

        <footer className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t dark:border-slate-700">
          ReliefOps v0.1 • Demo data • {new Date().toISOString().slice(0, 10)}
        </footer>
      </div>
    </div>
  );
}