import React from 'react';
import HermionLogo from './HermionLogo';
import SessionList from './SessionList';
import UserProfile from './UserProfile';
import WorkspaceNav from './WorkspaceNav';

export default function Sidebar({
  open,
  sessions,
  activeSessionId,
  activeNav,
  user,
  onClose,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onChangeNav,
  onSignOut,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-glassBorder bg-surface/90 backdrop-blur-xl transition-transform duration-300 md:static md:z-auto md:w-72 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between">
            <HermionLogo />
            <button onClick={onClose} className="rounded-xl p-2 text-textMuted hover:bg-white/10 hover:text-white md:hidden">
              ✕
            </button>
          </div>

          <button
            onClick={onNewSession}
            className="mb-5 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-left text-sm font-bold text-accent transition-all hover:bg-accent hover:text-black"
          >
            New Voice Session
          </button>

          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
            <WorkspaceNav active={activeNav} onChange={onChangeNav} />
          </div>

          <UserProfile user={user} onSignOut={onSignOut} />
        </div>
      </aside>
    </>
  );
}
