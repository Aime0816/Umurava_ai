import { geminiService } from './gemini.service';
import { Screening, IScreening } from '../models/screening.model';
import { Candidate, ICandidate } from '../models/candidate.model';
import { Job } from '../models/job.model';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

export interface ScreeningOptions {
  jobId: string;
  candidateIds: string[];
  topCount?: number;
}

export interface RankedCandidate {
  rank: number;
  candidate: ICandidate;
  score: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  tier: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
  reasoning: string;
}

export class ScreeningService {
  /**
   * Run a full AI screening session.
   * 1. Fetch job and candidates from DB
   * 2. Call Gemini for evaluation
   * 3. Sort by score and assign ranks
   * 4. Persist results
   * 5. Return ranked list
   */
  async runScreening(options: ScreeningOptions): Promise<{
    screening: IScreening;
    rankedCandidates: RankedCandidate[];
  }> {
    const startTime = Date.now();

    // Validate job exists
    const job = await Job.findById(options.jobId);
    if (!job) throw new Error(`Job not found: ${options.jobId}`);

    // Fetch candidates
    const candidates = await Candidate.find({
      _id: { $in: options.candidateIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    if (!candidates.length) throw new Error('No candidates found for the given IDs');

    // Create screening session record
    const screening = await Screening.create({
      jobId: job._id,
      candidateIds: candidates.map(c => c._id),
      topCount: options.topCount || 10,
      status: 'processing',
      aiModel: 'gemini-1.5-pro',
    });

    logger.info('Starting screening session', {
      screeningId: screening._id,
      jobTitle: job.title,
      candidateCount: candidates.length,
    });

    try {
      // AI evaluation
      const { evaluations } = await geminiService.evaluateCandidates(candidates, job);

      // Map evaluations to candidates and sort by score
      const evaluated = evaluations.map((eval_, i) => ({
        ...eval_,
        candidate: candidates[eval_.candidateIndex] || candidates[i],
      }));

      evaluated.sort((a, b) => b.score - a.score);

      // Assign ranks and take topCount
      const topCandidates = evaluated.slice(0, options.topCount || 10);
      const rankedCandidates: RankedCandidate[] = topCandidates.map((e, idx) => ({
        rank: idx + 1,
        candidate: e.candidate,
        score: e.score,
        skillsScore: e.skillsScore,
        experienceScore: e.experienceScore,
        educationScore: e.educationScore,
        strengths: e.strengths,
        gaps: e.gaps,
        recommendation: e.recommendation,
        tier: e.tier,
        reasoning: e.reasoning,
      }));

      // Persist results
      const processingTimeMs = Date.now() - startTime;
      screening.results = rankedCandidates.map(r => ({
        candidateId: r.candidate._id as mongoose.Types.ObjectId,
        rank: r.rank,
        score: r.score,
        skillsScore: r.skillsScore,
        experienceScore: r.experienceScore,
        educationScore: r.educationScore,
        strengths: r.strengths,
        gaps: r.gaps,
        recommendation: r.recommendation,
        tier: r.tier,
        reasoning: r.reasoning,
      }));
      screening.status = 'completed';
      screening.processingTimeMs = processingTimeMs;
      await screening.save();

      // Update candidate AI scores (upsert for the job)
      await Promise.all(rankedCandidates.map(r =>
        Candidate.findByIdAndUpdate(r.candidate._id, {
          $push: {
            aiScores: {
              overallScore: r.score,
              skillsScore: r.skillsScore,
              experienceScore: r.experienceScore,
              educationScore: r.educationScore,
              strengths: r.strengths,
              gaps: r.gaps,
              recommendation: r.recommendation,
              tier: r.tier,
              evaluatedAt: new Date(),
              jobId: job._id,
            },
          },
        })
      ));

      logger.info('Screening completed', {
        screeningId: screening._id,
        processingTimeMs,
        topScore: rankedCandidates[0]?.score,
      });

      return { screening, rankedCandidates };
    } catch (error) {
      screening.status = 'failed';
      screening.errorMessage = String(error);
      await screening.save();
      throw error;
    }
  }

  /** Get a screening with populated candidate data */
  async getScreeningWithCandidates(screeningId: string) {
    const screening = await Screening.findById(screeningId)
      .populate('jobId')
      .lean();

    if (!screening) throw new Error('Screening not found');

    const candidateIds = screening.results.map(r => r.candidateId);
    const candidates = await Candidate.find({ _id: { $in: candidateIds } }).lean();
    const candidateMap = new Map(candidates.map(c => [String(c._id), c]));

    const enriched = screening.results.map(r => ({
      ...r,
      candidate: candidateMap.get(String(r.candidateId)),
    }));

    return { ...screening, results: enriched };
  }
}

export const screeningService = new ScreeningService();
