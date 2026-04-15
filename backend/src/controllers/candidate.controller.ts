import { Request, Response, NextFunction } from 'express';
import { Candidate } from '../models/candidate.model';
import { normalizeJsonProfile } from '../services/resume-parser.service';
import { logger } from '../config/logger';

export class CandidateController {
  /** POST /api/v1/candidates — create one or bulk via JSON profile */
  async createCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;
      const profiles = Array.isArray(body) ? body : [body];

      const normalized = profiles.map(p => normalizeJsonProfile(p));
      const results = { created: 0, skipped: 0, errors: [] as string[] };
      const created = [];

      for (const profile of normalized) {
        try {
          const candidate = await Candidate.create(profile);
          created.push(candidate);
          results.created++;
        } catch (err: unknown) {
          if ((err as { code?: number }).code === 11000) {
            // Duplicate email — try update instead
            const existing = await Candidate.findOneAndUpdate(
              { email: profile.email },
              { $set: profile },
              { new: true }
            );
            if (existing) { created.push(existing); results.skipped++; }
          } else {
            results.errors.push(`${profile.email}: ${err}`);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: created,
        summary: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/candidates — list with filters */
  async listCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (req.query.skill) filter['skills.name'] = new RegExp(req.query.skill as string, 'i');
      if (req.query.location) filter['location'] = new RegExp(req.query.location as string, 'i');
      if (req.query.availability) filter['availability.status'] = req.query.availability;
      if (req.query.source) filter['source'] = req.query.source;

      const [candidates, total] = await Promise.all([
        Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Candidate.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: candidates,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/candidates/:id */
  async getCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await Candidate.findById(req.params.id).lean();
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/v1/candidates/:id */
  async updateCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await Candidate.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/v1/candidates/:id */
  async deleteCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const candidate = await Candidate.findByIdAndDelete(req.params.id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json({ success: true, message: 'Candidate deleted' });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/candidates/search — skill-based search */
  async searchCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { skills, location, availability, minExperience } = req.query;
      const filter: Record<string, unknown> = {};

      if (skills) {
        const skillList = (skills as string).split(',').map(s => s.trim());
        filter['skills.name'] = { $in: skillList.map(s => new RegExp(s, 'i')) };
      }
      if (location) filter['location'] = new RegExp(location as string, 'i');
      if (availability) filter['availability.status'] = availability;

      const candidates = await Candidate.find(filter).limit(50).lean();

      res.json({ success: true, data: candidates, count: candidates.length });
    } catch (error) {
      next(error);
    }
  }
}

export const candidateController = new CandidateController();
