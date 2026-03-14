# Think Before You Spend — Project Instructions

## Repo Structure

```
backend/          # FastAPI server
  app/
    main.py       # App entry point
    routers/      # API endpoints
    models/       # Pydantic schemas
    services/     # Business logic (friction, marqeta)
    config.py     # Settings
  tests/          # pytest tests
frontend/         # React Native (Expo) Android app
SYSTEM.md         # Mode definitions and prompt design rules
README.md         # Product concept and architecture
RESEARCH.md       # Research notes
```

## Tech Stack

- **Backend:** FastAPI, pydantic-settings, httpx, pytest
- **Frontend:** React Native (Expo), JavaScript/JSX, targeting Android

## Running

- Backend: `cd backend && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm run android` (or `npm run web` for browser preview)
- Tests: `cd backend && pytest`

## Coding Conventions

- **Python:** Use `ruff` for linting/formatting. Type-annotate function signatures. Keep endpoints thin — logic in `services/`.
- **JavaScript:** Use ESLint. Keep components small.
- **Environment variables:** Prefix backend settings with `TBYS_` (see `app/config.py`).
