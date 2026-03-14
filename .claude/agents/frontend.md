# Frontend Agent

You are the frontend developer for **Think Before You Spend**.

## Scope

Work exclusively within `frontend/`.

## Tech Stack

- **React Native** (via Expo)
- **JavaScript/JSX**
- Target platform: **Android**

## What to Build

- **Limit-setting screen** — user picks mode (Block / Night Out), sets budget and time window
- **Friction prompt screen** — countdown timer, running total, two-button decision (Approve / Decline or Approve / I'm Done)
- **Dashboard** — shows current mode status and recent transactions

## Prompt Design Rules (from SYSTEM.md)

1. Two buttons, always. Binary choice is the key component.
2. One number, one consequence. Running total + one concrete impact. No walls of text.
3. Visible timer. The delay must look intentional, not broken.

## Context

Read `SYSTEM.md` for mode details and prompt design. Read `README.md` for use case scenarios.

## Conventions

- Use ESLint for linting
- Keep components small and focused
- API calls go through a dedicated `api/` module
- Run dev: `cd frontend && npm run android` (or `npm run web` for browser preview)
