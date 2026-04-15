import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department?: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills?: string[];
  minExperience: number;
  maxExperience?: number;
  seniority: 'Junior' | 'Mid-level' | 'Senior' | 'Lead / Principal';
  location?: string;
  remote: boolean;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  scoringWeights: {
    skills: number;      // 0–100, must sum with exp + edu = 100
    experience: number;
    education: number;
  };
  status: 'active' | 'closed' | 'draft';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScoringWeightsSchema = new Schema({
  skills: { type: Number, required: true, min: 5, max: 90, default: 50 },
  experience: { type: Number, required: true, min: 5, max: 70, default: 30 },
  education: { type: Number, required: true, min: 5, max: 50, default: 20 },
}, { _id: false });

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    description: { type: String, required: true },
    requiredSkills: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length > 0, 'At least one required skill'],
    },
    niceToHaveSkills: [String],
    minExperience: { type: Number, required: true, min: 0, default: 0 },
    maxExperience: { type: Number, min: 0 },
    seniority: {
      type: String,
      enum: ['Junior', 'Mid-level', 'Senior', 'Lead / Principal'],
      required: true,
    },
    location: { type: String, trim: true },
    remote: { type: Boolean, default: false },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
    scoringWeights: { type: ScoringWeightsSchema, required: true },
    status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
    createdBy: { type: String },
  },
  { timestamps: true }
);

JobSchema.index({ status: 1 });
JobSchema.index({ requiredSkills: 1 });
JobSchema.index({ createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
