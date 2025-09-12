type Variant = "blue" | "green" | "amber" | "red" | "slate" | "purple" | "emerald" | "rose" | "cyan";

const map: Record<Variant, { bg: string; fg: string; br: string }> = {
  blue:   { bg: "bg-blue-50",   fg: "text-blue-700",   br: "border-blue-200" },
  green:  { bg: "bg-green-50",  fg: "text-green-700",  br: "border-green-200" },
  amber:  { bg: "bg-amber-50",  fg: "text-amber-700",  br: "border-amber-200" },
  red:    { bg: "bg-red-50",    fg: "text-red-700",    br: "border-red-200" },
  slate:  { bg: "bg-slate-50",  fg: "text-slate-700",  br: "border-slate-200" },
  purple: { bg: "bg-purple-50", fg: "text-purple-700", br: "border-purple-200" },
  emerald:{ bg: "bg-emerald-50",fg: "text-emerald-700",br: "border-emerald-200" },
  rose:   { bg: "bg-rose-50",   fg: "text-rose-700",   br: "border-rose-200" },
  cyan:   { bg: "bg-cyan-50",   fg: "text-cyan-700",   br: "border-cyan-200" },
};

export default function StatusPill({
  children,
  variant = "slate",
  className = "",
}: { children: React.ReactNode; variant?: Variant; className?: string }) {
  const c = map[variant];
  return (
    <span className={`px-2 py-1 rounded-lg text-xs border ${c.bg} ${c.fg} ${c.br} ${className}`}>
      {children}
    </span>
  );
}
