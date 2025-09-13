export default function TopBar({ onNewIncident }: { onNewIncident?: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">
            R
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">ReliefOps Console</div>
            <div className="text-xs text-slate-500">Climate Disasters &amp; Emergency Response</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 border rounded-lg px-2 py-1">Role: Coordinator</span>
          <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">
            Export SITREP
          </button>
          <button
            className="text-sm rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
            onClick={() => { console.log("TopBar: New Incident clicked"); onNewIncident?.(); }}
          >
            New Incident
          </button>
        </div>
      </div>
    </div>
  );
}
