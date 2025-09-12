import DarkModeToggle from "./DarkModeToggle";

export default function TopBar() {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:bg-slate-900/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center font-bold shadow-sm">
            R
          </div>
          <div>
            <div className="text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
              ReliefOps Console
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Climate Disasters &amp; Emergency Response
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 dark:text-slate-200 border rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            Role: Coordinator
          </span>
          <button className="text-sm rounded-lg border border-blue-600 text-blue-600 px-3 py-1.5 hover:bg-blue-50 transition dark:hover:bg-slate-800">
            Export SITREP
          </button>
          <button className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700 transition">
            New Incident
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
