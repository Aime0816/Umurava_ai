'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setView } from '@/store/slices/uiSlice';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TierBadge } from '@/components/ui/TierBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RankedCandidate, SCORE_COLOR } from '@/types';

export function RankingsView() {
  const dispatch = useAppDispatch();
  const results  = useAppSelector((s) => s.screening.current.results);
  const status   = useAppSelector((s) => s.screening.current.status);
  const procTime = useAppSelector((s) => s.screening.current.processingTimeMs);
  const form     = useAppSelector((s) => s.screening.current.form);

  const [selected, setSelected] = useState<RankedCandidate | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-white/40">
        <svg className="w-8 h-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div>
          <p className="text-sm text-white/50">AI is evaluating candidates…</p>
          <p className="text-xs text-white/30 text-center mt-1">This may take 15–30 seconds</p>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-white/30 p-7">
        <div className="text-4xl opacity-40">◎</div>
        <p className="text-sm">No rankings yet</p>
        <p className="text-xs">Complete a screening to see ranked candidates</p>
        <button className="btn-primary btn mt-3" onClick={() => dispatch(setView('screening'))}>
          Start Screening
        </button>
      </div>
    );
  }

  const recommended = results.filter((r) => r.evaluation.score >= 65).length;

  return (
    <div className="p-7">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg font-normal tracking-tight">
            Results: {form.jobTitle || 'Screening'}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {results.length} candidates ranked · {recommended} recommended
            {procTime && ` · ${(procTime / 1000).toFixed(1)}s`}
          </p>
        </div>
        <button className="btn-ghost btn btn-sm" onClick={() => dispatch(setView('candidates'))}>
          View profiles →
        </button>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Ranking table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3 pl-4 w-10">#</th>
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3 pl-2">Candidate</th>
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3">Score</th>
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3">Skills</th>
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3">Tier</th>
                <th className="text-left text-[11px] text-white/35 font-normal tracking-wider py-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const rankColor =
                  i === 0 ? '#fbbf24' :
                  i === 1 ? 'rgba(255,255,255,0.45)' :
                  i === 2 ? '#fb923c' :
                  'rgba(255,255,255,0.2)';
                return (
                  <tr
                    key={i}
                    onClick={() => setSelected(r)}
                    className={`border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors ${selected === r ? 'bg-brand-500/[0.07]' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="py-3 pl-4">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-medium"
                        style={{ background: `${rankColor}18`, color: rankColor }}
                      >
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar firstName={r.candidate.firstName} lastName={r.candidate.lastName} index={i} size={32} />
                        <div>
                          <div className="text-sm font-medium">{r.candidate.firstName} {r.candidate.lastName}</div>
                          <div className="text-[11px] text-white/40 truncate max-w-[180px]">{r.candidate.headline}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><ScoreRing score={r.evaluation.score} size={36} /></td>
                    <td className="py-3">
                      <span className="text-sm font-mono" style={{ color: SCORE_COLOR(r.evaluation.skillsScore) }}>
                        {r.evaluation.skillsScore}%
                      </span>
                    </td>
                    <td className="py-3"><TierBadge tier={r.evaluation.tier} /></td>
                    <td className="py-3 text-xs text-white/40">{r.candidate.location || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <div className="card self-start sticky top-5">
          {!selected ? (
            <div className="p-8 text-center text-white/30">
              <div className="text-3xl mb-3 opacity-40">◎</div>
              <div className="text-sm">Click a candidate</div>
              <div className="text-xs mt-1">to view their AI evaluation</div>
            </div>
          ) : (
            <CandidateDetail result={selected} />
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateDetail({ result }: { result: RankedCandidate }) {
  const { candidate: c, evaluation: e } = result;
  const scoreColor = SCORE_COLOR(e.score);

  return (
    <>
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Avatar firstName={c.firstName} lastName={c.lastName} size={44} />
          <div>
            <div className="font-serif text-xl font-normal tracking-tight">{c.firstName} {c.lastName}</div>
            <div className="text-xs text-white/45 mt-0.5">{c.headline}</div>
          </div>
        </div>

        <div className="font-serif text-5xl font-light tracking-tight" style={{ color: scoreColor }}>
          {e.score}
          <span className="text-lg text-white/30">/100</span>
        </div>
        <div className="text-[11px] text-white/35 tracking-wider uppercase mt-1 mb-3">Overall Match Score</div>
        <TierBadge tier={e.tier} />

        <div className="mt-4 space-y-0">
          <ProgressBar label="Skills Match"   value={e.skillsScore} />
          <ProgressBar label="Experience"     value={e.experienceScore} />
          <ProgressBar label="Education Fit"  value={e.educationScore} />
        </div>
      </div>

      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">Strengths</div>
        <div className="space-y-2">
          {e.strengths.map((s, i) => (
            <div key={i} className="flex gap-2 text-xs text-white/65 leading-relaxed">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">Gaps</div>
        <div className="space-y-2">
          {e.gaps.length === 0 ? (
            <p className="text-xs text-white/35">No major gaps identified</p>
          ) : (
            e.gaps.map((g, i) => (
              <div key={i} className="flex gap-2 text-xs text-white/65 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                {g}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">AI Recommendation</div>
        <div className="bg-brand-500/[0.08] border border-brand-500/20 rounded-lg p-3 text-xs text-white/65 leading-relaxed italic">
          {e.recommendation}
        </div>
        {e.reasoning && (
          <p className="text-[11px] text-white/30 mt-3 leading-relaxed">{e.reasoning}</p>
        )}
      </div>
    </>
  );
}
