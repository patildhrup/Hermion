import React from 'react';

const stateLabel = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  error: 'Error',
};

export default function TopBar({ title, voiceState, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between border-b border-glassBorder bg-background/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-textMuted transition-all hover:bg-white/10 hover:text-white md:hidden"
        >
          ☰
        </button>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.24em] text-textMuted">HERMION Voice Engine</p>
        </div>
      </div>
      <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-textMuted">
        {stateLabel[voiceState]}
      </div>
    </header>
  );
}
