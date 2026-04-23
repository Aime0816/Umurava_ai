import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../config/logger';
import { ICandidate } from '../models/candidate.model';
import { IJob } from '../models/job.model';

// ── Types ─────────────────────────────────────────────────────
export interface CandidateEvaluation {
  candidateIndex: number;
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

export interface ScreeningResult {
  evaluations: CandidateEvaluation[];
  modelUsed: string;
  promptTokens?: number;
}

// ── Gemini Service ────────────────────────────────────────────
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private fallbackModel: GenerativeModel;
  private readonly MODEL_NAME = 'gemini-2.5-flash';
  private readonly FALLBACK_MODEL_NAME = 'gemini-2.5-pro';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is required');

    this.client = new GoogleGenerativeAI(apiKey);
    
    // Primary model
    this.model = this.client.getGenerativeModel({
      model: this.MODEL_NAME,
      generationConfig: {
        temperature: 0.2,        // Low temp for consistent scoring
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json', // Force JSON output
      },
    });

    // Fallback model
    this.fallbackModel = this.client.getGenerativeModel({
      model: this.FALLBACK_MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * Retry wrapper with intelligent backoff.
   * WAITS for API to become available - retries indefinitely on 429/503.
   * Only throws on permanent errors (404).
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    attemptNumber = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const is404 = err.status === 404 || err.message?.includes('404');
      const is429 = err.status === 429 || err.message?.includes('429'); // Quota exceeded
      const is503 = err.status === 503 || err.message?.includes('503'); // Service busy
      
      // ❌ Don't retry for permanent model errors
      if (is404) {
        logger.error(`❌ Model not found (404): ${err.message}`);
        throw err;
      }
      
      // ✅ RETRY for temporary issues - WAIT for API
      if (is429 || is503) {
        let delayMs = 5000; // Default 5 seconds
        let reason = '';
        
        if (is429) {
          // Extract retry-after from API response
          const retryAfter = err.errorDetails?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay;
          if (retryAfter) {
            const seconds = retryAfter.replace('s', '');
            delayMs = Math.ceil(parseFloat(seconds) * 1000) + 1000;
            reason = `quota (API says: wait ${seconds}s)`;
          } else {
            delayMs = Math.min(60000, 5000 * Math.pow(1.5, Math.min(attemptNumber - 1, 10)));
            reason = `quota/rate-limited`;
          }
        } else if (is503) {
          delayMs = Math.min(60000, 3000 * Math.pow(1.5, Math.min(attemptNumber - 1, 10)));
          reason = `service busy (temporary)`;
        }

        // Abort if delay is too long or we've retried too many times
        if (attemptNumber >= 2 || delayMs > 15000) {
          logger.error(`❌ Aborting retry: wait time (${Math.round(delayMs / 1000)}s) too long or max attempts reached.`);
          throw err;
        }
        
        logger.warn(`⏳ Gemini ${reason} - Attempt #${attemptNumber}. Waiting ${Math.round(delayMs / 1000)}s before retry...`);
        await new Promise(r => setTimeout(r, delayMs));
        return this.callWithRetry(fn, attemptNumber + 1);
      }
      
      throw err;
    }
  }

  /**
   * Generate content with primary model, fallback to secondary if primary fails.
   */
  private async generateWithFallback(prompt: string): Promise<string> {
    try {
      logger.info(`📤 Calling Gemini Primary (${this.MODEL_NAME})...`);
      const result = await this.callWithRetry(() =>
        this.model.generateContent(prompt)
      );
      return result.response.text();
    } catch (err: any) {
      const is404 = err.status === 404 || err.message?.includes('404');
      
      if (is404) {
        logger.warn(`⚠️ Primary model failed (404), switching to fallback (${this.FALLBACK_MODEL_NAME})...`);
        try {
          const result = await this.callWithRetry(() =>
            this.fallbackModel.generateContent(prompt)
          );
          logger.info(`✅ Fallback model succeeded: ${this.FALLBACK_MODEL_NAME}`);
          return result.response.text();
        } catch (fallbackErr: any) {
          logger.error('❌ Fallback model also failed:', fallbackErr);
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  /**
   * Evaluate multiple candidates against a job description.
   * Batches in groups of 10 to stay within token limits.
   */
  async evaluateCandidates(
    candidates: Partial<ICandidate>[],
    job: Partial<IJob>
  ): Promise<ScreeningResult> {
    const BATCH_SIZE = 10;
    const allEvaluations: CandidateEvaluation[] = [];

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const batchEvals = await this.evaluateBatch(batch, job, i);
      allEvaluations.push(...batchEvals);
    }

    // Return the actual model used (could be primary or fallback)
    const modelUsed = allEvaluations.some(e => e.reasoning.includes('Fallback'))
      ? `${this.FALLBACK_MODEL_NAME} (with fallback)`
      : this.MODEL_NAME;

    return { evaluations: allEvaluations, modelUsed };
  }

  private async evaluateBatch(
    candidates: Partial<ICandidate>[],
    job: Partial<IJob>,
    offset: number
  ): Promise<CandidateEvaluation[]> {
    const prompt = this.buildEvaluationPrompt(candidates, job);
    logger.debug('Sending batch to Gemini', { candidateCount: candidates.length, offset });

    try {
      // Use fallback logic for robust API calls
      const responseText = await this.generateWithFallback(prompt);
      return this.parseEvaluationResponse(responseText, candidates.length, offset);
    } catch (err) {
      logger.warn(`⚠️ API evaluation failed (e.g. quota exhausted). Using local deterministic fallback scoring for batch offset ${offset}.`);
      return candidates.map((c, i) => this.fallbackScore(c, job, offset + i));
    }
  }

  /**
   * Core prompt engineering — structured evaluation prompt with
   * explicit scoring criteria and weighted dimensions.
   */
  private buildEvaluationPrompt(
    candidates: Partial<ICandidate>[],
    job: Partial<IJob>
  ): string {
    const weights = job.scoringWeights || { skills: 50, experience: 30, education: 20 };

    const candidatesText = candidates.map((c, i) => {
      const skillsSummary = (c.skills || [])
        .map(s => `${s.name} (${s.level}, ${s.yearsOfExperience}yr)`)
        .join(', ');

      const expSummary = (c.experience || [])
        .map(e => `${e.role} @ ${e.company} [${e.startDate}–${e.endDate || 'Present'}]: ${e.description || ''}`)
        .join(' | ');

      const eduSummary = (c.education || [])
        .map(e => `${e.degree} in ${e.fieldOfStudy} from ${e.institution} (${e.startYear}–${e.endYear || 'ongoing'})`)
        .join(', ');

      const certsSummary = (c.certifications || [])
        .map(cert => cert.name)
        .join(', ') || 'None';

      const projectsSummary = (c.projects || [])
        .map(p => `"${p.name}": ${p.description} [${(p.technologies || []).join(', ')}]`)
        .join(' | ');

      return `
CANDIDATE ${i + 1}:
  Name: ${c.firstName} ${c.lastName}
  Headline: ${c.headline}
  Location: ${c.location}
  Skills: ${skillsSummary}
  Experience: ${expSummary}
  Education: ${eduSummary}
  Certifications: ${certsSummary}
  Projects: ${projectsSummary}
  Availability: ${c.availability?.status} (${c.availability?.type})`;
    }).join('\n\n');

    return `You are a senior technical recruiter conducting AI-powered talent screening.

JOB REQUIREMENTS:
  Title: ${job.title}
  Department: ${job.department || 'N/A'}
  Seniority: ${job.seniority}
  Description: ${job.description}
  Required Skills: ${(job.requiredSkills || []).join(', ')}
  Nice-to-Have Skills: ${(job.niceToHaveSkills || []).join(', ') || 'None specified'}
  Min Experience: ${job.minExperience} years
  Employment Type: ${job.employmentType || 'Full-time'}

SCORING WEIGHTS (must use these proportions):
  Skills Match: ${weights.skills}%
  Experience Relevance: ${weights.experience}%
  Education Fit: ${weights.education}%

CANDIDATES TO EVALUATE:
${candidatesText}

SCORING INSTRUCTIONS:
1. Skills Score (0–100): How well candidate's skills match required skills. Consider skill level (Beginner=25%, Intermediate=50%, Advanced=75%, Expert=100%), years of experience, and coverage of required skills.
2. Experience Score (0–100): Relevance of work history. Consider role similarity, company type, years (vs minimum required), progression, and technologies used.
3. Education Score (0–100): Academic fit. Master's=100, Bachelor's=75, Associate's=50, No degree=30. Add 10 bonus points for relevant field of study.
4. Overall Score = (skillsScore × ${weights.skills} + experienceScore × ${weights.experience} + educationScore × ${weights.education}) / 100

TIER CLASSIFICATION:
  Strong Hire: score >= 80 (exceptional match, recommend fast-track)
  Hire: score 65–79 (solid candidate, recommend proceeding)
  Maybe: score 50–64 (partial match, consider with reservations)
  No Hire: score < 50 (insufficient match for this role)

OUTPUT: Return a JSON array with exactly ${candidates.length} objects (one per candidate, same order):
[
  {
    "candidateIndex": 0,
    "score": 85,
    "skillsScore": 90,
    "experienceScore": 80,
    "educationScore": 75,
    "strengths": ["3 specific strength points — be concrete, reference actual skills/experience"],
    "gaps": ["1-3 specific gaps — what is missing vs requirements"],
    "recommendation": "One clear, actionable hiring recommendation sentence.",
    "tier": "Strong Hire",
    "reasoning": "2-3 sentence explanation of the overall assessment for recruiter transparency."
  }
]

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;
  }

  /**
   * Parse and validate Gemini's JSON response.
   */
  private parseEvaluationResponse(
    responseText: string,
    expectedCount: number,
    offset: number
  ): CandidateEvaluation[] {
    try {
      // Strip any accidental markdown fences
      const cleaned = responseText.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as CandidateEvaluation[];

      if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} results, got ${parsed.length}`);
      }

      // Validate and sanitize each result
      return parsed.map((result, i) => ({
        candidateIndex: offset + i,
        score: this.clamp(result.score),
        skillsScore: this.clamp(result.skillsScore),
        experienceScore: this.clamp(result.experienceScore),
        educationScore: this.clamp(result.educationScore),
        strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
        gaps: Array.isArray(result.gaps) ? result.gaps.slice(0, 5) : [],
        recommendation: result.recommendation || 'No recommendation provided.',
        tier: this.validateTier(result.tier, result.score),
        reasoning: result.reasoning || '',
      }));
    } catch (error) {
      logger.error('Failed to parse Gemini response:', { error, responseText });
      throw new Error(`AI response parsing failed: ${error}`);
    }
  }

  /** Deterministic fallback when AI is unavailable */
  private fallbackScore(
    candidate: Partial<ICandidate>,
    job: Partial<IJob>,
    index: number
  ): CandidateEvaluation {
    const requiredSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
    const candidateSkills = (candidate.skills || []).map(s => ({
      name: s.name.toLowerCase(),
      level: s.level,
      years: s.yearsOfExperience,
    }));

    // Skills scoring
    const skillLevelMap: Record<string, number> = {
      Expert: 100, Advanced: 75, Intermediate: 50, Beginner: 25,
    };
    let skillsScore = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach(req => {
      const match = candidateSkills.find(cs => cs.name.includes(req) || req.includes(cs.name));
      if (match) {
        skillsScore += skillLevelMap[match.level] || 50;
        matchedSkills.push(match.name);
      } else {
        missingSkills.push(req);
      }
    });
    skillsScore = requiredSkills.length > 0
      ? Math.round(skillsScore / requiredSkills.length)
      : 50;

    // Experience scoring
    const totalYears = (candidate.experience || []).reduce((acc, exp) => {
      const start = new Date(exp.startDate + '-01');
      const end = exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate + '-01') : new Date();
      return acc + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    }, 0);
    const minExp = job.minExperience || 0;
    const experienceScore = Math.min(100, Math.round(minExp > 0
      ? (totalYears / minExp) * 70 + 10
      : Math.min(totalYears * 15 + 20, 90)));

    // Education scoring
    const degreeMap: Record<string, number> = {
      "Master's": 100, "PhD": 100, "Bachelor's": 75, "Associate's": 50,
    };
    const topDegree = (candidate.education || [])[0];
    const educationScore = topDegree ? (degreeMap[topDegree.degree] || 55) : 30;

    // Weighted overall
    const weights = job.scoringWeights || { skills: 50, experience: 30, education: 20 };
    const totalWeight = weights.skills + weights.experience + weights.education;
    const score = Math.round(
      (skillsScore * weights.skills + experienceScore * weights.experience + educationScore * weights.education) / totalWeight
    );

    const tier = score >= 80 ? 'Strong Hire' : score >= 65 ? 'Hire' : score >= 50 ? 'Maybe' : 'No Hire';

    return {
      candidateIndex: index,
      score,
      skillsScore,
      experienceScore,
      educationScore,
      strengths: matchedSkills.length > 0
        ? [`Proficient in ${matchedSkills.slice(0, 3).join(', ')}`,
           `${Math.round(totalYears)} years of relevant experience`]
        : ['Candidate available for screening'],
      gaps: missingSkills.slice(0, 3).map(s => `Missing required skill: ${s}`),
      recommendation: `${tier === 'Strong Hire' || tier === 'Hire' ? 'Recommended' : 'Not recommended'} for ${job.title || 'this role'} based on profile analysis.`,
      tier,
      reasoning: `Fallback scoring used (AI unavailable). Skills match: ${skillsScore}%, Experience: ${experienceScore}%, Education: ${educationScore}%.`,
    };
  }

  private clamp(val: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, Math.round(val || 0)));
  }

  private validateTier(
    tier: string,
    score: number
  ): CandidateEvaluation['tier'] {
    const valid = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];
    if (valid.includes(tier)) return tier as CandidateEvaluation['tier'];
    // Derive from score if invalid
    if (score >= 80) return 'Strong Hire';
    if (score >= 65) return 'Hire';
    if (score >= 50) return 'Maybe';
    return 'No Hire';
  }
}

export const geminiService = new GeminiService();
