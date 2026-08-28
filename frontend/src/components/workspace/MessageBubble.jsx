import React from 'react';

export default function MessageBubble({ message }) {
  const isAssistant = message.speaker === 'hermion';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div className={`flex max-w-[85%] flex-col gap-2 ${isAssistant ? 'items-start' : 'items-end'}`}>
        <span className="px-2 text-[10px] font-mono uppercase tracking-[0.3em] text-textMuted/60">
          {isAssistant ? 'HERMION' : 'USER'}
        </span>
        <div
          className={`rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
            isAssistant
              ? 'rounded-tl-sm border border-white/8 bg-surface/90 text-white'
              : 'rounded-tr-sm border border-accent/30 bg-accent/90 font-semibold text-black'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
