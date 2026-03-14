# Think Before You Spend

## Repo Structure

```
backend/          # FastAPI server
  app/
    main.py       # Entry point
    routers/      # Endpoints
    models/       # Pydantic schemas
    services/     # Business logic (friction, marqeta)
    config.py     # Settings (env prefix TBYS_)
frontend/         # React Native (Expo), Android
SYSTEM.md         # Mode spec (source of truth)
README.md         # Product concept
RESEARCH.md       # Behavioural research
```

## Running

- Backend: `cd backend && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm run android` (or `npm run web`)

## Conventions

- Python: ruff, type annotations, thin endpoints, logic in services/
- JS: ESLint, small components, API calls via api/ module
- No unnecessary comments. Code should be self-explanatory.
- No docstrings unless the function is genuinely non-obvious.
- Keep TODO comments for actual unfinished work only.
