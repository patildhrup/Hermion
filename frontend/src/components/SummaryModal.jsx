import React from 'react';

export default function SummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-[#333] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#262626] text-[#AAA] hover:text-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6AE301]/20 border border-[#6AE301]/30 flex items-center justify-center text-[#6AE301]">
            📊
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-white">Call Intelligence Summary</h3>
            <p className="text-xs font-mono text-[#888]">Post-call AI auto-generation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#222]">
            <h4 className="text-xs font-mono text-[#888] uppercase mb-1">Executive Summary</h4>
            <p className="text-sm text-[#DDD] leading-relaxed">{summary.summary_text}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121212] border border-[#222]">
            <h4 className="text-xs font-mono text-[#888] uppercase mb-1">Recommended Next Steps</h4>
            <p className="text-sm text-[#6AE301] font-medium">{summary.next_steps || 'None recorded'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#121212] border border-[#222]">
              <h4 className="text-xs font-mono text-[#888] uppercase mb-1">Objections Handled</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.objections_raised && summary.objections_raised.length > 0 ? (
                  summary.objections_raised.map((obj, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    >
                      {obj}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#666]">None</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121212] border border-[#222]">
              <h4 className="text-xs font-mono text-[#888] uppercase mb-1">Call Sentiment</h4>
              <span className="inline-block mt-1 text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-[#6AE301]/20 text-[#6AE301] border border-[#6AE301]/30">
                {summary.sentiment || 'Positive'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#6AE301] text-black font-bold hover:bg-[#80F318] transition-all shadow-[0_0_20px_rgba(106,227,1,0.2)]"
        >
          Close Summary
        </button>
      </div>
    </div>
  );
}
