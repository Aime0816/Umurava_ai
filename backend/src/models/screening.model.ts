import mongoose, { Document, Schema } from 'mongoose';

export interface IScreeningResult {
  candidateId: mongoose.Types.ObjectId;
  rank: number;
  score: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  tier: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
  reasoning?: string;
}

export interface IScreening extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateIds: mongoose.Types.ObjectId[];
  results: IScreeningResult[];
  topCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  aiModel: string;
  processingTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningResultSchema = new Schema<IScreeningResult>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  rank: { type: Number, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  skillsScore: { type: Number, required: true, min: 0, max: 100 },
  experienceScore: { type: Number, required: true, min: 0, max: 100 },
  educationScore: { type: Number, required: true, min: 0, max: 100 },
  strengths: [{ type: String }],
  gaps: [{ type: String }],
  recommendation: { type: String, required: true },
  tier: {
    type: String,
    enum: ['Strong Hire', 'Hire', 'Maybe', 'No Hire'],
    required: true,
  },
  reasoning: { type: String },
}, { _id: false });

const ScreeningSchema = new Schema<IScreening>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateIds: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    results: [ScreeningResultSchema],
    topCount: { type: Number, default: 10, min: 1, max: 50 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
    aiModel: { type: String, default: 'gemini-1.5-pro' },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

ScreeningSchema.index({ jobId: 1 });
ScreeningSchema.index({ status: 1 });
ScreeningSchema.index({ createdAt: -1 });

export const Screening = mongoose.model<IScreening>('Screening', ScreeningSchema);
