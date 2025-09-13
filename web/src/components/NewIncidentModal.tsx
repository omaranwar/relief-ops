import { useState } from "react";
import Modal from "./Modal";
import { post } from "../lib/apiClient";

export default function NewIncidentModal({
  open, onClose, onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [region, setRegion] = useState("");
  const [type, setType] = useState("Flood");
  const [priority, setPriority] = useState("P2");
  const [people, setPeople] = useState<number | "">("");
  const [lat, setLat] = useState<number | "">("");
  const [lon, setLon] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!region || !type || !priority) return;
    try {
      console.log("Submitting new incident…", { region, type, priority, people, lat, lon });
      setSubmitting(true);
      const body: any = { region, type, priority, peopleAffected: people || 0 };
      if (lat !== "") body.lat = Number(lat);
      if (lon !== "") body.lon = Number(lon);
      const res = await post<{ id: string }>("/v1/incidents/new", body);
      console.log("API response:", res);
      onCreated(res.id);
      onClose();
    } catch (e) {
      console.error("Error creating incident:", e);
      alert("Failed to create incident");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="New Incident" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Region / City</label>
          <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="e.g. Manchester, UK"
                 className="w-full border rounded-lg px-3 py-2"/>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Type</label>
            <select value={type} onChange={e=>setType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2">
              <option>Flood</option>
              <option>Wildfire</option>
              <option>Hurricane</option>
              <option>Earthquake</option>
              <option>Storm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Priority</label>
            <select value={priority} onChange={e=>setPriority(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2">
              <option>P1</option>
              <option>P2</option>
              <option>P3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">People Affected (est)</label>
            <input type="number" min="0" value={people} onChange={e=>setPeople(e.target.value === "" ? "" : Number(e.target.value))}
                   className="w-full border rounded-lg px-3 py-2"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Latitude (optional)</label>
            <input type="number" step="any" value={lat} onChange={e=>setLat(e.target.value===""?"":Number(e.target.value))}
                   className="w-full border rounded-lg px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Longitude (optional)</label>
            <input type="number" step="any" value={lon} onChange={e=>setLon(e.target.value===""?"":Number(e.target.value))}
                   className="w-full border rounded-lg px-3 py-2"/>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="rounded-lg border px-3 py-2 hover:bg-slate-50" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
                  onClick={submit} disabled={submitting || !region || !type || !priority}>
            {submitting ? "Creating…" : "Create Incident"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
