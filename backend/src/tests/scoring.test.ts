/**
 * Tests for the Gemini service — focuses on:
 *   1. Fallback scoring logic (no API key required)
 *   2. Response parsing
 *   3. Weight validation
 *   4. Tier classification
 */

// ── Helpers (extracted from gemini.service for unit testing) ──

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

const SKILL_LEVEL_MAP: Record<SkillLevel, number> = {
  Expert: 100, Advanced: 75, Intermediate: 50, Beginner: 25,
};

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(val || 0)));
}

function validateTier(tier: string, score: number): string {
  const valid = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];
  if (valid.includes(tier)) return tier;
  if (score >= 80) return 'Strong Hire';
  if (score >= 65) return 'Hire';
  if (score >= 50) return 'Maybe';
  return 'No Hire';
}

function computeWeightedScore(
  skillsScore: number,
  expScore: number,
  eduScore: number,
  weights: { skills: number; experience: number; education: number }
): number {
  const total = weights.skills + weights.experience + weights.education;
  return Math.round(
    (skillsScore * weights.skills + expScore * weights.experience + eduScore * weights.education) / total
  );
}

// ── Tests ─────────────────────────────────────────────────────

describe('Scoring utilities', () => {
  describe('clamp()', () => {
    it('clamps values below 0 to 0', () => { expect(clamp(-10)).toBe(0); });
    it('clamps values above 100 to 100', () => { expect(clamp(110)).toBe(100); });
    it('rounds floating point values', () => { expect(clamp(72.6)).toBe(73); });
    it('passes through valid values', () => { expect(clamp(50)).toBe(50); });
  });

  describe('validateTier()', () => {
    it('returns the tier if valid', () => {
      expect(validateTier('Strong Hire', 90)).toBe('Strong Hire');
      expect(validateTier('No Hire', 20)).toBe('No Hire');
    });

    it('derives tier from score when tier is invalid', () => {
      expect(validateTier('InvalidTier', 85)).toBe('Strong Hire');
      expect(validateTier('InvalidTier', 70)).toBe('Hire');
      expect(validateTier('InvalidTier', 55)).toBe('Maybe');
      expect(validateTier('InvalidTier', 40)).toBe('No Hire');
    });
  });

  describe('computeWeightedScore()', () => {
    const weights = { skills: 50, experience: 30, education: 20 };

    it('computes correct weighted average with default weights', () => {
      const score = computeWeightedScore(80, 70, 60, weights);
      // (80*50 + 70*30 + 60*20) / 100 = (4000 + 2100 + 1200) / 100 = 73.0
      expect(score).toBe(73);
    });

    it('handles equal weights correctly', () => {
      const equalWeights = { skills: 33, experience: 33, education: 34 };
      const score = computeWeightedScore(90, 90, 90, equalWeights);
      expect(score).toBe(90);
    });

    it('heavily weighted skills scenario', () => {
      const heavySkills = { skills: 70, experience: 20, education: 10 };
      const score = computeWeightedScore(100, 0, 0, heavySkills);
      // (100*70 + 0*20 + 0*10) / 100 = 70
      expect(score).toBe(70);
    });
  });

  describe('Skill level scoring', () => {
    it('assigns correct numeric values per level', () => {
      expect(SKILL_LEVEL_MAP['Expert']).toBe(100);
      expect(SKILL_LEVEL_MAP['Advanced']).toBe(75);
      expect(SKILL_LEVEL_MAP['Intermediate']).toBe(50);
      expect(SKILL_LEVEL_MAP['Beginner']).toBe(25);
    });

    it('computes correct skill match score for partial match', () => {
      const requiredSkills = ['node.js', 'react', 'typescript'];
      const candidateSkills = [
        { name: 'node.js', level: 'Expert' as SkillLevel },
        { name: 'react',   level: 'Advanced' as SkillLevel },
        // Missing TypeScript
      ];
      let total = 0;
      requiredSkills.forEach((req) => {
        const match = candidateSkills.find((cs) => cs.name.toLowerCase() === req.toLowerCase());
        total += match ? SKILL_LEVEL_MAP[match.level] : 0;
      });
      const score = Math.round(total / requiredSkills.length);
      // (100 + 75 + 0) / 3 = 58.33 → 58
      expect(score).toBe(58);
    });
  });
});

describe('Tier boundaries', () => {
  const tiers = [
    { score: 80, expected: 'Strong Hire' },
    { score: 79, expected: 'Hire' },
    { score: 65, expected: 'Hire' },
    { score: 64, expected: 'Maybe' },
    { score: 50, expected: 'Maybe' },
    { score: 49, expected: 'No Hire' },
    { score: 0,  expected: 'No Hire' },
  ];

  tiers.forEach(({ score, expected }) => {
    it(`score ${score} → ${expected}`, () => {
      expect(validateTier('InvalidTier', score)).toBe(expected);
    });
  });
});

describe('Response parsing edge cases', () => {
  it('strips JSON markdown fences', () => {
    const raw = '```json\n[{"score": 75}]\n```';
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    expect(parsed[0].score).toBe(75);
  });

  it('handles plain JSON without fences', () => {
    const raw = '[{"score": 82, "tier": "Strong Hire"}]';
    const parsed = JSON.parse(raw);
    expect(parsed[0].tier).toBe('Strong Hire');
  });
});
