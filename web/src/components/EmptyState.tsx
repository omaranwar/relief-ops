export default function EmptyState({
  title = "No data",
  subtitle = "Try adjusting filters or create a new incident.",
}: { title?: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
      <div className="text-lg font-semibold text-slate-700">{title}</div>
      <div className="text-sm mt-1">{subtitle}</div>
    </div>
  );
}
