import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { get } from "../lib/apiClient";

type Incident = {
  id: string;
  region: string;
  type: string;
  priority: string;
  lat?: number;
  lon?: number;
  etaSummary?: string;
};

const defaultCenter: [number, number] = [53.8, -1.55]; // Leeds area

// Fix default marker icons path for Vite bundling
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await get<Incident[]>("/v1/incidents");
        if (!alive) return;
        setIncidents(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-300">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!loading &&
          incidents
            .filter(i => typeof i.lat === "number" && typeof i.lon === "number")
            .map((i) => (
              <Marker key={i.id} position={[i.lat as number, i.lon as number]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{i.type} — {i.priority}</div>
                    <div>{i.region}</div>
                    <div>ETA: {i.etaSummary ?? "—"}</div>
                    <div className="mt-1 text-xs text-slate-500">{i.id}</div>
                  </div>
                </Popup>
              </Marker>
            ))
        }
      </MapContainer>
    </div>
  );
}
