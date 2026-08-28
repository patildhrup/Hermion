import React from 'react';

const stateStyles = {
  idle: 'shadow-[0_0_40px_rgba(106,227,1,0.18)]',
  listening: 'animate-pulse shadow-[0_0_65px_rgba(106,227,1,0.35)]',
  thinking: 'shadow-[0_0_50px_rgba(242,212,44,0.22)]',
  speaking: 'shadow-[0_0_75px_rgba(106,227,1,0.4)]',
  error: 'shadow-[0_0_45px_rgba(239,68,68,0.25)]',
};

const barStyles = {
  idle: ['h-6', 'h-10', 'h-7', 'h-9', 'h-6'],
  listening: ['h-9 animate-pulse', 'h-14 animate-pulse', 'h-8 animate-pulse', 'h-12 animate-pulse', 'h-9 animate-pulse'],
  thinking: ['h-7', 'h-9', 'h-12', 'h-9', 'h-7'],
  speaking: ['h-12 animate-bounce', 'h-16 animate-bounce', 'h-10 animate-bounce', 'h-14 animate-bounce', 'h-12 animate-bounce'],
  error: ['h-5', 'h-5', 'h-5', 'h-5', 'h-5'],
};

export default function VoiceOrb({ state }) {
  const accentClass =
    state === 'thinking'
      ? 'from-highlight/20 via-highlight/10 to-transparent border-highlight/30'
      : state === 'error'
      ? 'from-red-500/20 via-red-500/10 to-transparent border-red-500/30'
      : 'from-accent/25 via-accent/10 to-transparent border-accent/25';

  return (
    <div className="relative flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full blur-2xl ${stateStyles[state]}`} />
      <div
        className={`relative flex h-56 w-56 items-center justify-center rounded-full border bg-gradient-to-br ${accentClass} bg-surface/90 backdrop-blur-xl`}
      >
        <div className="absolute inset-5 rounded-full border border-white/8 bg-black/50" />
        <div className="relative flex items-end gap-2">
          {barStyles[state].map((bar, index) => (
            <span
              key={`${state}-${index}`}
              className={`w-2 rounded-full bg-gradient-to-b from-white via-accent to-accent ${bar}`}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
        <div className="absolute bottom-8 text-[10px] font-mono uppercase tracking-[0.35em] text-textMuted">
          HERMION
        </div>
      </div>
    </div>
  );
}
