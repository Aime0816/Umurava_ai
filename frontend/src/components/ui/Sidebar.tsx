'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';

const NAV_ITEMS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
      </svg>
    ),
  },
  {
    id: 'screening' as const,
    label: 'New Screening',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'rankings' as const,
    label: 'Rankings',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M2 12h3V8H2v4zM6 12h3V4H6v8zM11 12h3V6h-3v6z" fill="currentColor" opacity=".7" />
      </svg>
    ),
  },
  {
    id: 'jobs' as const,
    label: 'Jobs',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M1 8h14" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
      </svg>
    ),
  },
  {
    id: 'candidates' as const,
    label: 'Candidates',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11 7l1.5 1.5L15 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((s) => s.ui.activeView);

  const handleNavigate = (view: (typeof NAV_ITEMS)[number]['id']) => {
    dispatch(setView(view));
    onClose();
  };

  return (
    <>
      <aside className="hidden md:flex w-[220px] min-w-[220px] bg-[#0a0c13] border-r border-white/[0.06] flex-col py-5">
        <div className="px-5 pb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-mono text-sm font-medium text-white">
            U
          </div>
          <div className="font-serif text-[15px] font-medium tracking-tight">
            Umu<span className="text-brand-500">rava</span>
          </div>
        </div>

        <div className="px-3 pb-2 text-[10px] font-medium text-white/30 tracking-widest uppercase mt-1">
          Workspace
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch(setView(item.id))}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          >
            <span className={`opacity-70 ${activeView === item.id ? 'opacity-100' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}

        <div className="mt-auto px-5 pt-4 border-t border-white/[0.06] text-xs text-white/30">
          <strong className="block text-white/50 font-medium mb-0.5">Umurava Hackathon</strong>
          Talent Screening v1.0
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/55"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[82vw] bg-[#0a0c13] border-r border-white/[0.06] flex flex-col py-5 shadow-2xl shadow-black/40">
            <div className="px-5 pb-6 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-mono text-sm font-medium text-white">
                  U
                </div>
                <div className="font-serif text-[15px] font-medium tracking-tight">
                  Umu<span className="text-brand-500">rava</span>
                </div>
              </div>
              <button
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <div className="px-3 pb-2 text-[10px] font-medium text-white/30 tracking-widest uppercase mt-1">
              Workspace
            </div>

            <div className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                >
                  <span className={`opacity-70 ${activeView === item.id ? 'opacity-100' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto px-5 pt-4 border-t border-white/[0.06] text-xs text-white/30">
              <strong className="block text-white/50 font-medium mb-0.5">Umurava Hackathon</strong>
              Talent Screening v1.0
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
