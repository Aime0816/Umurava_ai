import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';
import { ICandidate } from '../models/candidate.model';

type PartialCandidate = Partial<ICandidate>;

// ── PDF Parser ────────────────────────────────────────────────
/**
 * Extracts structured candidate data from a PDF CV/resume.
 * Uses pattern matching on the extracted text to map to schema fields.
 */
export async function parsePdfResume(filePath: string): Promise<PartialCandidate> {
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);
  const text = parsed.text;

  logger.debug('Parsed PDF text length:', text.length);

  return extractCandidateFromText(text, path.basename(filePath));
}

/**
 * Extract candidate fields from raw text using heuristics.
 * For production: consider using Gemini to parse unstructured PDF text.
 */
function extractCandidateFromText(text: string, filename: string): PartialCandidate {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Heuristic: first non-empty line or first two words as name
  const nameLine = lines[0] || filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  const nameParts = nameLine.split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || 'Candidate';

  // Email extraction
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : `${firstName.toLowerCase()}.${Date.now()}@imported.cv`;

  // Phone (not in schema but useful for logging)
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,15}\d)/);

  // Location — look for "City, Country" or "Location:" prefix
  const locationMatch = text.match(/(?:location|based in|city)[:\s]+([^\n,]+(?:,\s*[^\n]+)?)/i)
    || text.match(/([A-Z][a-z]+,\s*[A-Z][a-z]+)/);
  const location = locationMatch ? locationMatch[1].trim() : 'Unknown';

  // LinkedIn URL
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  // Skills extraction — look for skills section
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'technologies', 'tech stack']);
  const skillNames = extractSkillNames(skillsSection || text);

  // Experience section
  const expSection = extractSection(text, ['experience', 'work experience', 'employment']);
  const experience = parseExperienceSection(expSection || '');

  // Education section
  const eduSection = extractSection(text, ['education', 'academic', 'qualification']);
  const education = parseEducationSection(eduSection || '');

  // Headline — second line or generate from skills
  const headline = lines[1] && lines[1].length < 100
    ? lines[1]
    : skillNames.length > 0 ? `${skillNames[0]} Professional` : 'Software Professional';

  return {
    firstName,
    lastName,
    email,
    headline,
    location,
    skills: skillNames.slice(0, 15).map(name => ({
      name,
      level: 'Intermediate' as const,
      yearsOfExperience: 2,
    })),
    experience: experience.length > 0 ? experience : [{
      company: 'Previous Employer',
      role: 'Professional',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Extracted from CV',
      technologies: skillNames.slice(0, 3),
      isCurrent: true,
    }],
    education: education.length > 0 ? education : [{
      institution: 'Unknown University',
      degree: "Bachelor's",
      fieldOfStudy: 'Computer Science',
      startYear: 2016,
      endYear: 2020,
    }],
    projects: [],
    availability: { status: 'Open to Opportunities', type: 'Full-time' },
    certifications: [],
    socialLinks: {
      ...(linkedinMatch ? { linkedin: `https://${linkedinMatch[0]}` } : {}),
      ...(githubMatch ? { github: `https://${githubMatch[0]}` } : {}),
    },
    source: 'pdf' as const,
  };
}

function extractSection(text: string, headers: string[]): string | null {
  const pattern = new RegExp(
    `(?:${headers.join('|')})[:\\s]*\\n([\\s\\S]{20,800}?)(?=\\n[A-Z][A-Z\\s]{3,}:|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? match[1] : null;
}

function extractSkillNames(text: string): string[] {
  // Common tech skill keywords
  const knownSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby',
    'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Node.js', 'Express', 'Django', 'FastAPI',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'GraphQL', 'REST', 'gRPC', 'Kafka', 'RabbitMQ',
    'Git', 'Linux', 'Nginx', 'Machine Learning', 'TensorFlow', 'PyTorch',
  ];

  const found: string[] = [];
  knownSkills.forEach(skill => {
    if (new RegExp(skill, 'i').test(text)) found.push(skill);
  });

  // Also extract comma/bullet separated items
  const commaItems = text.match(/(?:[A-Za-z+#.]+(?:\s[A-Za-z+#.]+)?(?:,|\s*•|\s*\||\s*\/)\s*){2,}/g);
  if (commaItems) {
    commaItems.forEach(chunk => {
      chunk.split(/[,•|\/]/).forEach(item => {
        const trimmed = item.trim();
        if (trimmed.length > 1 && trimmed.length < 30 && !found.includes(trimmed)) {
          found.push(trimmed);
        }
      });
    });
  }

  return [...new Set(found)];
}

function parseExperienceSection(text: string) {
  // Very simplified — real system would use Gemini here
  const results: PartialCandidate['experience'] = [];
  const rolePatterns = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:at|@|\|)\s+([A-Za-z\s]+)/g);
  if (rolePatterns) {
    rolePatterns.slice(0, 3).forEach(match => {
      const parts = match.split(/\s+(?:at|@|\|)\s+/);
      results.push({
        company: (parts[1] || 'Company').trim(),
        role: (parts[0] || 'Role').trim(),
        startDate: '2020-01',
        endDate: 'Present',
        description: '',
        technologies: [],
        isCurrent: results.length === 0,
      });
    });
  }
  return results;
}

function parseEducationSection(text: string) {
  const results: PartialCandidate['education'] = [];
  const degreeMatch = text.match(/(bachelor|master|phd|associate|bsc|msc|mba)[^\n]*/gi);
  if (degreeMatch) {
    degreeMatch.slice(0, 2).forEach(match => {
      const yearMatch = match.match(/\b(19|20)\d{2}\b/g);
      results.push({
        institution: 'University',
        degree: match.toLowerCase().includes('master') ? "Master's"
          : match.toLowerCase().includes('phd') ? 'PhD'
          : "Bachelor's",
        fieldOfStudy: 'Computer Science',
        startYear: yearMatch ? parseInt(yearMatch[0]) : 2016,
        endYear: yearMatch && yearMatch[1] ? parseInt(yearMatch[1]) : 2020,
      });
    });
  }
  return results;
}

// ── CSV / Excel Parser ────────────────────────────────────────
/**
 * Parse CSV or Excel file containing candidate data.
 * Expects columns matching the Talent Profile Schema fields.
 */
export function parseCsvOrExcel(filePath: string): PartialCandidate[] {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, string>[];

  logger.debug(`Parsed ${rows.length} rows from ${ext} file`);

  return rows.map((row, i) => mapRowToCandidate(row, i));
}

function mapRowToCandidate(row: Record<string, string>, index: number): PartialCandidate {
  // Flexible column mapping — handle various header conventions
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()];
      if (val) return String(val).trim();
    }
    return '';
  };

  const skillsRaw = get('skills', 'Skills', 'technical_skills', 'TechnicalSkills');
  const skills = skillsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean).map(name => ({
    name,
    level: (get('skill_level', 'SkillLevel') as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') || 'Intermediate',
    yearsOfExperience: parseInt(get('years_experience', 'YearsExperience', 'experience_years') || '2') || 2,
  }));

  const firstName = get('firstName', 'first_name', 'FirstName', 'first');
  const lastName = get('lastName', 'last_name', 'LastName', 'last');
  const email = get('email', 'Email', 'email_address') || `candidate${index}@imported.csv`;

  return {
    firstName: firstName || `Candidate`,
    lastName: lastName || `${index + 1}`,
    email,
    headline: get('headline', 'Headline', 'title', 'job_title', 'Title') || 'Professional',
    bio: get('bio', 'Bio', 'summary', 'about'),
    location: get('location', 'Location', 'city', 'country') || 'Remote',
    skills: skills.length > 0 ? skills : [{ name: 'General', level: 'Intermediate', yearsOfExperience: 2 }],
    experience: [{
      company: get('company', 'Company', 'employer', 'current_company') || 'Previous Company',
      role: get('role', 'Role', 'position', 'job_title') || 'Professional',
      startDate: get('start_date', 'StartDate', 'start') || '2020-01',
      endDate: get('end_date', 'EndDate', 'end') || 'Present',
      description: get('description', 'Description', 'responsibilities'),
      technologies: [],
      isCurrent: true,
    }],
    education: [{
      institution: get('institution', 'Institution', 'university', 'school') || 'University',
      degree: get('degree', 'Degree', 'qualification') || "Bachelor's",
      fieldOfStudy: get('field_of_study', 'FieldOfStudy', 'major', 'field') || 'Computer Science',
      startYear: parseInt(get('edu_start_year', 'EduStartYear', 'graduation_start') || '2016'),
      endYear: parseInt(get('edu_end_year', 'EduEndYear', 'graduation_year', 'graduation') || '2020'),
    }],
    projects: [],
    availability: {
      status: (get('availability', 'Availability', 'status') as 'Available' | 'Open to Opportunities' | 'Not Available') || 'Open to Opportunities',
      type: (get('type', 'Type', 'employment_type', 'EmploymentType') as 'Full-time' | 'Part-time' | 'Contract') || 'Full-time',
    },
    source: 'csv' as const,
  };
}

// ── JSON Profile Validator ────────────────────────────────────
/**
 * Validate and normalize a raw JSON candidate profile against the Talent Profile Schema.
 */
export function normalizeJsonProfile(raw: Record<string, unknown>): PartialCandidate {
  return {
    firstName: String(raw.firstName || ''),
    lastName: String(raw.lastName || ''),
    email: String(raw.email || '').toLowerCase(),
    headline: String(raw.headline || ''),
    bio: raw.bio ? String(raw.bio) : undefined,
    location: String(raw.location || ''),
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    languages: Array.isArray(raw.languages) ? raw.languages : undefined,
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : undefined,
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    availability: (raw.availability as ICandidate['availability']) || { status: 'Open to Opportunities', type: 'Full-time' },
    socialLinks: raw.socialLinks as object || undefined,
    source: 'json' as const,
  };
}
