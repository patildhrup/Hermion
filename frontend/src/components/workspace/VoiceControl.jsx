import React from 'react';
import VoiceOrb from './VoiceOrb';

const stateText = {
  idle: { title: 'Tap to talk', subtitle: 'How can I help you today?' },
  listening: { title: 'Hermion is listening...', subtitle: 'How can I help you today?' },
  thinking: { title: 'Hermion is thinking...', subtitle: 'How can I help you today?' },
  speaking: { title: 'Hermion is responding...', subtitle: 'How can I help you today?' },
  error: { title: 'Something went wrong. Try again.', subtitle: 'How can I help you today?' },
};

export default function VoiceControl({
  voiceState,
  onPrimaryAction,
  onStop,
  isConnected,
}) {
  const { title, subtitle } = stateText[voiceState];

  return (
    <section className="glass-panel relative overflow-hidden p-8 md:p-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="flex flex-col items-center gap-7 text-center">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">HERMION</p>
          <h1 className="mt-3 font-heading text-4xl font-black text-white md:text-5xl">
            Your AI Work Operating System
          </h1>
          <p className="mt-3 text-base text-textMuted md:text-lg">Your work, one conversation away.</p>
        </div>

        <VoiceOrb state={voiceState} />

        <div className="space-y-2">
          <p className="font-heading text-2xl font-bold text-white">{subtitle}</p>
          <p
            className={`text-sm font-mono uppercase tracking-[0.25em] ${
              voiceState === 'thinking'
                ? 'text-highlight'
                : voiceState === 'error'
                ? 'text-red-400'
                : 'text-textMuted'
            }`}
          >
            {title}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={onPrimaryAction}
            className="rounded-2xl bg-accent px-8 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(106,227,1,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accentHover"
          >
            Start talking
          </button>
          {isConnected && (
            <button
              onClick={onStop}
              className="rounded-2xl border border-red-500/35 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 hover:text-white"
            >
              Stop voice session
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
