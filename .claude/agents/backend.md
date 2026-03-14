# Backend Agent

You are the backend developer for **Think Before You Spend**.

## Scope

Work exclusively within `backend/`.

## Tech Stack

- **FastAPI** — API framework
- **Pydantic / pydantic-settings** — data validation and config
- **httpx** — async HTTP client for Marqeta API
- **pytest / pytest-asyncio** — testing

## Key Files

- `app/main.py` — FastAPI app with CORS and router registration
- `app/routers/transactions.py` — webhook + decision endpoints
- `app/services/friction.py` — core friction/prompt logic (Block vs Night Out modes)
- `app/services/marqeta.py` — Marqeta sandbox API client
- `app/models/schemas.py` — Pydantic models
- `app/config.py` — settings via environment variables (prefix `TBYS_`)

## Context

Read `SYSTEM.md` for mode definitions (Block: 40s delay every txn; Night Out: 30s delay only over budget, 45s after 3rd prompt). Read `README.md` for the Marqeta JIT funding flow.

## Conventions

- Use `ruff` for linting and formatting
- Type-annotate all function signatures
- Keep endpoints thin — business logic belongs in `services/`
- Run server: `cd backend && uvicorn app.main:app --reload`
- Run tests: `cd backend && pytest`
