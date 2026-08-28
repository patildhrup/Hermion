import React from 'react';

export default function UserProfile({ user, onSignOut }) {
  const initial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-2 border-t border-glassBorder pt-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/5 px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-gradient-to-tr from-accent/40 to-accent/10 text-sm font-bold text-accent">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user?.username || 'Workspace User'}</p>
          <p className="truncate text-xs text-textMuted">{user?.email || 'user@company.com'}</p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="w-full rounded-2xl px-3 py-2.5 text-left text-sm text-textMuted transition-all hover:bg-red-500/10 hover:text-red-400"
      >
        Sign Out
      </button>
    </div>
  );
}
