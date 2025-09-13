import { ReactNode } from "react";

export default function Modal({ open, title, onClose, children }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
