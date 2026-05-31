# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**geoaudiobooks** — a platform for users to discover, purchase, and listen to audiobooks online.

This is a Python project (standard Python `.gitignore` in place). The tech stack has not yet been committed to code — confirm the framework (Django, Flask, FastAPI, etc.) before scaffolding new components.

## Setup

Once dependencies are defined, install with:

```
pip install -r requirements.txt
# or, if using a modern package manager:
uv sync
```

## Commands

Add build, lint, test, and run commands here as the project is set up. Typical placeholders to fill in:

- **Run dev server**: `python manage.py runserver` (Django) or `flask run` or `uvicorn app.main:app --reload`
- **Run tests**: `pytest` or `python -m pytest tests/`
- **Run a single test**: `pytest tests/path/to/test_file.py::test_function_name`
- **Lint**: `ruff check .`
- **Format**: `ruff format .`
