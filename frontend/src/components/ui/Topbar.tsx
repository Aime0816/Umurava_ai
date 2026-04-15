'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';

const VIEW_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  screening:  'New Screening',
  rankings:   'Rankings',
  candidates: 'Candidates',
  jobs:       'Jobs',
};

export function Topbar() {
  const dispatch  = useAppDispatch();
  const view      = useAppSelector((s) => s.ui.activeView);
  const screening = useAppSelector((s) => s.screening.current);

  return (
    <header className="h-[60px] border-b border-white/[0.06] flex items-center px-7 gap-4 flex-shrink-0">
      <h1 className="font-serif text-lg font-normal tracking-tight">
        {VIEW_TITLES[view]}
      </h1>

      {/* AI-powered indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        AI Powered
      </div>

      {screening.status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          AI is evaluating candidates…
        </div>
      )}

      <div className="ml-auto flex gap-2">
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
