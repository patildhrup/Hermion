import React from 'react';
import MessageBubble from './MessageBubble';

export default function ConversationPanel({
  messages,
  voiceState,
  userInput,
  onInputChange,
  onSubmit,
  onVoiceAction,
}) {
  return (
    <section className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-glassBorder px-6 py-5">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">HERMION</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(106,227,1,0.5)]" />
          <span className="text-sm font-medium text-textMuted">
            {voiceState === 'listening'
              ? 'Listening...'
              : voiceState === 'thinking'
              ? 'Thinking...'
              : voiceState === 'speaking'
              ? 'Responding...'
              : voiceState === 'error'
              ? 'Error'
              : 'Ready'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {messages.map((message, index) => (
          <MessageBubble key={message.id || `${message.speaker}-${index}`} message={message} />
        ))}
      </div>

      <div className="border-t border-glassBorder px-6 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/6 bg-black/30 px-4 py-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-textMuted">Voice Control</p>
            <p className="mt-1 text-sm text-white">Keep talking while HERMION manages the session.</p>
          </div>
          <button
            onClick={onVoiceAction}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-black transition-all hover:bg-accentHover"
          >
            Start talking
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-3 rounded-2xl border border-glassBorder bg-surface/80 p-3">
          <div className="rounded-xl bg-black/30 px-3 py-2 text-accent">🎙</div>
          <input
            value={userInput}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type while voice is active..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-textMuted/40"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || voiceState === 'thinking'}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black transition-all disabled:opacity-30"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
