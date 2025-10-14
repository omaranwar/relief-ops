import { useEffect, useState } from "react";
import { get } from "../lib/apiClient";

type Props = { refreshKey?: number };

type Summary = {
  activeIncidents: number;
  peopleAffected: number;
  unitsAvailable?: number;
  avgEtaMinutes?: number; // number of minutes for an average ETA
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
  const styles: Record<typeof accent, string> = {
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
      {subtitle ? (
        <div className="mt-2 text-xs opacity-75">{subtitle}</div>
      ) : null}
    </div>
  );
}

export default function KpiCards({ refreshKey }: Props) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // 1) Prefer the /v1/summary endpoint if you have it.
      try {
        const s = await get<Summary>("/v1/summary");
        if (!cancelled) {
          console.info("[KPI] Using /v1/summary:", s);
          setData(s);
          setLoading(false);
        }
        return;
      } catch (e) {
        console.warn("[KPI] /v1/summary failed; falling back to /v1/incidents", e);
      }

      // 2) Fallback: derive KPIs from /v1/incidents
      try {
        const inc = await get<
          Array<{ status?: string; peopleAffected?: number; etaMinutes?: number }>
        >("/v1/incidents");

        const activeIncidents = inc.filter(
          (i) => (i.status || "").toLowerCase() !== "closed"
        ).length;

        const peopleAffected = inc.reduce(
          (sum, i) => sum + (Number(i.peopleAffected) || 0),
          0
        );

        // If your items contain an etaMinutes field, compute an average; otherwise leave undefined.
        const etas = inc.map((i) => Number(i.etaMinutes)).filter((n) => Number.isFinite(n));
        const avgEtaMinutes =
          etas.length > 0 ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : undefined;

        const derived: Summary = {
          activeIncidents,
          peopleAffected,
          unitsAvailable: undefined,
          avgEtaMinutes,
        };
        if (!cancelled) {
          console.info("[KPI] Derived from /v1/incidents:", derived);
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
  }, [refreshKey]);

  const dash = "—";
  const active = data?.activeIncidents ?? dash;
  const ppl = data?.peopleAffected ?? dash;
  const units = data?.unitsAvailable ?? dash;
  const eta =
    typeof data?.avgEtaMinutes === "number" ? `${data?.avgEtaMinutes} min` : dash;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="Incidents (Active)"
          value={loading ? "…" : active}
          accent="rose"
        />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="People Affected (est)"
          value={loading ? "…" : ppl}
          accent="amber"
        />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="Units Available"
          value={loading ? "…" : units}
          accent="teal"
          subtitle={!loading && units === "—" ? "Implement /v1/summary to populate" : undefined}
        />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-3">
        <KPICard
          title="Avg ETA"
          value={loading ? "…" : eta}
          accent="indigo"
          subtitle={!loading && eta === "—" ? "Derive from incident ETAs or summary" : undefined}
        />
      </div>
    </div>
  );
}