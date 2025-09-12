type Kpi = { label: string; value: string | number; theme: "red"|"amber"|"green"|"blue" };

const kpis: Kpi[] = [
  { label: "Incidents (Active)", value: 3, theme: "red" },
  { label: "People Affected (est)", value: "12,450", theme: "amber" },
  { label: "Units Available", value: 28, theme: "green" },
  { label: "Avg ETA", value: "7m", theme: "blue" },
];

const themeMap: Record<Kpi["theme"], { card: string; label: string; value: string }> = {
  red:   { card: "bg-red-50 border-red-200",     label: "text-red-700",   value: "text-red-800" },
  amber: { card: "bg-amber-50 border-amber-200", label: "text-amber-700", value: "text-amber-800" },
  green: { card: "bg-green-50 border-green-200", label: "text-green-700", value: "text-green-800" },
  blue:  { card: "bg-blue-50 border-blue-200",   label: "text-blue-700",  value: "text-blue-800" },
};

export default function KpiCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {kpis.map((k) => {
        const t = themeMap[k.theme];
        return (
          <div key={k.label} className={`rounded-xl shadow p-4 border ${t.card}`}>
            <div className={`text-xs ${t.label}`}>{k.label}</div>
            <div className={`text-2xl font-semibold mt-1 ${t.value}`}>{k.value}</div>
          </div>
        );
      })}
    </div>
  );
}
