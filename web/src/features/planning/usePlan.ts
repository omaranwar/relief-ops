import { useEffect, useState } from "react";
import { get } from "../../lib/apiClient";

export type Allocation = {
  resource: string;
  quantity: number;
  unit?: string;
  fromDepot?: string;
  toZones?: string[];
};

export type Route = {
  vehicleId: string;
  from: string;
  to: string;
  etaMinutes: number;
  distanceKm?: number;
};

export type Plan = {
  incidentId: string;
  version: number;
  region: string;
  allocations: Allocation[];
  routes: Route[];
  sitrep?: string;
};

type Incident = { id: string };

export function usePlan() {
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // 1) get incidents, pick first
        const incidents = await get<Incident[]>("/v1/incidents");
        const firstId = incidents?.[0]?.id ?? null;
        if (!firstId) throw new Error("No incidents available");
        if (!alive) return;
        setIncidentId(firstId);
        // 2) fetch plan for that id
        const p = await get<Plan>(`/v1/incidents/${firstId}/plan`);
        if (!alive) return;
        setPlan(p);
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load plan");
        setPlan(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { incidentId, plan, loading, error };
}
