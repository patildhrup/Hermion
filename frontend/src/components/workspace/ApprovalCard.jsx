import React from 'react';

export default function ApprovalCard({ approval }) {
  if (!approval) return null;

  return (
    <section className="rounded-3xl border border-accent/25 bg-accent/6 p-5 shadow-[0_0_30px_rgba(106,227,1,0.08)]">
      <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Approval Required</p>
      <h3 className="mt-3 font-heading text-xl font-bold text-white">{approval.title}</h3>
      <div className="mt-5 space-y-4 rounded-2xl border border-white/6 bg-black/30 p-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-textMuted">To</p>
          <p className="mt-1 text-sm text-white">{approval.recipient}</p>
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-textMuted">Subject</p>
          <p className="mt-1 text-sm text-white">{approval.subject}</p>
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-textMuted">Message</p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">{approval.message}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10">
          Cancel
        </button>
        <button className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-black transition-all hover:bg-accentHover">
          {approval.actionLabel}
        </button>
      </div>
    </section>
  );
}
