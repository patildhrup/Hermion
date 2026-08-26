import React from 'react';

export default function LeadCard({ lead, onViewCalls, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'demo_booked':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'qualified':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'escalated':
        return 'bg-highlight/10 text-highlight border-highlight/30';
      case 'lost':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-white/5 text-textMuted border-white/10';
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col justify-between space-y-4 group relative overflow-hidden">
      {/* Subtle background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-white group-hover:text-accent transition-colors duration-300">
              {lead.name}
            </h3>
            <p className="text-xs font-mono text-textMuted">{lead.company}</p>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${getStatusColor(
              lead.status
            )} backdrop-blur-sm shadow-sm`}
          >
            {lead.status || 'new'}
          </span>
        </div>

        {lead.contact_info && (
          <p className="mt-3 text-xs text-textMuted font-mono bg-black/20 p-2 rounded-lg border border-white/5">
            {lead.contact_info}
          </p>
        )}
      </div>

      <div className="relative z-10">
        {/* Qualification Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-textMuted">Qualification Score</span>
            <span className="text-accent font-bold drop-shadow-[0_0_8px_rgba(106,227,1,0.5)]">{lead.qualification_score || 0}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden shadow-inner border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-accent to-[#95FF29] shadow-[0_0_10px_rgba(106,227,1,0.5)] transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, lead.qualification_score || 0)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-glassBorder">
          <button
            onClick={() => onViewCalls(lead)}
            className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 hover:shadow-lg"
          >
            View Calls
          </button>
          {lead.status !== 'demo_booked' && (
            <button
              onClick={() => onUpdateStatus(lead.id, 'demo_booked', 90)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-black transition-all border border-accent/30 hover:shadow-[0_0_15px_rgba(106,227,1,0.4)] hover:scale-105"
            >
              Book Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
