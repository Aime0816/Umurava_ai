import { Request, Response, NextFunction } from 'express';
import { screeningService } from '../services/screening.service';
import { Screening } from '../models/screening.model';
import { logger } from '../config/logger';

export class ScreeningController {
  /** POST /api/v1/screenings — run a new screening */
  async runScreening(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId, candidateIds, topCount } = req.body;

      if (!jobId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({
          error: 'jobId and candidateIds[] are required',
        });
      }

      const { screening, rankedCandidates } = await screeningService.runScreening({
        jobId,
        candidateIds,
        topCount: topCount || 10,
      });

      res.status(201).json({
        success: true,
        data: {
          screeningId: screening._id,
          status: screening.status,
          processingTimeMs: screening.processingTimeMs,
          totalCandidates: candidateIds.length,
          rankedCount: rankedCandidates.length,
          results: rankedCandidates.map(r => ({
            rank: r.rank,
            candidate: {
              id: r.candidate._id,
              name: `${r.candidate.firstName} ${r.candidate.lastName}`,
              email: r.candidate.email,
              headline: r.candidate.headline,
              location: r.candidate.location,
              skills: r.candidate.skills,
              availability: r.candidate.availability,
            },
            evaluation: {
              score: r.score,
              skillsScore: r.skillsScore,
              experienceScore: r.experienceScore,
              educationScore: r.educationScore,
              tier: r.tier,
              strengths: r.strengths,
              gaps: r.gaps,
              recommendation: r.recommendation,
              reasoning: r.reasoning,
            },
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/screenings — list all screenings */
  async listScreenings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [screenings, total] = await Promise.all([
        Screening.find()
          .populate('jobId', 'title department seniority')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Screening.countDocuments(),
      ]);

      res.json({
        success: true,
        data: screenings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/screenings/:id — get a specific screening with full results */
  async getScreening(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await screeningService.getScreeningWithCandidates(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/screenings/:id/rankings — get ranked leaderboard */
  async getRankings(req: Request, res: Response, next: NextFunction) {
    try {
      const screening = await Screening.findById(req.params.id)
        .populate({ path: 'jobId', select: 'title department seniority scoringWeights' })
        .populate({ path: 'results.candidateId', select: 'firstName lastName email headline location skills availability' })
        .lean();

      if (!screening) {
        return res.status(404).json({ error: 'Screening not found' });
      }

      const rankings = screening.results
        .sort((a, b) => a.rank - b.rank)
        .map(r => ({ ...r, candidate: r.candidateId }));

      res.json({ success: true, data: { job: screening.jobId, rankings } });
    } catch (error) {
      next(error);
    }
  }
}

export const screeningController = new ScreeningController();
