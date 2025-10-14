import { useEffect, useRef, useState } from "react";
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
  const [lat, setLat] = useState<number | "">("");
  const [lon, setLon] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const regionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError("");
      setSubmitting(false);
      // small focus delay so modal is mounted
      setTimeout(() => regionRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  function validate(): string | null {
    if (!region.trim()) return "Region is required.";
    if (!["Flood", "Fire", "Storm"].includes(type)) return "Invalid incident type.";
    if (!["P1", "P2", "P3"].includes(priority)) return "Invalid priority.";
    if (Number.isNaN(people) || people < 0) return "People affected must be 0 or more.";
    if (lat !== "" && (lat < -90 || lat > 90)) return "Latitude must be between -90 and 90.";
    if (lon !== "" && (lon < -180 || lon > 180)) return "Longitude must be between -180 and 180.";
    return null;
    }

  async function submit() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setSubmitting(true);
      setError("");

      // payload expected by your Lambda (adjust keys if your backend differs)
      const payload: Record<string, unknown> = {
        region,
        type,
        priority,
        peopleAffected: people
      };
      if (lat !== "") payload.lat = lat;
      if (lon !== "") payload.lon = lon;

      // Your API route is POST /v1/incident (singular)
      const res = await post<{ id: string }>("/v1/incident", payload);

      if (!res?.id) {
        throw new Error("Server did not return an incident id.");
      }

      onCreated(res.id);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to create incident");
      // keep modal open so the user can correct inputs or retry
    } finally {
      setSubmitting(false);
    }
  }

  function onEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="fixed inset-0 z-[5000] grid place-items-center bg-black/40">
      <div className="w-[92vw] max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">New Incident</h3>
          <button className="rounded-lg border px-3 py-1.5" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-3" onKeyDown={onEnter}>
          {error && (
            <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
              {error}
            </div>
          )}

          <label className="block text-sm">
            <span className="block mb-1 text-slate-600">Region / City</span>
            <input
              ref={regionRef}
              className="w-full rounded-lg border px-3 py-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Type</span>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option>Flood</option>
                <option>Fire</option>
                <option>Storm</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Priority</span>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option>P1</option>
                <option>P2</option>
                <option>P3</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="block mb-1 text-slate-600">People affected (est)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border px-3 py-2"
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Latitude (optional)</span>
              <input
                type="number"
                step="any"
                className="w-full rounded-lg border px-3 py-2"
                value={lat}
                onChange={(e) => setLat(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Longitude (optional)</span>
              <input
                type="number"
                step="any"
                className="w-full rounded-lg border px-3 py-2"
                value={lon}
                onChange={(e) => setLon(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={submitting}
            className="rounded-lg bg-slate-900 text-white px-3 py-2 disabled:opacity-60"
            onClick={submit}
          >
            {submitting ? "Creating…" : "Create Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}