import React from 'react';

export default function MemoryIndicator({ items }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Memory</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/6 bg-black/25 p-4">
            <p className="text-sm font-semibold text-white">
              🧠 {item.kind === 'stored' ? 'Memory updated' : 'Using previous context'}
            </p>
            <p className="mt-1 text-sm text-textMuted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
