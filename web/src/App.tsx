import TopBar from "./components/TopBar";
import KpiCards from "./components/KpiCards";
import MapView from "./components/MapView";   // ✅ updated
import ActionPlanCard from "./components/ActionPlanCard";
import IncidentsTable from "./components/IncidentsTable";
import SidebarFilters from "./components/SidebarFilters";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <TopBar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <SidebarFilters />
          </div>

          {/* Main */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                ReliefOps Console
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Climate Disasters &amp; Emergency Response Dashboard
              </p>
            </div>

            <KpiCards />

            {/* Map + Action Plan row (equal heights, flush bottom) */}
            <div className="grid grid-cols-12 gap-4 items-stretch">
              <div className="col-span-12 xl:col-span-6">
                <MapView />   {/* ✅ swapped in real map */}
              </div>
              <div className="col-span-12 xl:col-span-6">
                <ActionPlanCard />
              </div>
            </div>

            {/* Table sits directly under the row, full width */}
            <IncidentsTable />

            <footer className="text-xs text-slate-500 dark:text-slate-400 pt-4 border-t dark:border-slate-700">
              ReliefOps v0.1 • Demo data • {new Date().toISOString().slice(0,10)}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}