import React from 'react';

export default function StatCounter({ label, value, subtext, highlight }) {
  return (
    <div className={`p-5 rounded-xl border transition-colors ${
      highlight 
        ? 'bg-slate-900 border-blue-500/40 text-blue-400'
        : 'bg-slate-900/60 border-slate-800'
    }`}>
      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        {value}
      </div>
      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-1">
        {label}
      </div>
      {subtext && (
        <div className="text-xs text-slate-400 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
}
