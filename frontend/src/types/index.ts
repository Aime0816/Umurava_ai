// ── Talent Profile Schema Types (matches spec exactly) ────────

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type LanguageProficiency = 'Basic' | 'Conversational' | 'Fluent' | 'Native';
export type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract';
export type Tier = 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
export type Seniority = 'Junior' | 'Mid-level' | 'Senior' | 'Lead / Principal';

export interface Skill {
  name: string;
  level: SkillLevel;
  yearsOfExperience: number;
}

export interface Language {
  name: string;
  proficiency: LanguageProficiency;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;       // YYYY-MM
  endDate: string;         // YYYY-MM | 'Present'
  description?: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate?: string;      // YYYY-MM
}

export interface Project {
  name: string;
  description?: string;
  technologies: string[];
  role?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface Availability {
  status: AvailabilityStatus;
  type: EmploymentType;
  startDate?: string;      // YYYY-MM-DD
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
}

// AI Extension fields (non-breaking addition)
export interface AIScore {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  tier: Tier;
  evaluatedAt: string;
  jobId: string;
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  skills: Skill[];
  languages?: Language[];
  experience: Experience[];
  education: Education[];
  certifications?: Certification[];
  projects: Project[];
  availability: Availability;
  socialLinks?: SocialLinks;
  aiScores?: AIScore[];
  source: 'json' | 'csv' | 'pdf' | 'manual';
  createdAt: string;
  updatedAt: string;
  // virtuals
  fullName?: string;
  totalExperienceYears?: number;
}

// ── Job types ─────────────────────────────────────────────────

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
}

export interface Job {
  _id: string;
  title: string;
  department?: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills?: string[];
  minExperience: number;
  maxExperience?: number;
  seniority: Seniority;
  location?: string;
  remote: boolean;
  employmentType: EmploymentType;
  scoringWeights: ScoringWeights;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// ── Screening types ───────────────────────────────────────────

export interface EvaluationResult {
  score: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  tier: Tier;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  reasoning: string;
}

export interface RankedCandidate {
  rank: number;
  candidate: Candidate;
  evaluation: EvaluationResult;
}

export interface Screening {
  _id: string;
  jobId: Job | string;
  candidateIds: string[];
  results: Array<{
    rank: number;
    candidateId: string | Candidate;
    score: number;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
    tier: Tier;
    reasoning: string;
  }>;
  topCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  aiModel: string;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningResponse {
  success: boolean;
  data: {
    screeningId: string;
    status: string;
    processingTimeMs: number;
    totalCandidates: number;
    rankedCount: number;
    results: RankedCandidate[];
  };
}

// ── API response types ────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: string;
}

// ── UI State types ────────────────────────────────────────────

export interface ScreeningFormState {
  jobTitle: string;
  department: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  minExperience: number;
  seniority: Seniority;
  employmentType: EmploymentType;
  scoringWeights: ScoringWeights;
}

export const TIER_COLORS: Record<Tier, string> = {
  'Strong Hire': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Hire':        'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Maybe':       'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'No Hire':     'text-red-400 bg-red-400/10 border-red-400/20',
};

export const SCORE_COLOR = (score: number): string => {
  if (score >= 80) return '#34d399';
  if (score >= 65) return '#4f8ef7';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
};
