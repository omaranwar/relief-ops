import { useEffect, useMemo, useState } from "react";

/** Resolve API base exactly like App.tsx */
const API_BASE =
  (window as any).__RELIEFOPS_API_BASE__ ||
  (import.meta as any).env?.VITE_API_BASE ||
  "";

/* ---------- Types ---------- */

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
};

type AiDraft = {
  region?: string;            // "Leeds, UK"
  type?: string;              // "Flood" | "Storm" | "Fire" | string
  priority?: string;          // "P1" | "P2" | "P3"
  peopleAffected?: number;    // integer
  lat?: number | null;
  lon?: number | null;
  notes?: string;
  radiusMeters?: number;
};

type AiRecommendations = {
  incidentCategory?: string;
  urgency?: string;
  riskSummary?: string;
  recommendedResponders?: string[];
  resourcesNeeded?: string[];
};

/* ---------- Component ---------- */

export default function NewIncidentModal({ open, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  // manual form state (authoritative)
  const [region, setRegion] = useState("");
  const [type, setType] = useState("Flood");
  const [priority, setPriority] = useState("P2");
  const [peopleAffected, setPeopleAffected] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");

  // AI tab state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [aiRecs, setAiRecs] = useState<AiRecommendations | null>(null);

  // reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setMode("manual");
    setRegion("");
    setType("Flood");
    setPriority("P2");
    setPeopleAffected("");
    setLat("");
    setLon("");
    setAiPrompt("");
    setAiBusy(false);
    setAiErr(null);
    setAiDraft(null);
    setAiRecs(null);
  }, [open]);

  const canCreate = useMemo(() => {
    return region.trim().length > 0 && type && priority && /^\d*$/.test(peopleAffected);
  }, [region, type, priority, peopleAffected]);

  async function createIncident() {
    try {
      const res = await fetch(`${API_BASE}/v1/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          type,
          priority,
          peopleAffected: peopleAffected ? Number(peopleAffected) : undefined,
          lat: lat ? Number(lat) : undefined,
          lon: lon ? Number(lon) : undefined,
        }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt || "Failed to create incident");
      const data = JSON.parse(txt || "{}");
      const id = data?.id || data?.incidentId;
      onCreated?.(id);
    } catch (e: any) {
      alert(e?.message || "Failed to create incident");
    }
  }

  /**
   * Draft with AI
   * 1) Try /v1/incidents/aiClassify  (expects {text})     → { classification:{...}, recommendations? }
   * 2) Fallback /v1/incidents/aiParse (expects {prompt})   → { draft:{...}, recommendations? }
   */
  async function draftWithAI() {
    setAiBusy(true);
    setAiErr(null);
    setAiDraft(null);
    setAiRecs(null);

    // Helper: normalize classification → AiDraft
    const toDraftFromClassify = (payload: any): AiDraft => {
      const c = payload?.classification || {};
      return {
        type: c.type,
        priority: c.priority,
        peopleAffected: typeof c.peopleAffected === "number" ? c.peopleAffected : undefined,
        notes: Array.isArray(c.suggestedActions) ? c.suggestedActions.join("; ") : undefined,
      };
    };

    try {
      // --- 1) New classifier endpoint
      const res = await fetch(`${API_BASE}/v1/incidents/aiClassify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text: aiPrompt }),
      });
      const raw = await res.text();

      if (res.ok) {
        const data = raw ? JSON.parse(raw) : {};
        // draft
        setAiDraft(toDraftFromClassify(data));
        // optional recommendations
        setAiRecs(data?.recommendations || null);
        setAiBusy(false);
        return;
      } else {
        console.warn("[AI] aiClassify failed, falling back to aiParse:", raw);
      }
    } catch (err) {
      console.warn("[AI] aiClassify threw, falling back to aiParse:", err);
    }

    // --- 2) Legacy parser endpoint
    try {
      const res2 = await fetch(`${API_BASE}/v1/incidents/aiParse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const txt2 = await res2.text();
      if (!res2.ok) throw new Error(txt2 || "AI parse failed");

      const data2 = txt2 ? JSON.parse(txt2) : {};
      // Preferred return shape
      if (data2?.draft) {
        setAiDraft(data2.draft as AiDraft);
      } else if (data2?.classification) {
        setAiDraft(toDraftFromClassify(data2));
      } else {
        // Very old shape with fields at top level
        setAiDraft({
          region: data2.region,
          type: data2.type,
          priority: data2.priority,
          peopleAffected: data2.peopleAffected,
          lat: data2.lat,
          lon: data2.lon,
          radiusMeters: data2.radiusMeters,
        });
      }
      // optional recommendations
      setAiRecs(data2?.recommendations || null);
    } catch (e: any) {
      setAiErr(e?.message || "Failed to parse with AI");
    } finally {
      setAiBusy(false);
    }
  }

  function applyAiDraft() {
    if (!aiDraft) return;
    if (aiDraft.region) setRegion(aiDraft.region);
    if (aiDraft.type) setType(aiDraft.type);
    if (aiDraft.priority) setPriority(aiDraft.priority);
    if (typeof aiDraft.peopleAffected === "number" && !Number.isNaN(aiDraft.peopleAffected)) {
      setPeopleAffected(String(aiDraft.peopleAffected));
    }
    if (aiDraft.lat != null) setLat(String(aiDraft.lat));
    if (aiDraft.lon != null) setLon(String(aiDraft.lon));
    setMode("manual");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Incident</h3>
          <button
            className="rounded-md px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setMode("manual")}
              className={`px-3 py-1.5 text-sm ${mode === "manual" ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-800 dark:text-slate-100"}`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`px-3 py-1.5 text-sm ${mode === "ai" ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-800 dark:text-slate-100"}`}
            >
              Use AI
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {mode === "manual" ? (
            <ManualForm
              region={region}
              setRegion={setRegion}
              type={type}
              setType={setType}
              priority={priority}
              setPriority={setPriority}
              peopleAffected={peopleAffected}
              setPeopleAffected={setPeopleAffected}
              lat={lat}
              setLat={setLat}
              lon={lon}
              setLon={setLon}
            />
          ) : (
            <AiTab
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              aiBusy={aiBusy}
              aiErr={aiErr}
              aiDraft={aiDraft}
              aiRecs={aiRecs}
              draftWithAI={draftWithAI}
              applyAiDraft={applyAiDraft}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-slate-700">
          <button
            className="rounded-md px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
            disabled={!canCreate}
            onClick={createIncident}
          >
            Create Incident
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function ManualForm(props: {
  region: string; setRegion: (v: string) => void;
  type: string; setType: (v: string) => void;
  priority: string; setPriority: (v: string) => void;
  peopleAffected: string; setPeopleAffected: (v: string) => void;
  lat: string; setLat: (v: string) => void;
  lon: string; setLon: (v: string) => void;
}) {
  const {
    region, setRegion, type, setType, priority, setPriority,
    peopleAffected, setPeopleAffected, lat, setLat, lon, setLon
  } = props;

  return (
    <div className="space-y-4">
      <Labeled label="Region / City">
        <input
          className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          placeholder="Leeds, UK"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </Labeled>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labeled label="Type">
          <select
            className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Flood</option>
            <option>Storm</option>
            <option>Fire</option>
            <option>Earthquake</option>
            <option>Other</option>
          </select>
        </Labeled>

        <Labeled label="Priority">
          <select
            className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </Labeled>
      </div>

      <Labeled label="People affected (est)">
        <input
          className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          placeholder="1200"
          inputMode="numeric"
          value={peopleAffected}
          onChange={(e) => setPeopleAffected(e.target.value.replace(/[^\d]/g, ""))}
        />
      </Labeled>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labeled label="Latitude (optional)">
          <input
            className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            placeholder="53.7996"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </Labeled>
        <Labeled label="Longitude (optional)">
          <input
            className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            placeholder="-1.5491"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
          />
        </Labeled>
      </div>
    </div>
  );
}

function AiTab(props: {
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  aiBusy: boolean;
  aiErr: string | null;
  aiDraft: AiDraft | null;
  aiRecs: AiRecommendations | null;
  draftWithAI: () => void;
  applyAiDraft: () => void;
}) {
  const { aiPrompt, setAiPrompt, aiBusy, aiErr, aiDraft, aiRecs, draftWithAI, applyAiDraft } = props;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Describe the incident in plain English. Example:
        <span className="ml-1 italic">
          “Flood in Waltham Forest near Lea Bridge Rd, radius 1 km, ~1200 affected, priority P2”
        </span>
      </p>
      <textarea
        className="w-full min-h-[120px] rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
        placeholder="Type your instruction…"
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          disabled={!aiPrompt.trim() || aiBusy}
          onClick={draftWithAI}
          className="rounded-md px-3 py-2 bg-blue-600 text-white disabled:opacity-50"
        >
          {aiBusy ? "Drafting…" : "Draft with AI"}
        </button>
        {aiErr && <span className="text-sm text-rose-600">{aiErr}</span>}
      </div>

      {/* AI Draft */}
      {aiDraft && (
        <div className="mt-3 rounded-lg border p-3 dark:border-slate-700">
          <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">AI Draft</h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Row k="Region / City" v={aiDraft.region ?? "—"} />
            <Row k="Type" v={aiDraft.type ?? "—"} />
            <Row k="Priority" v={aiDraft.priority ?? "—"} />
            <Row k="People affected" v={aiDraft.peopleAffected ?? "—"} />
            <Row k="Latitude" v={aiDraft.lat ?? "—"} />
            <Row k="Longitude" v={aiDraft.lon ?? "—"} />
            {aiDraft.radiusMeters != null && <Row k="Radius (m)" v={aiDraft.radiusMeters} />}
          </dl>
          <div className="mt-3">
            <button
              onClick={applyAiDraft}
              className="rounded-md px-3 py-2 border border-slate-300 dark:border-slate-600"
            >
              Apply to form
            </button>
          </div>
        </div>
      )}

      {/* AI Recommendations (optional) */}
      {aiRecs && (
        <div className="mt-3 rounded-lg border p-3 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">AI Recommendations</h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Row k="Category" v={aiRecs.incidentCategory ?? "—"} />
            <Row k="Urgency" v={aiRecs.urgency ?? "—"} />
            <Row
              k="Responders"
              v={aiRecs.recommendedResponders?.join(", ") ?? "—"}
            />
            <Row
              k="Resources Needed"
              v={aiRecs.resourcesNeeded?.join(", ") ?? "—"}
            />
            <Row k="Risk Summary" v={aiRecs.riskSummary ?? "—"} />
          </dl>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">{label}</div>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <>
      <div className="text-slate-500 dark:text-slate-400">{k}</div>
      <div className="text-slate-900 dark:text-slate-100">{String(v)}</div>
    </>
  );
}