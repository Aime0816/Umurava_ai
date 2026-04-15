/**
 * Seed script — populates DB with sample jobs and candidates for development/demo.
 * Run: npx ts-node src/utils/seeder.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from '../models/job.model';
import { Candidate } from '../models/candidate.model';

dotenv.config();

const SAMPLE_JOB = {
  title: 'Senior Full-Stack Engineer',
  department: 'Engineering',
  description:
    'We are building AI-powered products that serve millions across Africa. ' +
    'We need a Senior Full-Stack Engineer who can design scalable APIs, build ' +
    'performant React frontends, and integrate AI/ML capabilities into our platform.',
  requiredSkills: ['Node.js', 'React', 'TypeScript', 'MongoDB'],
  niceToHaveSkills: ['Gemini API', 'Docker', 'Redis', 'Kubernetes'],
  minExperience: 4,
  seniority: 'Senior' as const,
  location: 'Kigali, Rwanda',
  remote: true,
  employmentType: 'Full-time' as const,
  scoringWeights: { skills: 50, experience: 30, education: 20 },
  status: 'active' as const,
};

const SAMPLE_CANDIDATES = [
  {
    firstName: 'Alice', lastName: 'Kamau',
    email: 'alice.kamau@demo.com',
    headline: 'Senior Backend Engineer – Node.js & AI Systems',
    bio: 'Passionate about building scalable AI-powered platforms. 6 years shipping production systems across East Africa.',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'Node.js',     level: 'Expert'       as const, yearsOfExperience: 6 },
      { name: 'TypeScript',  level: 'Advanced'     as const, yearsOfExperience: 4 },
      { name: 'MongoDB',     level: 'Advanced'     as const, yearsOfExperience: 5 },
      { name: 'React',       level: 'Intermediate' as const, yearsOfExperience: 3 },
      { name: 'Gemini API',  level: 'Intermediate' as const, yearsOfExperience: 1 },
    ],
    experience: [
      {
        company: 'TechCorp Rwanda', role: 'Senior Backend Engineer',
        startDate: '2019-03', endDate: 'Present', isCurrent: true,
        description: 'Led microservices migration reducing P99 latency by 40%. Mentored 4 junior engineers.',
        technologies: ['Node.js', 'MongoDB', 'Redis', 'Docker'],
      },
      {
        company: 'StartupHub', role: 'Backend Engineer',
        startDate: '2017-06', endDate: '2019-02', isCurrent: false,
        description: 'Built REST APIs serving 50k DAU. Implemented JWT auth and rate limiting.',
        technologies: ['Node.js', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'University of Rwanda', degree: "Bachelor's", fieldOfStudy: 'Computer Science', startYear: 2013, endYear: 2017 }],
    projects: [
      { name: 'AI Recruitment System', description: 'LLM-powered candidate screening platform using Gemini API', technologies: ['Node.js', 'Gemini API', 'MongoDB'], role: 'Lead Engineer', startDate: '2024-01', endDate: '2024-06' },
      { name: 'Mpesa Payment Gateway', description: 'Rwanda-wide mobile payment integration for e-commerce', technologies: ['Node.js', 'TypeScript', 'Redis'], role: 'Backend Engineer', startDate: '2022-03', endDate: '2022-09' },
    ],
    certifications: [{ name: 'AWS Certified Developer – Associate', issuer: 'Amazon', issueDate: '2022-06' }],
    availability: { status: 'Available' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/alicekamau', github: 'https://github.com/alicekamau' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Kinyarwanda', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  {
    firstName: 'Brian', lastName: 'Nziza',
    email: 'brian.nziza@demo.com',
    headline: 'Full-Stack Developer – React & Node.js',
    location: 'Nairobi, Kenya',
    skills: [
      { name: 'React',      level: 'Advanced'     as const, yearsOfExperience: 3 },
      { name: 'Node.js',    level: 'Intermediate' as const, yearsOfExperience: 2 },
      { name: 'TypeScript', level: 'Beginner'     as const, yearsOfExperience: 1 },
      { name: 'MongoDB',    level: 'Beginner'     as const, yearsOfExperience: 1 },
    ],
    experience: [
      {
        company: 'StartupX Kenya', role: 'Junior Developer',
        startDate: '2022-01', endDate: 'Present', isCurrent: true,
        description: 'Built customer-facing React dashboards. Maintained Node.js microservices.',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'Strathmore University', degree: "Bachelor's", fieldOfStudy: 'Software Engineering', startYear: 2018, endYear: 2022 }],
    projects: [{ name: 'E-Commerce App', description: 'MERN stack online store with payment integration', technologies: ['React', 'Node.js', 'MongoDB'], role: 'Full-Stack Developer', startDate: '2023-01', endDate: '2023-06' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    source: 'json' as const,
  },
  {
    firstName: 'Chloe', lastName: 'Uwera',
    email: 'chloe.uwera@demo.com',
    headline: 'Lead Engineer – Cloud & Distributed Systems',
    bio: '8 years building high-availability systems. Former principal engineer at a company serving 2M+ users.',
    location: 'London, UK',
    skills: [
      { name: 'Node.js',    level: 'Expert'   as const, yearsOfExperience: 8 },
      { name: 'TypeScript', level: 'Expert'   as const, yearsOfExperience: 6 },
      { name: 'React',      level: 'Expert'   as const, yearsOfExperience: 5 },
      { name: 'MongoDB',    level: 'Expert'   as const, yearsOfExperience: 7 },
      { name: 'Kubernetes', level: 'Advanced' as const, yearsOfExperience: 4 },
      { name: 'Docker',     level: 'Expert'   as const, yearsOfExperience: 6 },
    ],
    experience: [
      {
        company: 'BigTech Ltd', role: 'Principal Engineer',
        startDate: '2018-06', endDate: 'Present', isCurrent: true,
        description: 'Architected event-driven platform serving 2M DAU. Led a team of 8 engineers. Reduced infrastructure costs 35% via K8s optimisations.',
        technologies: ['Node.js', 'TypeScript', 'Kubernetes', 'Kafka', 'MongoDB'],
      },
      {
        company: 'FinServe Corp', role: 'Senior Engineer',
        startDate: '2015-02', endDate: '2018-05', isCurrent: false,
        description: 'Built real-time trading platform with sub-10ms latency requirements.',
        technologies: ['Node.js', 'Redis', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'University College London', degree: "Master's", fieldOfStudy: 'Computer Science', startYear: 2013, endYear: 2015 }],
    projects: [
      { name: 'Distributed Event Bus', description: 'Open-source Kafka-based messaging library with 1k+ GitHub stars', technologies: ['Node.js', 'Kafka', 'TypeScript'], role: 'Creator', link: 'https://github.com/chloe/event-bus', startDate: '2020-01', endDate: '2021-06' },
    ],
    certifications: [
      { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', issueDate: '2021-03' },
      { name: 'AWS Solutions Architect – Professional', issuer: 'Amazon', issueDate: '2020-08' },
    ],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/chloeu', github: 'https://github.com/chloe-uwera' },
    source: 'json' as const,
  },
  {
    firstName: 'David', lastName: 'Habimana',
    email: 'david.habimana@demo.com',
    headline: 'Backend Developer – Python & Data APIs',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'Python',   level: 'Advanced'     as const, yearsOfExperience: 4 },
      { name: 'Node.js',  level: 'Beginner'     as const, yearsOfExperience: 1 },
      { name: 'React',    level: 'Beginner'     as const, yearsOfExperience: 0.5 },
      { name: 'MongoDB',  level: 'Intermediate' as const, yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: 'DataFirm Africa', role: 'Backend Developer',
        startDate: '2021-01', endDate: 'Present', isCurrent: true,
        description: 'Built data ingestion APIs and ETL pipelines processing 100GB/day.',
        technologies: ['Python', 'PostgreSQL', 'Airflow'],
      },
    ],
    education: [{ institution: 'AUCA', degree: "Bachelor's", fieldOfStudy: 'Information Technology', startYear: 2017, endYear: 2021 }],
    projects: [{ name: 'Analytics Dashboard', description: 'Business intelligence platform for SMEs', technologies: ['Python', 'FastAPI', 'MongoDB'], role: 'Backend Developer', startDate: '2022-06', endDate: '2022-12' }],
    availability: { status: 'Available' as const, type: 'Contract' as const },
    source: 'json' as const,
  },
  {
    firstName: 'Eva', lastName: 'Ingabire',
    email: 'eva.ingabire@demo.com',
    headline: 'Senior Full-Stack Engineer – React & Node',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'React',      level: 'Expert'   as const, yearsOfExperience: 5 },
      { name: 'Node.js',    level: 'Advanced' as const, yearsOfExperience: 5 },
      { name: 'TypeScript', level: 'Advanced' as const, yearsOfExperience: 4 },
      { name: 'MongoDB',    level: 'Advanced' as const, yearsOfExperience: 4 },
    ],
    experience: [
      {
        company: 'FinTech Rwanda', role: 'Senior Full-Stack Engineer',
        startDate: '2019-07', endDate: 'Present', isCurrent: true,
        description: 'Built payment platform processing $10M monthly. Led frontend architecture migration to Next.js.',
        technologies: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      },
    ],
    education: [{ institution: 'Carnegie Mellon University Africa', degree: "Master's", fieldOfStudy: 'Information Technology', startYear: 2017, endYear: 2019 }],
    projects: [{ name: 'Mobile Banking App', description: 'React Native financial app with 50k downloads', technologies: ['React Native', 'Node.js', 'MongoDB'], role: 'Lead Engineer', startDate: '2021-01', endDate: '2021-08' }],
    certifications: [{ name: 'MongoDB Certified Developer', issuer: 'MongoDB University', issueDate: '2021-09' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { github: 'https://github.com/eva-ingabire', portfolio: 'https://evaingabire.dev' },
    source: 'json' as const,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/umurava_talent_screening';

  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(uri);

  // Clear existing seed data
  await Promise.all([Job.deleteMany({}), Candidate.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // Insert job
  const job = await Job.create(SAMPLE_JOB);
  console.log(`✅ Created job: ${job.title} (${job._id})`);

  // Insert candidates
  const candidates = await Candidate.insertMany(SAMPLE_CANDIDATES);
  console.log(`✅ Created ${candidates.length} candidates`);

  console.log('\n📋 Seed summary:');
  console.log(`   Job ID: ${job._id}`);
  console.log('   Candidate IDs:');
  candidates.forEach((c) => console.log(`     ${c.firstName} ${c.lastName}: ${c._id}`));

  console.log('\n🚀 To run a screening via API:');
  console.log(`POST http://localhost:5000/api/v1/screenings`);
  console.log(JSON.stringify({
    jobId: job._id,
    candidateIds: candidates.map((c) => c._id),
    topCount: 10,
  }, null, 2));

  await mongoose.disconnect();
  console.log('\n✨ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
