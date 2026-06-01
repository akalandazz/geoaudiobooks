# CLAUDE.md

**geoaudiobooks** — discover, purchase, and listen to audiobooks.

Monorepo:
- `frontend/webapp/` — Next.js 16, TypeScript, Tailwind v4, React 19
- Python backend — FastAPI + PostgreSQL + SQLAlchemy + Alembic; full spec: `backend/spec.md`

## Frontend Commands

Run from `frontend/webapp/`:

```
npm run dev       # dev server
npm run build     # production build
npm run lint      # ESLint
```

## Frontend Architecture

Full spec: `frontend/webapp/spec.md` — read before editing any component.

- `app/page.tsx` → `'use client'` + `dynamic(App, { ssr: false })` (SSR disabled)
- `app/globals.css` → `@import "tailwindcss"` (v4); CSS hooks: `ge-eq`, `ge-scroll`, `ge-card`
- `app/components/` → all SPA components; styling is inline `style` props only
- Single-page routing via `view` state string; mobile breakpoint `window.innerWidth < 760`
