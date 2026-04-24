import mongoose, { Document, Schema } from 'mongoose';

// ── Sub-schemas (match Talent Profile Schema spec exactly) ────

const SkillSchema = new Schema({
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true,
  },
  yearsOfExperience: { type: Number, required: true, min: 0 },
}, { _id: false });

const LanguageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  proficiency: {
    type: String,
    enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
    required: true,
  },
}, { _id: false });

const ExperienceSchema = new Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  startDate: { type: String, required: true }, // YYYY-MM
  endDate: { type: String, default: 'Present' }, // YYYY-MM | Present
  description: { type: String, trim: true },
  technologies: [{ type: String, trim: true }],
  isCurrent: { type: Boolean, default: false },
}, { _id: false });

const EducationSchema = new Schema({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, required: true, trim: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
}, { _id: false });

const CertificationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  issueDate: { type: String }, // YYYY-MM
}, { _id: false });

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  technologies: [{ type: String, trim: true }],
  role: { type: String, trim: true },
  link: { type: String, trim: true },
  startDate: { type: String },
  endDate: { type: String },
}, { _id: false });

const AvailabilitySchema = new Schema({
  status: {
    type: String,
    enum: ['Available', 'Open to Opportunities', 'Not Available'],
    required: true,
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract'],
    required: true,
  },
  startDate: { type: String }, // YYYY-MM-DD optional
}, { _id: false });

const SocialLinksSchema = new Schema({
  linkedin: { type: String, trim: true },
  github: { type: String, trim: true },
  portfolio: { type: String, trim: true },
  twitter: { type: String, trim: true },
  website: { type: String, trim: true },
}, { _id: false });

// ── AI Score Extension (non-breaking — adds to schema) ────────
const AIScoreSchema = new Schema({
  overallScore: { type: Number, min: 0, max: 100 },
  skillsScore: { type: Number, min: 0, max: 100 },
  experienceScore: { type: Number, min: 0, max: 100 },
  educationScore: { type: Number, min: 0, max: 100 },
  strengths: [{ type: String }],
  gaps: [{ type: String }],
  recommendation: { type: String },
  tier: {
    type: String,
    enum: ['Strong Hire', 'Hire', 'Maybe', 'No Hire'],
  },
  evaluatedAt: { type: Date },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
}, { _id: false });

// ── Main Candidate schema ─────────────────────────────────────
export interface ICandidate extends Document {
  // 3.1 Basic Info
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  // 3.2 Skills & Languages
  skills: Array<{ name: string; level: string; yearsOfExperience: number }>;
  languages?: Array<{ name: string; proficiency: string }>;
  // 3.3 Work Experience
  experience: Array<{
    company: string; role: string; startDate: string; endDate: string;
    description?: string; technologies: string[]; isCurrent: boolean;
  }>;
  // 3.4 Education
  education: Array<{
    institution: string; degree: string; fieldOfStudy: string;
    startYear: number; endYear?: number;
  }>;
  // 3.5 Certifications
  certifications?: Array<{ name: string; issuer: string; issueDate?: string }>;
  // 3.6 Projects
  projects: Array<{
    name: string; description?: string; technologies: string[];
    role?: string; link?: string; startDate?: string; endDate?: string;
  }>;
  // 3.7 Availability
  availability: { status: string; type: string; startDate?: string };
  // 3.8 Social Links
  socialLinks?: object;
  // AI Extension
  aiScores?: object[];
  // Meta
  source: 'json' | 'csv' | 'pdf' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, sparse: true },
    headline: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    skills: { type: [SkillSchema], required: true, validate: [(v: unknown[]) => v.length > 0, 'At least one skill required'] },
    languages: [LanguageSchema],
    experience: { type: [ExperienceSchema], required: true },
    education: { type: [EducationSchema], required: true },
    certifications: [CertificationSchema],
    projects: { type: [ProjectSchema], required: true },
    availability: { type: AvailabilitySchema, required: true },
    socialLinks: SocialLinksSchema,
    aiScores: [AIScoreSchema],
    source: { type: String, enum: ['json', 'csv', 'pdf', 'manual'], default: 'json' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
// CandidateSchema.index({ email: 1 }, { unique: true, sparse: true }); // Moved to field definition
CandidateSchema.index({ 'skills.name': 1 });
CandidateSchema.index({ location: 1 });
CandidateSchema.index({ createdAt: -1 });

// ── Virtual: full name ────────────────────────────────────────
CandidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Virtual: total experience in years ───────────────────────
CandidateSchema.virtual('totalExperienceYears').get(function () {
  if (!this.experience?.length) return 0;
  return this.experience.reduce((total, exp) => {
    const start = exp.startDate ? new Date(exp.startDate + '-01') : new Date();
    const end = exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate + '-01') : new Date();
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return total + Math.max(0, years);
  }, 0);
});

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
