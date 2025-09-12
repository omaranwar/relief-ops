type Incident = {
  id: string;
  region: string;
  type: string;
  priority: "P1" | "P2" | "P3";
  status: "New" | "Running" | "Planned" | "Published";
  eta?: string;
  updated: string;
};

const incidents: Incident[] = [
  { id: "INC-240915-001", region: "Leeds, UK", type: "Flood", priority: "P1", status: "Planned", eta: "6m", updated: "2m ago" },
  { id: "INC-240915-002", region: "Oxford, UK", type: "Flood", priority: "P2", status: "Running", eta: "10m", updated: "Just now" },
  { id: "INC-240915-003", region: "York, UK", type: "Flood", priority: "P3", status: "New", eta: "—", updated: "4m ago" },
];

export default function IncidentsTable() {
  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="text-base font-semibold">Incidents</div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search incidents"
            className="h-9 w-48 rounded-lg border px-3 text-sm"
          />
          <button className="h-9 rounded-lg border px-3 text-sm hover:bg-slate-50">Refresh</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 px-4">ID</th>
              <th className="px-4">Region</th>
              <th className="px-4">Type</th>
              <th className="px-4">Priority</th>
              <th className="px-4">Status</th>
              <th className="px-4">ETA</th>
              <th className="px-4">Updated</th>
              <th className="px-4"></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((i, idx) => (
              <tr key={i.id} className={`border-t ${idx % 2 ? "bg-slate-50/50" : "bg-white"} hover:bg-blue-50/40 transition`}>
                <td className="py-2 px-4 font-medium">{i.id}</td>
                <td className="px-4">{i.region}</td>
                <td className="px-4">
                  <span className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    {i.type}
                  </span>
                </td>
                <td className="px-4">
                  <span className={`px-2 py-1 rounded-lg text-xs border ${
                    i.priority === "P1" ? "bg-red-100 text-red-800 border-red-200" :
                    i.priority === "P2" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    "bg-green-100 text-green-800 border-green-200"
                  }`}>
                    {i.priority}
                  </span>
                </td>
                <td className="px-4">{i.status}</td>
                <td className="px-4">{i.eta}</td>
                <td className="px-4 text-slate-500">{i.updated}</td>
                <td className="px-4">
                  <div className="flex gap-2 justify-end">
                    <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-slate-50">Open</button>
                    <button className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">Run Plan</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
