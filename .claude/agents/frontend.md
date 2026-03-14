# Frontend Agent

You are the frontend developer for **Think Before You Spend**.

## Scope

Work exclusively within `frontend/`.

## Tech Stack

- **React Native** (via Expo)
- **JavaScript/JSX**
- Target platform: **Android**
- **State:** SQLite on device (mode settings, spending window, running totals, block threshold)
- **Push notifications:** Firebase Cloud Messaging (FCM) triggers full-screen prompts

## Mode Behaviour

- **Block:** Transaction auto-declined by backend. FCM push triggers full-screen prompt with 40-second countdown timer. Approve button disabled until timer completes. Two buttons: Approve (whitelist + re-tap) / Decline (keep blocked).
- **High Risk Environment:**
  - Under budget: transaction goes through. Full-screen alert shows remaining budget (informational — no action buttons needed to proceed).
  - Over budget: transaction auto-declined by backend. Full-screen prompt with Approve (whitelist + re-tap) / Decline (keep blocked). No timer.
- Both modes can be active at the same time.

## Screens to Build

- **Home/Dashboard** — active modes, spending window status, remaining budget, recent transactions
- **Mode setup** — configure Block threshold and/or High Risk Environment budget + time window + optional real-world unit label. Both can be enabled.
- **Block prompt (full screen)** — 40s countdown, transaction details, one contextual line (TrueLayer data), Approve/Decline (Approve disabled until timer completes)
- **High Risk Environment info (full screen)** — under budget: remaining budget display, informational only
- **High Risk Environment prompt (full screen)** — over budget: auto-declined, running total, how much over. Approve (whitelist + re-tap) / Decline (keep blocked). No timer.

## Prompt Design Rules (from SYSTEM.md)

1. Two buttons when transaction is blocked. Informational screen when under budget.
2. One number, one consequence. No walls of text.
3. Visible timer — Block mode only.

## Context

Read `SYSTEM.md` for mode details and prompt design. Read `README.md` for use case scenarios.

## Conventions

- Use ESLint for linting
- Keep components small and focused
- API calls go through a dedicated `api/` module
- Run dev: `cd frontend && npm run android` (or `npm run web` for browser preview)
