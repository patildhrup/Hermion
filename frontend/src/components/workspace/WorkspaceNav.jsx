import React from 'react';

const items = [
  { id: 'overview', icon: '⌂', label: 'Overview' },
  { id: 'tasks', icon: '✓', label: 'Tasks' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'documents', icon: '📄', label: 'Documents' },
  { id: 'memory', icon: '🧠', label: 'Memory' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

export default function WorkspaceNav({ active, onChange }) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[10px] font-mono uppercase tracking-[0.35em] text-textMuted">Workspace</p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
            active === item.id
              ? 'border border-accent/20 bg-accent/10 text-accent'
              : 'border border-transparent text-textMuted hover:bg-white/5 hover:text-white'
          }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
