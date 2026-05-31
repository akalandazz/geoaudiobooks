# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**geoaudiobooks** — a platform for users to discover, purchase, and listen to audiobooks online.

Monorepo structure:
- `frontend/webapp/` — Next.js 16 frontend (TypeScript, Tailwind CSS v4, React 19, App Router)
- Python backend — not yet scaffolded; confirm the framework (Django, Flask, FastAPI) before creating any backend code

## Next.js 16 — Read Before Writing Frontend Code

**This is Next.js 16, which has breaking changes from earlier versions.** APIs, conventions, and file structure may differ from training data. Before writing any Next.js code, read the relevant guide in `frontend/webapp/node_modules/next/dist/docs/`. Heed all deprecation notices.

## Frontend Commands

Run from `frontend/webapp/`:

```
npm run dev       # start dev server
npm run build     # production build
npm run lint      # ESLint
```

## Backend Setup

Once the Python backend is scaffolded and dependencies are defined:

```
pip install -r requirements.txt
# or:
uv sync
```

Add the specific run, test, and lint commands here once the framework is chosen.

## Frontend Architecture

- App Router with layouts: `app/layout.tsx` (root layout with Geist fonts + Tailwind) → `app/page.tsx`
- Global styles via Tailwind CSS v4 in `app/globals.css` — uses `@import "tailwindcss"` (v4 syntax, not `@tailwind` directives)
- Dark mode uses `prefers-color-scheme` media query with CSS custom properties (`--background`, `--foreground`)
- Docker support via `frontend/Dockerfile`
