import { useEffect, useState } from "react";
import { get } from "../../lib/apiClient";

export type Incident = {
  id: string;
  region: string;
  type: string;
  priority: string;
  status: string;
  etaSummary?: string;
  lastUpdated?: string;
  lat?: number;
  lon?: number;
};

export function useIncidents() {
  const [data, setData] = useState<Incident[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await get<Incident[]>("/v1/incidents");
        if (!alive) return;
        setData(res);
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load incidents");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
