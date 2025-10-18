const API_BASE = import.meta.env.VITE_API_BASE!;

// GET /v1/incidents
export async function getIncidents() {
  const r = await fetch(`${API_BASE}/v1/incidents`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  return r.json() as Promise<Array<{id:string;region:string;type:string;status:string}>>;
}

// POST /v1/incident
export async function createIncident(payload: {
  region: string; type: string; status: string;
}) {
  const r = await fetch(`${API_BASE}/v1/incident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  return r.json();
}