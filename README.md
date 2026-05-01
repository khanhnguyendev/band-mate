# Band Mate

> AI-assisted IELTS preparation platform — practice Writing, Speaking, Reading, and Listening with instant AI-estimated scoring and guided improvement plans.

---

## Overview

Band Mate helps IELTS learners get meaningful feedback on Writing and Speaking through AI-estimated scoring, criterion-level reports, and guided next steps — at a fraction of private tutoring cost. The platform combines AI evaluation, progress tracking, and gamified daily practice into one web product built on Next.js and NestJS.

> **Disclaimer:** AI scores are estimated practice scores only. Band Mate is not an official IELTS examiner or certification authority.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- An `.env` file (see `.env.example`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/band-mate.git
cd band-mate

# 2. Install dependencies (monorepo — web + api)
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys, DB URL, Redis URL, object storage credentials

# 4. Set up the database
pnpm db:migrate

# 5. Start development servers
pnpm dev
# Web (Next.js) → http://localhost:3000
# API (NestJS)  → http://localhost:4000
```

### Running Tests

```bash
# Unit + integration tests
pnpm test

# End-to-end tests
pnpm test:e2e

# Single package
pnpm --filter api test
pnpm --filter web test
```

## Project Structure

```
band-mate/
├── apps/
│   ├── web/                # Next.js learner-facing app + admin portal
│   └── api/                # NestJS backend API + queue workers
├── packages/
│   ├── shared/             # Shared types and utilities
│   └── config/             # Shared ESLint / TypeScript configs
├── docs/
│   ├── adr/                # Architecture Decision Records
│   ├── ARCHITECTURE.md     # System design and component overview
│   ├── API.md              # API reference
│   ├── DATA_MODEL.md       # Core data model
│   └── DEPLOYMENT.md       # Deployment guide
├── .github/                # Issue templates, PR template, CI workflows
├── AGENTS.md               # Instructions for AI agents
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contributor guide
└── README.md               # You are here
```

## Product Areas

| Area | Description |
|---|---|
| Writing practice | AI-estimated scoring on Task 1 / Task 2 with criterion breakdown |
| Speaking practice | Audio record or upload → transcription → AI scoring |
| Reading practice | Timed sets with auto-scoring (quest rewards) |
| Listening practice | Audio + questions with auto-scoring (quest rewards) |
| Reports center | Criterion reports, improvement tasks, historical comparison |
| Rewards / quests | Daily and weekly gamified tasks, XP, credit earning |
| Billing / wallet | Credit reservation, consumption, refund, and top-up |
| Admin console | Content, prompt packs, cost monitoring, reward config |

## Documentation

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Full product requirements document |
| [Architecture](docs/ARCHITECTURE.md) | System design, components, data flow |
| [API Reference](docs/API.md) | Endpoints, request/response shapes |
| [Data Model](docs/DATA_MODEL.md) | Core entities and relationships |
| [Deployment](docs/DEPLOYMENT.md) | Environments, build, release, rollback |
| [ADR Log](docs/adr/) | Architecture Decision Records |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit format, and pull request guidelines.

## License

MIT License — see [LICENSE](LICENSE) for details.
