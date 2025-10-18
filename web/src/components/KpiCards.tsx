// KpiCards.tsx uses selectedIncidentId to call /v1/summary?incidentId=...
// <KpiCards selectedIncidentId={selectedIncidentId} refreshKey={refreshKey} />

// src/components/KpiCards.tsx
import { useEffect, useState } from "react";
import { get } from "../lib/apiClient";

type Props = {
  refreshKey?: number;
  selectedIncidentId?: string; // pass from App (currently selected incident)
};

type Summary = {
  activeIncidents: number;
  peopleAffected: number;
  unitsAvailable?: number | null;
  avgEtaMinutes?: number | null;
};

function KPICard({
  title,
  value,
  accent,
  subtitle,
}: {
  title: string;
  value: string | number;
  accent: "rose" | "amber" | "teal" | "indigo";
  subtitle?: string;
}) {
  const styles: Record<"rose" | "amber" | "teal" | "indigo", string> = {
    rose:
      "bg-rose-900/10 border-rose-900/25 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,.18)]",
    amber:
      "bg-amber-900/10 border-amber-900/25 text-amber-100 shadow-[inset_0_0_0_1px_rgba(245,158,11,.18)]",
    teal:
      "bg-teal-900/10 border-teal-900/25 text-teal-100 shadow-[inset_0_0_0_1px_rgba(13,148,136,.18)]",
    indigo:
      "bg-indigo-900/10 border-indigo-900/25 text-indigo-100 shadow-[inset_0_0_0_1px_rgba(99,102,241,.18)]",
  };
  return (
    <div className={`rounded-3xl p-6 border ${styles[accent]} backdrop-blur`}>
      <div className="text-base font-semibold opacity-90">{title}</div>
      <div className="mt-4 text-4xl font-extrabold tracking-tight">{value}</div>
      {subtitle ? <div className="mt-2 text-xs opacity-75">{subtitle}</div> : null}
    </div>
  );
}

export default function KpiCards({ refreshKey, selectedIncidentId }: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // simple number formatter for big numbers
  const fmt = (n: unknown) =>
    typeof n === "number" ? n.toLocaleString() : "—";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Prefer the summary endpoint (includes unitsAvailable when incidentId is given)
      try {
        const path = selectedIncidentId
          ? `/v1/summary?incidentId=${encodeURIComponent(
              selectedIncidentId
            )}&ts=${Date.now()}`
          : `/v1/summary?ts=${Date.now()}`; // cache buster

        const s = await get<Summary>(path);
        if (!cancelled) {
          setData(s);
          setLoading(false);
        }
        return;
      } catch (e) {
        console.warn("[KPI] /v1/summary failed; falling back to /v1/incidents", e);
      }

      // Fallback: derive from the incidents list (unitsAvailable unknown here)
      try {
        const inc = await get<
          Array<{ status?: string; peopleAffected?: number; etaMinutes?: number }>
        >(`/v1/incidents?ts=${Date.now()}`);

        const open = inc.filter(
          (i) => (i.status || "").toLowerCase() !== "closed"
        );

        const activeIncidents = open.length;

        const peopleAffected = open.reduce(
          (sum, i) => sum + (Number(i.peopleAffected) || 0),
          0
        );

        const etas = open
          .map((i) => Number(i.etaMinutes))
          .filter((n) => Number.isFinite(n));

        const avgEtaMinutes =
          etas.length > 0 ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : null;

        const derived: Summary = {
          activeIncidents,
          peopleAffected,
          unitsAvailable: null, // unknown in fallback
          avgEtaMinutes,
        };
        if (!cancelled) {
          setData(derived);
          setLoading(false);
        }
      } catch (e) {
        console.error("[KPI] Fallback /v1/incidents failed", e);
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, selectedIncidentId]);

  const dash = "—";
  const active = loading ? "…" : fmt(data?.activeIncidents ?? null);
  const ppl = loading ? "…" : fmt(data?.peopleAffected ?? null);

  const unitsVal =
    loading ? "…" : data?.unitsAvailable == null ? dash : fmt(data.unitsAvailable);

  const etaVal =
    loading
      ? "…"
      : typeof data?.avgEtaMinutes === "number"
      ? `${data.avgEtaMinutes} min`
      : dash;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard title="Incidents (Active)" value={active} accent="rose" />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard title="People Affected (est)" value={ppl} accent="amber" />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="Units Available"
          value={unitsVal}
          accent="teal"
          subtitle={
            !loading && unitsVal === "—"
              ? "Shown when an incident is selected"
              : undefined
          }
        />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="Avg ETA"
          value={etaVal}
          accent="indigo"
          subtitle={!loading && etaVal === "—" ? "From ETAs or /v1/summary" : undefined}
        />
      </div>
    </div>
  );
}