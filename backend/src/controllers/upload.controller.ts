import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parsePdfResume, parseCsvOrExcel, normalizeJsonProfile } from '../services/resume-parser.service';
import { Candidate } from '../models/candidate.model';
import { logger } from '../config/logger';

// ── Multer config ─────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.pdf', '.csv', '.xlsx', '.xls'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.originalname}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

// ── Upload Controller ─────────────────────────────────────────
export class UploadController {
  /**
   * POST /api/v1/upload/cvs
   * Accepts multiple PDF/CSV/Excel files, parses them, and optionally
   * saves the extracted candidates to the database.
   */
  async uploadFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const saveToDB = req.query.save !== 'false'; // default: save
      const results = { parsed: 0, saved: 0, failed: 0, candidates: [] as object[] };

      for (const file of files) {
        try {
          const ext = path.extname(file.originalname).toLowerCase();
          let candidates: object[] = [];

          if (ext === '.pdf') {
            const parsed = await parsePdfResume(file.path);
            candidates = [parsed];
          } else if (['.csv', '.xlsx', '.xls'].includes(ext)) {
            candidates = parseCsvOrExcel(file.path);
          }

          results.parsed += candidates.length;

          if (saveToDB) {
            for (const c of candidates) {
              try {
                const normalized = normalizeJsonProfile(c as Record<string, unknown>);
                const saved = await Candidate.findOneAndUpdate(
                  { email: normalized.email },
                  { $set: normalized },
                  { upsert: true, new: true }
                );
                results.saved++;
                results.candidates.push({
                  id: saved._id,
                  name: `${saved.firstName} ${saved.lastName}`,
                  email: saved.email,
                  source: file.originalname,
                });
              } catch (err) {
                results.failed++;
                logger.warn('Failed to save parsed candidate:', err);
              }
            }
          } else {
            results.candidates.push(...candidates);
          }

          // Cleanup temp file
          fs.unlink(file.path, () => {});
        } catch (err) {
          results.failed++;
          logger.error('File parse error:', { filename: file.originalname, error: err });
        }
      }

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/json
   * Accept raw JSON body (single object or array) matching Talent Profile Schema.
   */
  async uploadJson(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;
      const profiles: Record<string, unknown>[] = Array.isArray(body) ? body : [body];

      const results = { total: profiles.length, saved: 0, failed: 0, candidates: [] as object[] };

      for (const profile of profiles) {
        try {
          const normalized = normalizeJsonProfile(profile);
          const saved = await Candidate.findOneAndUpdate(
            { email: normalized.email },
            { $set: normalized },
            { upsert: true, new: true }
          );
          results.saved++;
          results.candidates.push({ id: saved._id, name: `${saved.firstName} ${saved.lastName}`, email: saved.email });
        } catch (err) {
          results.failed++;
          logger.warn('Failed to save JSON profile:', err);
        }
      }

      res.status(201).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
