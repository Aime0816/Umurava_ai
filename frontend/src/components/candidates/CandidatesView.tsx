'use client';

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { fetchCandidates } from '@/store/slices/candidatesSlice';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TierBadge } from '@/components/ui/TierBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Candidate, RankedCandidate } from '@/types';

export function CandidatesView() {
  const dispatch    = useAppDispatch();
  const candidates  = useAppSelector((s) => s.candidates.list);
  const loading     = useAppSelector((s) => s.candidates.loading);
  const results     = useAppSelector((s) => s.screening.current.results);
  const [selected, setSelected] = useState<{ candidate: Candidate; result?: RankedCandidate } | null>(null);

  useEffect(() => { dispatch(fetchCandidates()); }, [dispatch]);

  // Merge candidates with AI results if available
  const resultMap = new Map(results.map((r) => [r.candidate._id, r]));

  const items: Array<{ candidate: Candidate; result?: RankedCandidate }> = candidates.length
    ? candidates.map((c) => ({ candidate: c, result: resultMap.get(c._id) }))
    : results.map((r) => ({ candidate: r.candidate, result: r }));

  return (
    <div className="p-7">
      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* List */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Candidate Pool ({items.length})</span>
          </div>
          <div className="card-body">
            {loading && <LoadingSpinner />}
            {!loading && items.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <div className="text-3xl mb-3 opacity-40">◎</div>
                <div className="text-sm">No candidates yet</div>
                <div className="text-xs mt-1">Add via JSON, CSV/PDF, or manually during screening</div>
              </div>
            )}
            <div className="space-y-2">
              {items.map(({ candidate: c, result: r }, i) => (
                <div
                  key={c._id || i}
                  onClick={() => setSelected({ candidate: c, result: r })}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected?.candidate._id === c._id
                      ? 'border-brand-500/35 bg-brand-500/[0.06]'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]'
                  }`}
                >
                  <Avatar firstName={c.firstName} lastName={c.lastName} index={i} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-white/40 truncate">{c.headline}</div>
                    <div className="text-[11px] text-white/30 mt-0.5">{c.location}</div>
                  </div>
                  {r ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <TierBadge tier={r.evaluation.tier} />
                      <ScoreRing score={r.evaluation.score} size={36} />
                    </div>
                  ) : (
                    <span className="text-xs text-white/25 flex-shrink-0">Not scored</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="card self-start sticky top-5">
          {!selected ? (
            <div className="p-10 text-center text-white/30">
              <div className="text-3xl mb-3 opacity-40">◎</div>
              <div className="text-sm">Select a candidate</div>
              <div className="text-xs mt-1">to view their full profile</div>
            </div>
          ) : (
            <ProfileDetail candidate={selected.candidate} result={selected.result} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ candidate: c, result: r }: { candidate: Candidate; result?: RankedCandidate }) {
  return (
    <div className="overflow-y-auto max-h-[80vh]">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Avatar firstName={c.firstName} lastName={c.lastName} size={44} />
          <div>
            <div className="font-serif text-xl font-normal">{c.firstName} {c.lastName}</div>
            <div className="text-xs text-white/45">{c.headline}</div>
            <div className="text-[11px] text-white/30 mt-0.5">{c.location}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="badge-muted badge">{c.availability.status}</span>
          <span className="badge-muted badge">{c.availability.type}</span>
          <span className="badge-muted badge">{c.source?.toUpperCase()}</span>
        </div>
      </div>

      {/* AI Scores if available */}
      {r && (
        <div className="p-5 border-b border-white/[0.06]">
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">AI Evaluation</div>
          <TierBadge tier={r.evaluation.tier} />
          <div className="mt-3 space-y-0">
            <ProgressBar label="Skills" value={r.evaluation.skillsScore} />
            <ProgressBar label="Experience" value={r.evaluation.experienceScore} />
            <ProgressBar label="Education" value={r.evaluation.educationScore} />
          </div>
          <div className="bg-brand-500/[0.06] border border-brand-500/15 rounded-lg p-3 mt-3 text-xs text-white/60 italic leading-relaxed">
            {r.evaluation.recommendation}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {c.skills.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border"
              style={{
                background: s.level === 'Expert' ? 'rgba(52,211,153,0.1)' : s.level === 'Advanced' ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.04)',
                borderColor: s.level === 'Expert' ? 'rgba(52,211,153,0.2)' : s.level === 'Advanced' ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.08)',
                color: s.level === 'Expert' ? '#6ee7b7' : s.level === 'Advanced' ? '#7cb9ff' : 'rgba(255,255,255,0.5)',
              }}
            >
              {s.name}
              <span className="opacity-60">{s.yearsOfExperience}yr</span>
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      {c.experience?.length > 0 && (
        <div className="p-5 border-b border-white/[0.06]">
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">Experience</div>
          <div className="space-y-3">
            {c.experience.map((e, i) => (
              <div key={i} className="pl-3 border-l border-white/[0.08]">
                <div className="text-sm font-medium">{e.role}</div>
                <div className="text-xs text-brand-400">{e.company}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{e.startDate} – {e.endDate}</div>
                {e.description && <div className="text-xs text-white/50 mt-1 leading-relaxed">{e.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {c.education?.length > 0 && (
        <div className="p-5">
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">Education</div>
          {c.education.map((e, i) => (
            <div key={i}>
              <div className="text-sm font-medium">{e.degree} in {e.fieldOfStudy}</div>
              <div className="text-xs text-white/45">{e.institution}</div>
              <div className="text-[11px] text-white/30">{e.startYear} – {e.endYear || 'present'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
