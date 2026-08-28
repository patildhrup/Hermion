import React from 'react';

const groups = [
  { key: 'today', label: 'Today' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

const priorityStyles = {
  low: 'text-textMuted',
  medium: 'text-highlight',
  high: 'text-accent',
};

export default function TaskPanel({ tasks }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">Tasks</p>
        <span className="rounded-full border border-white/8 bg-black/30 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-textMuted">
          Voice-ready
        </span>
      </div>
      <div className="space-y-5">
        {groups.map((group) => {
          const groupTasks = tasks.filter((task) => task.status === group.key);
          return (
            <div key={group.key}>
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.25em] text-textMuted">{group.label}</p>
              <div className="space-y-2.5">
                {groupTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/8 px-4 py-3 text-sm text-textMuted/60">
                    No tasks in this section.
                  </div>
                ) : (
                  groupTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-black/25 px-4 py-3">
                      <span className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${task.completed ? 'border-accent bg-accent text-black' : 'border-white/20'}`}>
                        {task.completed ? '✓' : ''}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${task.completed ? 'text-textMuted line-through' : 'text-white'}`}>{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
                          <span className={priorityStyles[task.priority]}>{task.priority} priority</span>
                          <span className="text-textMuted">{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
