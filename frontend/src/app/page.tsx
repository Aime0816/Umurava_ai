'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ScreeningView } from '@/components/screening/ScreeningView';
import { RankingsView } from '@/components/rankings/RankingsView';
import { CandidatesView } from '@/components/candidates/CandidatesView';
import { JobsView } from '@/components/jobs/JobsView';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';
import { fetchScreeningHistory } from '@/store/slices/screeningSlice';
import { fetchJobs } from '@/store/slices/jobsSlice';
import { fetchCandidates } from '@/store/slices/candidatesSlice';

export default function Home() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((s) => s.ui.activeView);
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) return;

    dispatch(setView('dashboard'));
    dispatch(fetchScreeningHistory());
    dispatch(fetchJobs());
    dispatch(fetchCandidates({}));
  }, [dispatch, signedIn]);

  if (!signedIn) {
    return (
      <LoginForm
        onSignIn={() => {
          setSignedIn(true);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#0f1117] md:flex-row md:overflow-hidden">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onLogout={() => {
            setMenuOpen(false);
            setSignedIn(false);
          }}
          onMenuOpen={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'screening' && <ScreeningView />}
          {activeView === 'rankings' && <RankingsView />}
          {activeView === 'candidates' && <CandidatesView />}
          {activeView === 'jobs' && <JobsView />}
        </main>
      </div>
    </div>
  );
}
