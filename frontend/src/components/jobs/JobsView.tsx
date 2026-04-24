'use client';

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { fetchJobs, createJob } from '@/store/slices/jobsSlice';
import { setView } from '@/store/slices/uiSlice';
import { updateForm } from '@/store/slices/screeningSlice';
import { Job, Seniority } from '@/types';
import toast from 'react-hot-toast';

export function JobsView() {
  const dispatch = useAppDispatch();
  const jobs     = useAppSelector((s) => s.jobs.list);
  const loading  = useAppSelector((s) => s.jobs.loading);
  const [selected, setSelected] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  const handleScreenThisJob = (job: Job) => {
    // Pre-fill the screening form with this job's details
    dispatch(updateForm({
      jobTitle:       job.title,
      department:     job.department || '',
      description:    job.description,
      requiredSkills: job.requiredSkills,
      niceToHaveSkills: job.niceToHaveSkills || [],
      minExperience:  job.minExperience,
      seniority:      job.seniority,
      employmentType: job.employmentType,
      scoringWeights: job.scoringWeights,
    }));
    dispatch(setView('screening'));
    toast.success(`Job "${job.title}" loaded into screening form`);
  };

  const statusColors: Record<string, string> = {
    active: 'badge-success',
    draft:  'badge-warn',
    closed: 'badge-muted',
  };

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg font-normal tracking-tight">Job Listings</h2>
          <p className="text-xs text-white/40 mt-1">{jobs.length} jobs across your workspace</p>
        </div>
        <button className="btn-primary btn" onClick={() => setShowCreate(true)}>
          + New Job
        </button>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* Job list */}
        <div className="space-y-3">
          {loading && (
            <div className="flex justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!loading && jobs.length === 0 && (
            <div className="card">
              <div className="p-12 text-center text-white/30">
                <div className="text-4xl mb-3 opacity-40">Ž</div>
                <div className="text-sm">No jobs yet</div>
                <div className="text-xs mt-1">Create a job to start screening candidates</div>
                <button className="btn-primary btn mt-5" onClick={() => setShowCreate(true)}>
                  Create first job
                </button>
              </div>
            </div>
          )}
          {jobs.map((job) => (
            <div
              key={job._id}
              onClick={() => setSelected(job)}
              className={`card p-4 cursor-pointer transition-all hover:border-white/12 ${selected?._id === job._id ? 'border-brand-500/35 bg-brand-500/[0.04]' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium">{job.title}</div>
                    <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {job.department && <span>{job.department} · </span>}
                    {job.seniority} · {job.employmentType}
                    {job.remote && ' · Remote'}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.requiredSkills.slice(0, 5).map((s) => (
                      <span key={s} className="badge badge-info">{s}</span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="badge badge-muted">+{job.requiredSkills.length - 5} more</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/30 flex-shrink-0">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="card self-start sticky top-5">
          {!selected ? (
            <div className="p-10 text-center text-white/30">
              <div className="text-3xl mb-3 opacity-40">Ž</div>
              <div className="text-sm">Select a job</div>
              <div className="text-xs mt-1">to view details and screen candidates</div>
            </div>
          ) : (
            <JobDetail job={selected} onScreen={handleScreenThisJob} />
          )}
        </div>
      </div>

      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function JobDetail({ job, onScreen }: { job: Job; onScreen: (j: Job) => void }) {
  const niceToHaveSkills = job.niceToHaveSkills ?? [];

  return (
    <>
      <div className="p-5 border-b border-white/[0.06]">
        <div className="font-serif text-xl font-normal mb-1">{job.title}</div>
        <div className="text-xs text-white/45 mb-3">
          {[job.department, job.seniority, job.location, job.remote ? 'Remote' : ''].filter(Boolean).join(' · ')}
        </div>
        <button className="btn-primary btn w-full justify-center" onClick={() => onScreen(job)}>
          Screen Candidates for This Job →
        </button>
      </div>

      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-2">Required Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {job.requiredSkills.map((s) => <span key={s} className="badge badge-info">{s}</span>)}
        </div>
        {niceToHaveSkills.length > 0 && (
          <>
            <div className="text-[11px] text-white/35 uppercase tracking-wider mt-3 mb-2">Nice to Have</div>
            <div className="flex flex-wrap gap-1.5">
              {niceToHaveSkills.map((s) => <span key={s} className="badge badge-muted">{s}</span>)}
            </div>
          </>
        )}
      </div>

      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-3">AI Scoring Weights</div>
        {[
          { label: 'Skills Match',        val: job.scoringWeights.skills },
          { label: 'Experience Relevance', val: job.scoringWeights.experience },
          { label: 'Education Fit',        val: job.scoringWeights.education },
        ].map(({ label, val }) => (
          <div key={label} className="mb-2.5">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{label}</span><span>{val}%</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-brand-500/60 rounded-full" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-5">
        <div className="text-[11px] text-white/35 uppercase tracking-wider mb-2">Description</div>
        <p className="text-xs text-white/55 leading-relaxed">{job.description}</p>
      </div>
    </>
  );
}

function CreateJobModal({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    title: '', department: '', description: '',
    skills: '', minExperience: 0,
    seniority: 'Mid-level' as Seniority,
  });

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    const skillList = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (!skillList.length) { toast.error('Add at least one required skill'); return; }

    const action = await dispatch(createJob({
      title: form.title, department: form.department, description: form.description,
      requiredSkills: skillList, minExperience: form.minExperience,
      seniority: form.seniority, employmentType: 'Full-time',
      scoringWeights: { skills: 50, experience: 30, education: 20 },
      status: 'active', remote: false,
    }));

    if (createJob.fulfilled.match(action)) {
      toast.success(`Job "${form.title}" created`);
      onClose();
    } else {
      toast.error('Failed to create job');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-lg">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <span className="font-medium">Create New Job</span>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="form-label">Job Title *</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Backend Engineer" /></div>
          <div><label className="form-label">Department</label>
            <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" /></div>
          <div><label className="form-label">Required Skills (comma-separated) *</label>
            <input className="form-input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Node.js, React, TypeScript" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Min Experience (yrs)</label>
              <input className="form-input" type="number" min={0} value={form.minExperience} onChange={(e) => setForm({ ...form, minExperience: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="form-label">Seniority</label>
              <select className="form-select" value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value as Seniority })}>
                {(['Junior', 'Mid-level', 'Senior', 'Lead / Principal'] as Seniority[]).map((s) => <option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="form-label">Description *</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Role responsibilities and requirements…" /></div>
        </div>
        <div className="p-5 border-t border-white/[0.06] flex gap-2 justify-end">
          <button className="btn-ghost btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn" onClick={handleCreate}>Create Job</button>
        </div>
      </div>
    </div>
  );
}
