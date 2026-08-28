import React from 'react';

function formatDayLabel(dateValue) {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTimeLabel(dateValue) {
  if (!dateValue) return 'Just now';
  return new Date(dateValue).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
}) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[10px] font-mono uppercase tracking-[0.35em] text-textMuted">Recent Sessions</p>
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/8 px-3 py-4 text-center text-xs text-textMuted/60">
          No sessions yet. Start a new voice session.
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.session_id}
            className={`group rounded-2xl border px-3 py-3 transition-all ${
              activeSessionId === session.session_id
                ? 'border-accent/25 bg-white/7'
                : 'border-transparent bg-white/3 hover:border-white/10 hover:bg-white/5'
            }`}
          >
            <button className="w-full text-left" onClick={() => onSelect(session)}>
              <div className="flex items-start gap-3">
                <span className="mt-1 text-textMuted">◉</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-textMuted">
                    {formatDayLabel(session.updated_at || session.created_at)}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-white">{session.title || 'Voice Session'}</p>
                  <p className="mt-1 text-xs text-textMuted">{formatTimeLabel(session.updated_at || session.created_at)}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => onDelete(session.session_id)}
              className="mt-2 text-[11px] text-textMuted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}
