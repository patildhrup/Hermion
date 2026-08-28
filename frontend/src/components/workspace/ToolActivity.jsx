import React from 'react';

const statusIcon = {
  pending: '•',
  running: '↻',
  success: '✓',
  failed: '!',
};

const statusTone = {
  pending: 'text-textMuted',
  running: 'text-highlight',
  success: 'text-accent',
  failed: 'text-red-400',
};

export default function ToolActivity({ items }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-5">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Tool Activity</p>
        <p className="mt-2 text-sm text-textMuted">HERMION is working...</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/6 bg-black/25 p-4">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 text-sm font-bold ${statusTone[item.status]}`}>{statusIcon[item.status]}</span>
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-sm text-textMuted">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
