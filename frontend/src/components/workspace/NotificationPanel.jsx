import React from 'react';

export default function NotificationPanel({ emails }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-5">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Important Emails</p>
      </div>
      <div className="space-y-3">
        {emails.map((email) => (
          <div key={email.id} className="rounded-2xl border border-white/6 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{email.subject}</p>
                <p className="mt-1 text-sm text-textMuted">{email.sender}</p>
              </div>
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
                {email.importance}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
