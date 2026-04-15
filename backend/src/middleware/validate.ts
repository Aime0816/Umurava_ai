import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Generic validation middleware factory.
 * Usage: router.post('/', validate(myZodSchema), controller.method)
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };

// ── Schema definitions ────────────────────────────────────────

export const JobSchema = z.object({
  title:          z.string().min(2).max(120),
  department:     z.string().max(80).optional(),
  description:    z.string().min(10).max(5000),
  requiredSkills: z.array(z.string().min(1)).min(1, 'At least one required skill'),
  niceToHaveSkills: z.array(z.string()).optional().default([]),
  minExperience:  z.number().int().min(0).max(40).default(0),
  maxExperience:  z.number().int().min(0).optional(),
  seniority:      z.enum(['Junior', 'Mid-level', 'Senior', 'Lead / Principal']),
  location:       z.string().max(100).optional(),
  remote:         z.boolean().default(false),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract']).default('Full-time'),
  scoringWeights: z.object({
    skills:     z.number().int().min(5).max(90),
    experience: z.number().int().min(5).max(70),
    education:  z.number().int().min(5).max(50),
  }).default({ skills: 50, experience: 30, education: 20 }),
  status: z.enum(['active', 'closed', 'draft']).default('active'),
});

export const ScreeningRequestSchema = z.object({
  jobId:        z.string().min(24).max(24),
  candidateIds: z.array(z.string().min(24).max(24)).min(1).max(50),
  topCount:     z.number().int().min(1).max(50).default(10),
});

export const SkillSchema = z.object({
  name:               z.string().min(1).max(80),
  level:              z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  yearsOfExperience:  z.number().min(0).max(60),
});

export const CandidateSchema = z.object({
  firstName:  z.string().min(1).max(80),
  lastName:   z.string().min(1).max(80),
  email:      z.string().email(),
  headline:   z.string().min(2).max(200),
  bio:        z.string().max(2000).optional(),
  location:   z.string().min(2).max(150),
  skills:     z.array(SkillSchema).min(1),
  languages:  z.array(z.object({
    name:        z.string(),
    proficiency: z.enum(['Basic', 'Conversational', 'Fluent', 'Native']),
  })).optional(),
  experience: z.array(z.object({
    company:     z.string().min(1),
    role:        z.string().min(1),
    startDate:   z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
    endDate:     z.string(),
    description: z.string().optional(),
    technologies:z.array(z.string()).default([]),
    isCurrent:   z.boolean().default(false),
  })),
  education: z.array(z.object({
    institution:  z.string().min(1),
    degree:       z.string().min(1),
    fieldOfStudy: z.string().min(1),
    startYear:    z.number().int().min(1950).max(2030),
    endYear:      z.number().int().min(1950).max(2030).optional(),
  })),
  certifications: z.array(z.object({
    name:      z.string(),
    issuer:    z.string(),
    issueDate: z.string().optional(),
  })).optional().default([]),
  projects: z.array(z.object({
    name:         z.string().min(1),
    description:  z.string().optional(),
    technologies: z.array(z.string()).default([]),
    role:         z.string().optional(),
    link:         z.string().url().optional(),
    startDate:    z.string().optional(),
    endDate:      z.string().optional(),
  })),
  availability: z.object({
    status:    z.enum(['Available', 'Open to Opportunities', 'Not Available']),
    type:      z.enum(['Full-time', 'Part-time', 'Contract']),
    startDate: z.string().optional(),
  }),
  socialLinks: z.object({
    linkedin:  z.string().url().optional(),
    github:    z.string().url().optional(),
    portfolio: z.string().url().optional(),
    twitter:   z.string().url().optional(),
    website:   z.string().url().optional(),
  }).optional(),
  source: z.enum(['json', 'csv', 'pdf', 'manual']).default('json'),
});

// Bulk candidate upload (array or single)
export const CandidateBulkSchema = z.union([
  CandidateSchema,
  z.array(CandidateSchema),
]);
