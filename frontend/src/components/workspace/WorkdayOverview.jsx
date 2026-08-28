import React from 'react';

export default function WorkdayOverview({ stats }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-5">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Today&apos;s Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.id} className="rounded-2xl border border-white/6 bg-black/25 p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-2xl font-black text-white">{stat.value}</span>
            </div>
            <p className="mt-3 text-sm text-textMuted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
