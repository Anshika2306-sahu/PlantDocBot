import React from "react";

export default function StatBar({ label, value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white">
          {value}
          {max !== 100 ? ` / ${max}` : "%"}
        </span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-green-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
