import React from 'react';

export default function UpcomingEvents({ meetings }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-5">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Upcoming</p>
      </div>
      <div className="space-y-3">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="rounded-2xl border border-white/6 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">{meeting.startTime}</p>
                <p className="mt-1 font-heading text-lg font-bold text-white">{meeting.title}</p>
                <p className="text-sm text-textMuted">{meeting.team}</p>
              </div>
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
                {meeting.dateLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
