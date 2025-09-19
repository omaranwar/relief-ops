import { useState } from "react";
import { useIncidents } from "./features/incidents/useIncidents";
import { usePlan } from "./features/planning/usePlan";

import KpiCards from "./components/KpiCards";
import IncidentsTable from "./components/IncidentsTable";
import MapView from "./components/MapView";
import ActionPlanCard from "./components/ActionPlanCard";
import SidebarFilters from "./components/SidebarFilters";
import NewIncidentModal from "./components/NewIncidentModal";

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
