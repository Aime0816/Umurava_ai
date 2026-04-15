'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ScreeningView } from '@/components/screening/ScreeningView';
import { RankingsView } from '@/components/rankings/RankingsView';
import { CandidatesView } from '@/components/candidates/CandidatesView';
import { JobsView } from '@/components/jobs/JobsView';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { fetchScreeningHistory } from '@/store/slices/screeningSlice';
import { fetchJobs } from '@/store/slices/jobsSlice';
import { fetchCandidates } from '@/store/slices/candidatesSlice';

export default function Home() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((s) => s.ui.activeView);

  useEffect(() => {
    // Hydrate store on mount
    dispatch(fetchScreeningHistory());
    dispatch(fetchJobs());
    dispatch(fetchCandidates());
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard'  && <DashboardView />}
          {activeView === 'screening'  && <ScreeningView />}
          {activeView === 'rankings'   && <RankingsView />}
          {activeView === 'candidates' && <CandidatesView />}
          {activeView === 'jobs'       && <JobsView />}
        </main>
      </div>
    </div>
  );
}
