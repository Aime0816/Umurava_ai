'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  updateForm, addRequiredSkill, removeRequiredSkill,
  appendStagedCandidates, removeStagedCandidate, updateWeights, runScreening,
} from '@/store/slices/screeningSlice';
import { createCandidates } from '@/store/slices/candidatesSlice';
import { createJob } from '@/store/slices/jobsSlice';
import { setView } from '@/store/slices/uiSlice';
import { Avatar } from '@/components/ui/Avatar';
import { uploadApi } from '@/lib/api';
import { Seniority, EmploymentType } from '@/types';

const SENIORITY_OPTIONS: Seniority[]     = ['Junior', 'Mid-level', 'Senior', 'Lead / Principal'];
const EMPLOYMENT_OPTIONS: EmploymentType[] = ['Full-time', 'Part-time', 'Contract'];

export function ScreeningView() {
  const dispatch   = useAppDispatch();
  const form       = useAppSelector((s) => s.screening.current.form);
  const staged     = useAppSelector((s) => s.screening.current.stagedCandidates);
  const status     = useAppSelector((s) => s.screening.current.status);

  const [skillInput, setSkillInput]   = useState('');
  const [jsonInput,  setJsonInput]    = useState('');
  const [activeTab,  setActiveTab]    = useState<'json' | 'pdf' | 'manual'>('json');
  const [manual, setManual] = useState({ firstName: '', lastName: '', headline: '', skills: '', location: '', yoe: '3' });

  // ── Skill tag input ───────────────────────────────────────
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim().replace(',', '');
      if (val) { dispatch(addRequiredSkill(val)); setSkillInput(''); }
    }
  };

  // ── File upload (PDF / CSV / Excel) ───────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const formData = new FormData();
    acceptedFiles.forEach((f) => formData.append('files', f));
    try {
      toast.loading('Parsing files…', { id: 'upload' });
      const res = await uploadApi.files(formData);
      const parsed = res.data?.data?.candidates || [];
      dispatch(appendStagedCandidates(parsed));
      toast.success(`${parsed.length} candidate(s) parsed from files`, { id: 'upload' });
    } catch {
      toast.error('File parsing failed', { id: 'upload' });
    }
  }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: true,
  });

  // ── JSON input parse ──────────────────────────────────────
  const parseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const list   = Array.isArray(parsed) ? parsed : [parsed];
      dispatch(appendStagedCandidates(list));
      setJsonInput('');
      toast.success(`${list.length} profile(s) loaded from JSON`);
    } catch {
      toast.error('Invalid JSON — check your format');
    }
  };

  // ── Manual candidate ──────────────────────────────────────
  const addManual = () => {
    if (!manual.firstName || !manual.lastName) { toast.error('Name is required'); return; }
    const skills = manual.skills.split(',').map((s) => ({
      name: s.trim(), level: 'Intermediate' as const, yearsOfExperience: parseInt(manual.yoe) || 2,
    })).filter((s) => s.name);
    const candidate = {
      firstName: manual.firstName, lastName: manual.lastName,
      email: `${manual.firstName.toLowerCase()}.${manual.lastName.toLowerCase()}.${Date.now()}@manual.entry`,
      headline: manual.headline || 'Professional',
      location: manual.location || 'Remote',
      skills: skills.length ? skills : [{ name: 'General', level: 'Intermediate' as const, yearsOfExperience: 2 }],
      experience: [], education: [{ institution: 'N/A', degree: "Bachelor's", fieldOfStudy: 'N/A', startYear: 2016, endYear: 2020 }],
      projects: [], availability: { status: 'Available' as const, type: 'Full-time' as const },
      source: 'manual' as const,
    };
    dispatch(appendStagedCandidates([candidate]));
    setManual({ firstName: '', lastName: '', headline: '', skills: '', location: '', yoe: '3' });
    toast.success('Candidate added to queue');
  };

  // ── Load sample profiles ───────────────────────────────────
  const loadSamples = () => {
    const samples = [
      { firstName: 'Alice', lastName: 'Kamau', email: 'alice.kamau@example.com', headline: 'Senior Backend Engineer – Node.js & AI', location: 'Kigali, Rwanda', skills: [{ name: 'Node.js', level: 'Expert', yearsOfExperience: 6 }, { name: 'TypeScript', level: 'Advanced', yearsOfExperience: 4 }, { name: 'MongoDB', level: 'Advanced', yearsOfExperience: 5 }], experience: [{ company: 'TechCorp', role: 'Senior Backend Engineer', startDate: '2019-03', endDate: 'Present', description: 'Led microservices migration', technologies: ['Node.js', 'MongoDB'], isCurrent: true }], education: [{ institution: 'University of Rwanda', degree: "Bachelor's", fieldOfStudy: 'Computer Science', startYear: 2014, endYear: 2018 }], projects: [{ name: 'AI Chat System', description: 'LLM-powered assistant', technologies: ['Node.js', 'Gemini API'], role: 'Lead' }], availability: { status: 'Available', type: 'Full-time' }, certifications: [{ name: 'AWS Certified Developer', issuer: 'Amazon', issueDate: '2022-06' }], source: 'json' },
      { firstName: 'Brian', lastName: 'Nziza', email: 'brian.nziza@example.com', headline: 'Full-Stack Developer – React & Node', location: 'Nairobi, Kenya', skills: [{ name: 'React', level: 'Advanced', yearsOfExperience: 3 }, { name: 'Node.js', level: 'Intermediate', yearsOfExperience: 2 }], experience: [{ company: 'StartupX', role: 'Junior Developer', startDate: '2022-01', endDate: 'Present', description: 'Built React dashboards', technologies: ['React', 'Node.js'], isCurrent: true }], education: [{ institution: 'Strathmore University', degree: "Bachelor's", fieldOfStudy: 'Software Engineering', startYear: 2018, endYear: 2022 }], projects: [], availability: { status: 'Open to Opportunities', type: 'Full-time' }, source: 'json' },
      { firstName: 'Chloe', lastName: 'Uwera', email: 'chloe.uwera@example.com', headline: 'Lead Engineer – Cloud & Distributed Systems', location: 'London, UK', skills: [{ name: 'Node.js', level: 'Expert', yearsOfExperience: 8 }, { name: 'TypeScript', level: 'Expert', yearsOfExperience: 6 }, { name: 'Kubernetes', level: 'Advanced', yearsOfExperience: 4 }], experience: [{ company: 'BigTech Ltd', role: 'Principal Engineer', startDate: '2018-06', endDate: 'Present', description: 'Platform serving 2M users', technologies: ['Node.js', 'K8s'], isCurrent: true }], education: [{ institution: 'UCL', degree: "Master's", fieldOfStudy: 'Computer Science', startYear: 2014, endYear: 2016 }], projects: [{ name: 'Distributed Messaging', description: 'Kafka-based event system', technologies: ['Node.js', 'Kafka'], role: 'Architect' }], availability: { status: 'Open to Opportunities', type: 'Full-time' }, certifications: [{ name: 'CKA', issuer: 'CNCF', issueDate: '2021-03' }], source: 'json' },
    ];
    dispatch(appendStagedCandidates(samples));
    toast.success('3 sample profiles loaded');
  };

  // ── Run the screening ─────────────────────────────────────
  const handleRunScreening = async () => {
    if (!form.requiredSkills.length) { toast.error('Add at least one required skill'); return; }
    if (!staged.length) { toast.error('Add candidates before screening'); return; }

    try {
      // 1. Create job
      const jobData = {
        title: form.jobTitle || 'Software Engineer',
        department: form.department,
        description: form.description,
        requiredSkills: form.requiredSkills,
        niceToHaveSkills: form.niceToHaveSkills,
        minExperience: form.minExperience,
        seniority: form.seniority,
        employmentType: form.employmentType,
        scoringWeights: form.scoringWeights,
        status: 'active',
      };
      const jobAction = await dispatch(createJob(jobData));
      if (createJob.rejected.match(jobAction)) throw new Error(String(jobAction.payload));
      const job = jobAction.payload as { _id: string };

      // 2. Save candidates
      const candidatesAction = await dispatch(createCandidates(staged));
      if (createCandidates.rejected.match(candidatesAction)) throw new Error(String(candidatesAction.payload));
      const savedCandidates = (candidatesAction.payload as { _id: string }[]);

      // 3. Run screening
      const screeningAction = await dispatch(runScreening({
        jobId: job._id,
        candidateIds: savedCandidates.map((c) => c._id),
        topCount: 20,
      }));
      if (runScreening.rejected.match(screeningAction)) throw new Error(String(screeningAction.payload));

      toast.success('Screening complete!');
      dispatch(setView('rankings'));
    } catch (err) {
      toast.error(`Screening failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="p-7">
      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* Left: Job config */}
        <div className="space-y-4">
          {/* Job Description */}
          <div className="card">
            <div className="card-header"><span className="card-title">Job Description</span></div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" value={form.jobTitle} onChange={(e) => dispatch(updateForm({ jobTitle: e.target.value }))} placeholder="e.g. Senior Backend Engineer" />
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={(e) => dispatch(updateForm({ department: e.target.value }))} placeholder="e.g. Engineering" />
                </div>
              </div>

              <div>
                <label className="form-label">Required Skills *</label>
                <div
                  className="flex flex-wrap gap-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 min-h-[42px] cursor-text"
                  onClick={() => document.getElementById('skillInput')?.focus()}
                >
                  {form.requiredSkills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full text-xs">
                      {s}
                      <button onClick={() => dispatch(removeRequiredSkill(s))} className="opacity-60 hover:opacity-100 text-sm leading-none">×</button>
                    </span>
                  ))}
                  <input
                    id="skillInput"
                    className="bg-transparent border-0 outline-none text-sm text-white placeholder-white/25 min-w-[80px] flex-1"
                    placeholder="Type skill + Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Min Experience (yrs)</label>
                  <input className="form-input" type="number" min={0} max={20} value={form.minExperience} onChange={(e) => dispatch(updateForm({ minExperience: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="form-label">Seniority</label>
                  <select className="form-select" value={form.seniority} onChange={(e) => dispatch(updateForm({ seniority: e.target.value as Seniority }))}>
                    {SENIORITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Employment Type</label>
                  <select className="form-select" value={form.employmentType} onChange={(e) => dispatch(updateForm({ employmentType: e.target.value as EmploymentType }))}>
                    {EMPLOYMENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Job Description</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => dispatch(updateForm({ description: e.target.value }))} placeholder="Describe responsibilities, requirements, and nice-to-haves…" />
              </div>
            </div>
          </div>

          {/* Scoring weights */}
          <div className="card">
            <div className="card-header"><span className="card-title">AI Scoring Weights</span></div>
            <div className="card-body space-y-4">
              {[
                { key: 'skills',     label: 'Skills Match',           val: form.scoringWeights.skills },
                { key: 'experience', label: 'Experience Relevance',   val: form.scoringWeights.experience },
                { key: 'education',  label: 'Education Fit',          val: form.scoringWeights.education },
              ].map(({ key, label, val }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>{label}</span>
                    <span className="font-mono">{val}%</span>
                  </div>
                  <input
                    type="range" min={5} max={80} value={val}
                    onChange={(e) => dispatch(updateWeights({ [key]: parseInt(e.target.value) }))}
                    className="w-full accent-brand-500"
                  />
                </div>
              ))}
              <p className="text-xs text-white/30">Total: {form.scoringWeights.skills + form.scoringWeights.experience + form.scoringWeights.education}% (AI normalises automatically)</p>
            </div>
          </div>
        </div>

        {/* Right: Candidate input */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><span className="card-title">Add Candidates</span></div>
            <div className="card-body">
              {/* Tabs */}
              <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5 mb-4">
                {(['json', 'pdf', 'manual'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-all ${activeTab === tab ? 'bg-white/[0.09] text-white' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {tab === 'json' ? 'JSON Profile' : tab === 'pdf' ? 'PDF / CSV' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* JSON tab */}
              {activeTab === 'json' && (
                <div>
                  <textarea
                    className="w-full bg-black/30 border border-white/[0.08] rounded-lg p-3.5 font-mono text-[11px] text-blue-200/70 leading-relaxed h-[200px] resize-none outline-none focus:border-brand-500/30"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={'[\n  {\n    "firstName": "Jane",\n    "lastName": "Doe",\n    "headline": "Backend Engineer",\n    "skills": [...]\n  }\n]'}
                  />
                  <div className="flex gap-2 mt-2">
                    <button className="btn-ghost btn btn-sm flex-1" onClick={parseJson}>Parse JSON</button>
                    <button className="btn-ghost btn btn-sm flex-1" onClick={loadSamples}>Load samples</button>
                  </div>
                </div>
              )}

              {/* PDF tab */}
              {activeTab === 'pdf' && (
                <div>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-500/60 bg-brand-500/5' : 'border-white/15 hover:border-brand-500/40 hover:bg-brand-500/[0.03]'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-9 h-9 bg-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v9M6 5l3-3 3 3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2h12v-2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </div>
                    <div className="text-sm font-medium mb-1">{isDragActive ? 'Drop files here' : 'Drop CVs or CSV here'}</div>
                    <div className="text-xs text-white/35">PDF, CSV, or Excel — up to 20 files</div>
                  </div>
                </div>
              )}

              {/* Manual tab */}
              {activeTab === 'manual' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="form-label">First Name</label><input className="form-input" value={manual.firstName} onChange={(e) => setManual({ ...manual, firstName: e.target.value })} placeholder="Jane" /></div>
                    <div><label className="form-label">Last Name</label><input className="form-input" value={manual.lastName} onChange={(e) => setManual({ ...manual, lastName: e.target.value })} placeholder="Doe" /></div>
                  </div>
                  <div><label className="form-label">Headline</label><input className="form-input" value={manual.headline} onChange={(e) => setManual({ ...manual, headline: e.target.value })} placeholder="Senior Node.js Engineer" /></div>
                  <div><label className="form-label">Skills (comma-separated)</label><input className="form-input" value={manual.skills} onChange={(e) => setManual({ ...manual, skills: e.target.value })} placeholder="Node.js, React, MongoDB" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="form-label">Years Experience</label><input className="form-input" type="number" value={manual.yoe} onChange={(e) => setManual({ ...manual, yoe: e.target.value })} /></div>
                    <div><label className="form-label">Location</label><input className="form-input" value={manual.location} onChange={(e) => setManual({ ...manual, location: e.target.value })} placeholder="Kigali, Rwanda" /></div>
                  </div>
                  <button className="btn-ghost btn w-full" onClick={addManual}>+ Add Candidate</button>
                </div>
              )}

              {/* Staged candidates */}
              {staged.length > 0 && (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Queued ({staged.length})</div>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {(staged as Array<{ firstName?: string; lastName?: string; skills?: unknown[] }>).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs">
                        <Avatar firstName={c.firstName || '?'} lastName={c.lastName || ''} index={i} size={24} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white/80 truncate">{c.firstName} {c.lastName}</div>
                          <div className="text-white/35">{(c.skills as unknown[])?.length || 0} skills</div>
                        </div>
                        <button onClick={() => dispatch(removeStagedCandidate(i))} className="text-white/30 hover:text-white/60 px-1">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Run button */}
          <button
            className="btn-primary btn w-full py-3 text-sm justify-center"
            onClick={handleRunScreening}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                AI Evaluating…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 4l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Run AI Screening
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
