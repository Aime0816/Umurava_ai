# Umurava AI Talent Screening System

> AI-powered candidate screening and ranking system for the Umurava Hackathon.  
> Built with Next.js · Express · MongoDB · Gemini API

---

## Overview

The Umurava Talent Screening System helps recruiters evaluate and rank candidates using AI while keeping every decision **explainable**. It accepts structured JSON profiles, uploaded CVs (PDF), and CSV/Excel files, normalises all input to the Talent Profile Schema, and uses Google Gemini to produce scored, ranked, reasoned evaluations.

---

## Features

| Feature | Details |
|---|---|
| **Multi-format input** | JSON profiles, PDF CVs, CSV/Excel spreadsheets |
| **AI evaluation** | Gemini 1.5 Pro — skills, experience, education scoring |
| **Weighted scoring** | Recruiter-configurable weights (skills / experience / education) |
| **Explainable AI** | Per-candidate strengths, gaps, recommendation, reasoning |
| **Tier classification** | Strong Hire · Hire · Maybe · No Hire |
| **Top N ranking** | Configurable top 10 or top 20 |
| **Batch processing** | Up to 20 candidates per screening session |
| **Persistent storage** | MongoDB — full audit trail of every screening |
| **REST API** | Clean versioned API (`/api/v1/`) |

---

## Architecture

```
umurava-talent-screening/
├── backend/                    # Express + TypeScript
│   └── src/
│       ├── config/             # DB connection, logger
│       ├── controllers/        # Request handlers
│       ├── middleware/         # Error handler, not-found
│       ├── models/             # Mongoose schemas
│       │   ├── candidate.model.ts   # Talent Profile Schema
│       │   ├── job.model.ts
│       │   └── screening.model.ts
│       ├── routes/             # Express routers
│       └── services/
│           ├── gemini.service.ts         # AI integration + prompt engineering
│           ├── resume-parser.service.ts  # PDF / CSV / Excel parsing
│           └── screening.service.ts      # Orchestration + ranking logic
│
└── frontend/                   # Next.js 14 + TypeScript + Tailwind
    └── src/
        ├── app/                # Next.js App Router
        ├── components/
        │   ├── dashboard/      # Dashboard view
        │   ├── screening/      # Job config + candidate input
        │   ├── rankings/       # Ranked results + detail panel
        │   ├── candidates/     # Candidate pool browser
        │   └── ui/             # Reusable primitives
        ├── hooks/              # Typed Redux hooks
        ├── lib/                # Axios API client
        ├── store/              # Redux Toolkit slices
        └── types/              # Shared TypeScript types (Talent Profile Schema)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Google Gemini API key — get one at [aistudio.google.com](https://aistudio.google.com)

### 1. Clone and install

```bash
git clone https://github.com/your-org/umurava-talent-screening.git
cd umurava-talent-screening

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `.env.example` to `.env` and fill in values:

```bash
cd backend
cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umurava_talent_screening
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=change_this_in_production
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** — copy `.env.local.example` to `.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run in development

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

### Base URL: `http://localhost:5000/api/v1`

#### Jobs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/jobs` | Create a job |
| `GET` | `/jobs` | List all jobs |
| `GET` | `/jobs/:id` | Get a job |
| `PUT` | `/jobs/:id` | Update a job |
| `DELETE` | `/jobs/:id` | Delete a job |

#### Candidates

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/candidates` | Create one or many candidates (JSON array) |
| `GET` | `/candidates` | List candidates (filter by skill, location, availability) |
| `GET` | `/candidates/search` | Search by skills |
| `GET` | `/candidates/:id` | Get a candidate |
| `PUT` | `/candidates/:id` | Update a candidate |
| `DELETE` | `/candidates/:id` | Delete a candidate |

#### Screenings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/screenings` | Run an AI screening session |
| `GET` | `/screenings` | List all screenings |
| `GET` | `/screenings/:id` | Get a screening with results |
| `GET` | `/screenings/:id/rankings` | Get ranked leaderboard |

#### Upload

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload/cvs` | Upload PDF / CSV / Excel files (multipart) |
| `POST` | `/upload/json` | Upload raw JSON profile(s) |

### Screening Request Example

```json
POST /api/v1/screenings
{
  "jobId": "64abc123...",
  "candidateIds": ["64def456...", "64ghi789..."],
  "topCount": 10
}
```

### Screening Response Example

```json
{
  "success": true,
  "data": {
    "screeningId": "64xyz...",
    "status": "completed",
    "processingTimeMs": 8420,
    "totalCandidates": 5,
    "rankedCount": 5,
    "results": [
      {
        "rank": 1,
        "candidate": {
          "id": "64abc...",
          "name": "Alice Kamau",
          "email": "alice@example.com",
          "headline": "Senior Backend Engineer",
          "skills": [...]
        },
        "evaluation": {
          "score": 88,
          "skillsScore": 92,
          "experienceScore": 85,
          "educationScore": 75,
          "tier": "Strong Hire",
          "strengths": ["Expert Node.js with 6 years experience", "Strong AI/ML project portfolio", "AWS certified"],
          "gaps": ["No Kubernetes experience listed"],
          "recommendation": "Highly recommended — exceptional skills match and directly relevant experience.",
          "reasoning": "Alice's 6 years of Node.js expertise and AI project background make her an ideal fit. Minor gap in cloud orchestration is offset by strong certifications."
        }
      }
    ]
  }
}
```

---

## Talent Profile Schema

The system strictly follows the Umurava Talent Profile Schema. See `frontend/src/types/index.ts` for the complete TypeScript definition.

**Required fields:** firstName, lastName, email, headline, location, skills[], experience[], education[], projects[], availability

**AI Extension fields** (non-breaking, added by system): overallScore, skillsScore, experienceScore, educationScore, strengths, gaps, recommendation, tier

---

## Gemini AI Prompt Engineering

The AI evaluation uses a structured prompt with:

1. **Explicit job context** — title, seniority, required skills, experience minimum
2. **Structured candidate summaries** — all schema fields normalised to text
3. **Weighted scoring instructions** — configurable per recruiter
4. **Tier classification rules** — clear thresholds (≥80 Strong Hire, 65–79 Hire, etc.)
5. **JSON output enforcement** — `responseMimeType: 'application/json'`
6. **Low temperature** (0.2) — consistent, reproducible scores

Batch processing groups candidates in sets of 10 to respect token limits.

---

## Deployment

### Docker Compose (recommended)

```bash
# Build and start all services
docker-compose up --build

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
# MongoDB: localhost:27017
```

### Production Build

```bash
# Backend
cd backend && npm run build && node dist/index.js

# Frontend
cd frontend && npm run build && npm start
```

### Cloud Deployment Options

| Platform | Notes |
|---|---|
| **Railway** | One-click deploy, add MongoDB add-on |
| **Render** | Free tier available, add Render MongoDB |
| **Vercel + Railway** | Frontend on Vercel, backend on Railway |
| **AWS ECS** | Production-grade, use DocumentDB for MongoDB |

Set these environment variables in your deployment:
- `GEMINI_API_KEY`
- `MONGODB_URI`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS=https://your-frontend-domain.com`

---

## Development

```bash
# Type check
cd backend  && npx tsc --noEmit
cd frontend && npm run type-check

# Lint
cd frontend && npm run lint

# Run tests
cd backend && npm test
```

---

## License

MIT — Umurava AI Hackathon 2024
