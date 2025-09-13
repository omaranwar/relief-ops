import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { get } from "../lib/apiClient";

type Incident = {
  id: string;
  region: string;
  type: string;
  priority: "P1" | "P2" | "P3" | string;
  status?: string;
  lat?: number;
  lon?: number;
  etaSummary?: string;
};

type RouteGeo = {
  vehicleId: string;
  from: string;
  to: string;
  etaMinutes: number;
  distanceKm?: number;
  fromLat?: number;
  fromLon?: number;
  toLat?: number;
  toLon?: number;
};

type PlanGeo = {
  incidentId: string;
  routes: RouteGeo[];
};

const defaultCenter: [number, number] = [53.8, -1.55]; // Leeds area

function colorForPriority(p: Incident["priority"]) {
  if (p === "P1") return "#ef4444"; // red-500
  if (p === "P2") return "#f59e0b"; // amber-500
  return "#10b981";                 // emerald-500
}

export default function MapView({ incidentId, refreshKey }: { incidentId?: string | null, refreshKey?: number }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [plan, setPlan] = useState<PlanGeo | null>(null);

  // load incidents for markers — runs on mount AND whenever refreshKey changes
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await get<Incident[]>("/v1/incidents");
      if (!alive) return;
      setIncidents(data);
      // console.log("MapView: incidents fetched", data.map(d=>({id:d.id,status:d.status})));
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  // load selected incident routes as polylines
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!incidentId) { setPlan(null); return; }
      const data = await get<PlanGeo>(`/v1/incidents/${incidentId}/plan_geo`);
      if (!alive) return;
      setPlan(data);
    })();
    return () => { alive = false; };
  }, [incidentId, refreshKey]);

  const center = useMemo(() => {
    const sel = incidents.find(i => i.id === incidentId);
    return sel && typeof sel.lat === "number" && typeof sel.lon === "number"
      ? [sel.lat, sel.lon] as [number, number]
      : defaultCenter;
  }, [incidents, incidentId]);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-300">
      <MapContainer center={center} zoom={7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Incident markers with color by priority; hide Closed */}
        {incidents
          .filter(i => i.status !== "Closed")
          .filter(i => typeof i.lat === "number" && typeof i.lon === "number")
          .map((i) => (
            <CircleMarker
              key={i.id}
              center={[i.lat as number, i.lon as number]}
              radius={9}
              pathOptions={{ color: colorForPriority(i.priority), weight: 2, fillOpacity: 0.6 }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{i.type} — {i.priority}</div>
                  <div>{i.region}</div>
                  <div>Status: {i.status ?? "—"}</div>
                  <div>ETA: {i.etaSummary ?? "—"}</div>
                  <div className="mt-1 text-xs text-slate-500">{i.id}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Route polylines for selected incident */}
        {plan?.routes
          .filter(r => r.fromLat != null && r.fromLon != null && r.toLat != null && r.toLon != null)
          .map((r) => (
            <Polyline
              key={`${plan.incidentId}-${r.vehicleId}`}
              positions={[[r.fromLat as number, r.fromLon as number],[r.toLat as number, r.toLon as number]]}
              pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7 }}
            />
          ))
        }
      </MapContainer>
    </div>
  );
}
