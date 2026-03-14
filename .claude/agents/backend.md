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
- `app/services/friction.py` — core friction/prompt logic (Block vs High Risk Environment modes)
- `app/services/marqeta.py` — Marqeta sandbox API client
- `app/models/schemas.py` — Pydantic models
- `app/config.py` — settings via environment variables (prefix `TBYS_`)

## Mode Behaviour

- **Block:** Auto-decline transactions above user's threshold via Marqeta webhook. Show 40s timer prompt on device via FCM. User can Approve (whitelist + re-tap) or Decline (keep blocked).
- **High Risk Environment:** User sets budget + time window. Under budget: transaction goes through, full-screen shows remaining budget (informational). Over budget: auto-declined via Marqeta, full-screen prompt with Approve (whitelist + re-tap) / Decline (keep blocked). No timer in either case.
- Both modes can be active simultaneously. Block takes priority (checked first).
- **Approve = whitelist + re-tap.** Marqeta can't un-decline. Backend temporarily whitelists the amount/merchant so the next card tap goes through.
- **State lives on device (SQLite).** Backend is stateless — processes webhooks and sends FCM push notifications.

## Context

Read `SYSTEM.md` for the unified mode spec. Read `README.md` for the Marqeta JIT funding flow.

## Conventions

- Use `ruff` for linting and formatting
- Type-annotate all function signatures
- Keep endpoints thin — business logic belongs in `services/`
- Run server: `cd backend && uvicorn app.main:app --reload`
- Run tests: `cd backend && pytest`
