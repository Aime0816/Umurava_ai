'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TierBadge } from '@/components/ui/TierBadge';
import { RankedCandidate, Screening } from '@/types';

export function DashboardView() {
  const dispatch = useAppDispatch();
  const history  = useAppSelector((s) => s.screening.history);
  const results  = useAppSelector((s) => s.screening.current.results);
  const candidates = useAppSelector((s) => s.candidates.list);

  // Aggregate stats across all screenings in Redux history
  const allResults = results;
  const totalScreenings = history.length + (results.length > 0 ? 1 : 0);
  const avgScore   = allResults.length
    ? Math.round(allResults.reduce((a, r) => a + r.evaluation.score, 0) / allResults.length)
    : null;
  const topCount   = allResults.filter((r) => r.evaluation.score >= 80).length;

  const topFive   = [...allResults].sort((a, b) => b.evaluation.score - a.evaluation.score).slice(0, 5);

  // Score distribution buckets
  const buckets = [
    { label: '90–100', min: 90, max: 100, color: '#34d399' },
    { label: '75–89',  min: 75, max: 89,  color: '#4f8ef7' },
    { label: '60–74',  min: 60, max: 74,  color: '#fbbf24' },
    { label: '< 60',   min: 0,  max: 59,  color: '#f87171' },
  ];
  const maxBucket = Math.max(
    ...buckets.map((b) => allResults.filter((r) => r.evaluation.score >= b.min && r.evaluation.score <= b.max).length),
    1
  );

  return (
    <div className="p-7">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {[
          { label: 'Total Screenings',  value: totalScreenings,                badge: 'Active jobs',   badgeClass: 'badge-info' },
          { label: 'Candidates Reviewed', value: candidates.length || allResults.length, badge: 'In pool',    badgeClass: 'badge-muted' },
          { label: 'Avg Match Score',   value: avgScore ? `${avgScore}%` : '—', badge: 'All roles',     badgeClass: 'badge-warn' },
          { label: 'Top Tier (≥80)',    value: topCount,                        badge: 'Strong matches', badgeClass: 'badge-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <div className="text-[11px] text-white/40 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="font-serif text-[26px] font-light tracking-tight leading-none">{stat.value}</div>
            <div className="mt-2">
              <span className={`badge ${stat.badgeClass}`}>{stat.badge}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Recent screenings */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Screenings</span>
          </div>
          <div className="card-body">
            {history.length === 0 && results.length === 0 ? (
              <EmptyState message="No screenings yet" sub="Run a screening to see history" />
            ) : (
              <div className="space-y-0">
                {history.slice(-4).reverse().map((s: Screening, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {typeof s.jobId === 'object' ? (s.jobId as { title?: string }).title : 'Screening'}
                      </div>
                      <div className="text-xs text-white/35 mt-0.5">
                        {s.results?.length || 0} candidates · {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge-info badge">
                      {s.results?.filter((r) => r.score >= 65).length || 0} recommended
                    </span>
                  </div>
                ))}
                {results.length > 0 && history.length === 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Latest Screening</div>
                      <div className="text-xs text-white/35 mt-0.5">{results.length} candidates evaluated</div>
                    </div>
                    <span className="badge-info badge">
                      {results.filter((r) => r.evaluation.score >= 65).length} recommended
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Score distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Score Distribution</span>
          </div>
          <div className="card-body">
            {allResults.length === 0 ? (
              <EmptyState message="No data yet" sub="Scores appear after screening" />
            ) : (
              <div className="space-y-3 pt-1">
                {buckets.map((b) => {
                  const count = allResults.filter((r) => r.evaluation.score >= b.min && r.evaluation.score <= b.max).length;
                  const pct   = Math.round((count / maxBucket) * 100);
                  return (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs text-white/40 mb-1.5">
                        <span>{b.label}</span>
                        <span style={{ color: b.color }}>{count}</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top candidates */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Top Candidates — Latest Screening</span>
          {topFive.length > 0 && (
            <button className="btn-ghost btn btn-sm" onClick={() => dispatch(setView('rankings'))}>
              View all →
            </button>
          )}
        </div>
        <div className="card-body">
          {topFive.length === 0 ? (
            <EmptyState message="No results yet" sub="Complete a screening to see top candidates here">
              <button
                className="btn-primary btn mt-5"
                onClick={() => dispatch(setView('screening'))}
              >
                Start Screening
              </button>
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {topFive.map((r: RankedCandidate, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-medium flex-shrink-0"
                    style={{
                      background: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                      color:      i === 0 ? '#fbbf24' : i === 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <Avatar firstName={r.candidate.firstName} lastName={r.candidate.lastName} index={i} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{r.candidate.firstName} {r.candidate.lastName}</div>
                    <div className="text-xs text-white/40 truncate">{r.candidate.headline}</div>
                  </div>
                  <TierBadge tier={r.evaluation.tier} />
                  <ScoreRing score={r.evaluation.score} size={36} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, sub, children }: { message: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-10 text-white/30">
      <div className="text-3xl mb-3 opacity-40">◎</div>
      <div className="text-sm mb-1">{message}</div>
      <div className="text-xs">{sub}</div>
      {children}
    </div>
  );
}
