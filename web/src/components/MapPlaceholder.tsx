export default function MapPlaceholder() {
  return (
    <div className="relative w-full h-96 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-500 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm">Map view (hotspots • depots • routes)</div>
      </div>

      {/* Legend overlay (doesn't affect external height) */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">Hotspots</span>
        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Routes</span>
        <span className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">Water</span>
        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Medical</span>
        <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">Cold-chain</span>
      </div>
    </div>
  );
}
