type Props = { onNewIncident?: () => Promise<void> | void };

export default function TopBar({ onNewIncident }: Props) {
  async function handleNewIncident() {
    try {
      if (!onNewIncident) return;
      await onNewIncident();
    } catch (e) {
      // surface any error from the caller
      alert("Failed to create incident.");
      console.error(e);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur border-b dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">R</div>
          <div>
            <div className="text-base font-semibold leading-tight dark:text-slate-100">ReliefOps Console</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Climate Disasters &amp; Emergency Response
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 dark:text-slate-300 border rounded-lg px-2 py-1 dark:border-slate-700">
            Role: Coordinator
          </span>
          <button
            type="button"
            className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => alert("Export coming soon…")}
          >
            Export SITREP
          </button>
          <button
            type="button"
            className="text-sm rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
            onClick={handleNewIncident}
          >
            New Incident
          </button>
        </div>
      </div>
    </div>
  );
}