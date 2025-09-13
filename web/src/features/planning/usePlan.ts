import { useEffect, useState } from "react";
import { get } from "../../lib/apiClient";

export type Allocation = { resource: string; quantity: number; unit?: string; fromDepot?: string; toZones?: string[]; };
export type Route = { vehicleId: string; from: string; to: string; etaMinutes: number; distanceKm?: number; };
export type Plan = { incidentId: string; version: number; region: string; allocations: Allocation[]; routes: Route[]; sitrep?: string; };

export function usePlan(incidentId: string | null) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!incidentId) { setPlan(null); return; }
      try {
        setLoading(true);
        const p = await get<Plan>(`/v1/incidents/${incidentId}/plan`);
        if (!alive) return;
        setPlan(p); setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load plan"); setPlan(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [incidentId]);

  return { plan, loading, error };
}
