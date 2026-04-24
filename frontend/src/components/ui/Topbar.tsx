'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  screening: 'New Screening',
  rankings: 'Rankings',
  candidates: 'Candidates',
  jobs: 'Jobs',
};

type TopbarProps = {
  onLogout: () => void;
  onMenuOpen: () => void;
};

export function Topbar({ onLogout, onMenuOpen }: TopbarProps) {
  const dispatch = useAppDispatch();
  const view = useAppSelector((s) => s.ui.activeView);
  const screening = useAppSelector((s) => s.screening.current);

  return (
    <header className="border-b border-white/[0.06] flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-7 sm:gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/80"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="font-serif text-lg font-normal tracking-tight">
          {VIEW_TITLES[view]}
        </h1>
      </div>

      <div className="w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        AI Powered
      </div>

      {screening.status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="truncate">AI is evaluating candidates...</span>
        </div>
      )}

      <div className="ml-0 sm:ml-auto flex flex-wrap gap-2">
        <button className="btn-ghost btn btn-sm" onClick={onLogout}>
          Logout
        </button>
        <button
          className="btn-ghost btn btn-sm"
          onClick={() => dispatch(setView('screening'))}
        >
          + New Job
        </button>
        <button
          className="btn-primary btn btn-sm"
          onClick={() => dispatch(setView('screening'))}
        >
          Run Screening
        </button>
      </div>
    </header>
  );
}
