import { useState } from "react";
import { post } from "../lib/apiClient";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export default function NewIncidentModal({ open, onClose, onCreated }: Props) {
  const [region, setRegion] = useState("Leeds, UK");
  const [type, setType] = useState<"Flood" | "Fire" | "Storm">("Flood");
  const [priority, setPriority] = useState<"P1" | "P2" | "P3">("P2");
  const [people, setPeople] = useState<number>(1200);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function submit() {
    try {
      setSubmitting(true);
      const res = await post<{ created: true; id: string }>("/v1/incidents/new", {
        region,
        type,
        priority,
        peopleAffected: people,
      });
      onCreated(res.id);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to create incident");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[5000] grid place-items-center bg-black/40">
      <div className="w-[92vw] max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">New Incident</h3>
          <button className="rounded-lg border px-3 py-1.5" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="block mb-1 text-slate-600">Region / City</span>
            <input className="w-full rounded-lg border px-3 py-2" value={region} onChange={e=>setRegion(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Type</span>
              <select className="w-full rounded-lg border px-3 py-2" value={type} onChange={e=>setType(e.target.value as any)}>
                <option>Flood</option><option>Fire</option><option>Storm</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Priority</span>
              <select className="w-full rounded-lg border px-3 py-2" value={priority} onChange={e=>setPriority(e.target.value as any)}>
                <option>P1</option><option>P2</option><option>P3</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="block mb-1 text-slate-600">People affected (est)</span>
            <input type="number" className="w-full rounded-lg border px-3 py-2" value={people} onChange={e=>setPeople(Number(e.target.value))} />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={onClose}>Cancel</button>
          <button disabled={submitting} className="rounded-lg bg-slate-900 text-white px-3 py-2 disabled:opacity-60" onClick={submit}>
            {submitting ? "Creating…" : "Create Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}
