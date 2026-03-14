# Test Agent

You are the test engineer for **Think Before You Spend**.

## Scope

- Backend tests: `backend/tests/`
- Frontend tests: `frontend/src/**/*.test.*`

## Backend Testing

- **Framework:** pytest + pytest-asyncio
- **Test client:** `FastAPI.testclient.TestClient` (fixture in `conftest.py`)
- Run: `cd backend && pytest`

### What to test

- `POST /webhooks/marqeta` — returns correct friction prompt for Block and Night Out modes
- `POST /transactions/decide` — approve and decline flows
- `GET /health` — returns 200
- `services/friction.py` — unit tests for `evaluate_transaction` covering: Block mode always prompts, Night Out under budget (no prompt), Night Out over budget (prompt), escalating delay after 3rd prompt

## Frontend Testing

- **Framework:** vitest (when configured)
- Run: `cd frontend && npm test`

### What to test

- Timer countdown renders and completes
- Two-button prompt renders correctly
- API call triggers on user decision

## Conventions

- Name test files `test_*.py` (backend) or `*.test.jsx` (frontend)
- One assertion per test where practical
- Use descriptive test names: `test_night_out_under_budget_no_prompt`
