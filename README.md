# geoaudiobooks

Discover, purchase, and listen to audiobooks online.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind v4, React 19 |
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT |
| Infrastructure | Docker Compose |

## Quick Start

```bash
# copy env file before first run
cp backend/.env.example backend/.env

# start all services (postgres + backend + frontend)
docker compose up

# run migrations and seed data (first run only)
cd backend
alembic upgrade head
python -m app.seed
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## Development

**Frontend** — run from `frontend/webapp/`:
```bash
npm run dev       # dev server on :3000
npm run build     # production build
npm run lint      # ESLint
```

**Backend** — run from `backend/`:
```bash
uvicorn app.main:app --reload   # dev server on :8000
```

## Structure

```
geoaudiobooks/
├── frontend/webapp/   # Next.js SPA
├── backend/           # FastAPI app
│   └── spec.md        # full backend spec
└── docker-compose.yml
```
