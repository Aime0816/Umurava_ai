import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/job.model';

export class JobController {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const weights = req.body.scoringWeights || { skills: 50, experience: 30, education: 20 };
      const total = weights.skills + weights.experience + weights.education;
      if (Math.abs(total - 100) > 1) {
        return res.status(400).json({ error: `Scoring weights must sum to 100 (got ${total})` });
      }
      const job = await Job.create(req.body);
      res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
  }

  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: Record<string, unknown> = {};
      if (req.query.status) filter.status = req.query.status;
      const jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: jobs });
    } catch (error) { next(error); }
  }

  async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await Job.findById(req.params.id).lean();
      if (!job) return res.status(404).json({ error: 'Job not found' });
      res.json({ success: true, data: job });
    } catch (error) { next(error); }
  }

  async updateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await Job.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      res.json({ success: true, data: job });
    } catch (error) { next(error); }
  }

  async deleteJob(req: Request, res: Response, next: NextFunction) {
    try {
      await Job.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Job deleted' });
    } catch (error) { next(error); }
  }
}

export const jobController = new JobController();
