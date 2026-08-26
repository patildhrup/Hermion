import React from 'react';

export default function LeadCard({ lead, onViewCalls, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'demo_booked':
        return 'bg-[#6AE301]/20 text-[#6AE301] border-[#6AE301]/40';
      case 'qualified':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'escalated':
        return 'bg-[#F2D42C]/20 text-[#F2D42C] border-[#F2D42C]/40';
      case 'lost':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-[#6AE301]/50 transition-all flex flex-col justify-between space-y-4 group">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-white group-hover:text-[#6AE301] transition-colors">
              {lead.name}
            </h3>
            <p className="text-xs font-mono text-[#888]">{lead.company}</p>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${getStatusColor(
              lead.status
            )}`}
          >
            {lead.status || 'new'}
          </span>
        </div>

        {lead.contact_info && (
          <p className="mt-3 text-xs text-[#AAA] font-mono">
            {lead.contact_info}
          </p>
        )}
      </div>

      <div>
        {/* Qualification Bar */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#888]">Qualification Score</span>
            <span className="text-[#6AE301] font-bold">{lead.qualification_score || 0}/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#222] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6AE301] to-[#95FF29] transition-all duration-500"
              style={{ width: `${Math.min(100, lead.qualification_score || 0)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#262626]">
          <button
            onClick={() => onViewCalls(lead)}
            className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#242424] text-white hover:bg-[#333] transition-colors border border-[#333]"
          >
            View Calls
          </button>
          {lead.status !== 'demo_booked' && (
            <button
              onClick={() => onUpdateStatus(lead.id, 'demo_booked', 90)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#6AE301]/20 text-[#6AE301] hover:bg-[#6AE301] hover:text-black transition-all border border-[#6AE301]/30"
            >
              Book Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
