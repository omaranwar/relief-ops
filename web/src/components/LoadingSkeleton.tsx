export default function LoadingSkeleton({
  lines = 3,
}: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 ${i === 0 ? "w-2/3" : i === lines - 1 ? "w-1/2" : "w-full"} bg-slate-200/70 rounded mb-3 animate-pulse`} />
      ))}
    </div>
  );
}
