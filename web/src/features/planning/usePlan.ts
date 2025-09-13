import { useCallback, useEffect, useState } from "react";
import { get, post } from "../../lib/apiClient";

export type Allocation = { resource: string; quantity: number; unit?: string; fromDepot?: string; toZones?: string[]; };
export type Route = { vehicleId: string; from: string; to: string; etaMinutes: number; distanceKm?: number; };
export type Plan = { incidentId: string; version: number; region: string; allocations: Allocation[]; routes: Route[]; sitrep?: string; };

export function usePlan(incidentId: string | null) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!incidentId) { setPlan(null); return; }
    setLoading(true);
    try {
      const p = await get<Plan>(`/v1/incidents/${incidentId}/plan`);
      setPlan(p); setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load plan"); setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  const regenerate = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true);
    try {
      const updated = await post<Plan>(`/v1/agent/runPlan`, { incidentId });
      // use the response immediately (no full reload)
      setPlan(updated); setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to regenerate plan");
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { plan, loading, error, refetch, regenerate };
}
