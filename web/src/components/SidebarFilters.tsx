import StatusPill from "./StatusPill";
import { useState } from "react";

export default function SidebarFilters() {
  const [region, setRegion] = useState("UK-North");
  const [status, setStatus] = useState<string | undefined>();
  const [maxTrucks, setMaxTrucks] = useState(3);
  const [prioritiseMedical, setPrioritiseMedical] = useState(true);
  const [notes, setNotes] = useState("");

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-2xl shadow p-4 border border-slate-200">
        <div className="text-base font-semibold mb-2 text-slate-800">Filters</div>
        <label className="block text-xs text-slate-600 mb-1">Region</label>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option>UK-North</option>
          <option>UK-South</option>
          <option>EU</option>
        </select>

        <label className="block text-xs text-slate-600 mb-1">Status</label>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={status ?? ""}
          onChange={(e) => setStatus(e.target.value || undefined)}
        >
          <option value="">Any</option>
          <option>New</option>
          <option>Running</option>
          <option>Planned</option>
          <option>Published</option>
        </select>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-600">Current</span>
          <StatusPill variant="blue">{region}</StatusPill>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 border border-slate-200">
        <div className="text-base font-semibold mb-2 text-slate-800">What-if</div>

        <label className="flex items-center justify-between text-sm mb-2">
          <span>Prioritise Medical</span>
          <input
            type="checkbox"
            checked={prioritiseMedical}
            onChange={(e) => setPrioritiseMedical(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="block text-sm">Max Trucks: <b>{maxTrucks}</b></label>
        <input
          type="range"
          min={0}
          max={10}
          value={maxTrucks}
          onChange={(e) => setMaxTrucks(parseInt(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs text-slate-600 mt-3 mb-1">Notes to agent</label>
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={3}
          placeholder="e.g., bridge at A64 closed; prioritise dialysis patients"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2 mt-3">
          <button className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition">
            Apply & Re-Plan
          </button>
          <button className="flex-1 rounded-lg border px-3 py-2 hover:bg-slate-50 transition">
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
