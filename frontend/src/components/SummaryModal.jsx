import React from 'react';

export default function SummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-lg w-full p-8 space-y-6 relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 text-textMuted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xl shadow-[0_0_15px_rgba(106,227,1,0.3)]">
            📊
          </div>
          <div>
            <h3 className="font-heading font-bold text-2xl text-white">Call Intelligence</h3>
            <p className="text-xs font-mono text-textMuted">Post-call AI auto-generation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
            <h4 className="text-xs font-mono text-accent uppercase mb-2 font-bold tracking-wider">Executive Summary</h4>
            <p className="text-sm text-white/90 leading-relaxed font-body">{summary.summary_text}</p>
          </div>

          <div className="p-5 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
            <h4 className="text-xs font-mono text-highlight uppercase mb-2 font-bold tracking-wider">Recommended Next Steps</h4>
            <p className="text-sm text-white font-medium">{summary.next_steps || 'None recorded'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <h4 className="text-xs font-mono text-textMuted uppercase mb-2">Objections Handled</h4>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {summary.objections_raised && summary.objections_raised.length > 0 ? (
                  summary.objections_raised.map((obj, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    >
                      {obj}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/40">None</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <h4 className="text-xs font-mono text-textMuted uppercase mb-2">Call Sentiment</h4>
              <span className="inline-block mt-1 text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 shadow-[0_0_10px_rgba(106,227,1,0.2)]">
                {summary.sentiment || 'Positive'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3.5 rounded-xl bg-accent text-black font-bold text-lg hover:bg-accentHover transition-all shadow-[0_0_20px_rgba(106,227,1,0.3)] hover:shadow-[0_0_30px_rgba(106,227,1,0.5)]"
        >
          Close Summary
        </button>
      </div>
    </div>
  );
}
