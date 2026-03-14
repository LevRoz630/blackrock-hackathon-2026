# Unify docs into SYSTEM.md

Read README.md and RESEARCH.md. Create SYSTEM.md as the single source of truth for product behaviour. Resolve all conflicts between documents using the decisions below. Then update backend code and frontend agent to match.

## Design decisions (locked in)

1. **Two modes: Block and High Risk Environment. Both can be active simultaneously.** They are independent — High Risk Environment tracks a spending window, Block catches big individual purchases. Drop "Think" as a separate mode.

2. **High Risk Environment / Travel — spending window mode.** User sets a budget and a time window. Strict budget — no grace margin. If total exceeds budget by even £0.01, it blocks.
   - **Under budget:** transaction goes through. Brief overlay (auto-dismisses after ~3 seconds) shows remaining budget (e.g. "£18 left of £60 tonight"). No interaction required. Optional: contextualise in real-world units ("~3 drinks left").
   - **Over budget:** transaction is **auto-declined** via Marqeta webhook. Full-screen prompt appears with Approve (whitelist + re-tap) / Decline (keep blocked). No timer.

3. **Block mode — for big individual purchases.** User sets a single-purchase threshold (e.g. £50). Any transaction above it is auto-declined via Marqeta webhook, then a full-screen prompt appears with a 40-second timer. Approve button only available after timer completes. Two buttons: Approve (whitelist + re-tap) / Decline (keep blocked). 24-hour cooldown to disable Block mode.

4. **Prompt design rules:**
   - Two buttons when transaction is blocked. Brief auto-dismiss overlay when under budget.
   - One number, one consequence. Running total + one concrete impact. No walls of text.
   - Visible timer — Block mode only.

5. **Approve = whitelist + re-tap (both modes).** Marqeta can't un-decline a transaction. When user approves, the backend creates a time-limited bypass (user + amount range + merchant, expires after 5 minutes). User taps their card again and the next matching webhook auto-approves, consuming the bypass.

6. **Prompt delivery: Firebase Cloud Messaging (FCM).** Push notification triggers the full-screen prompt on the user's phone. Works when app is backgrounded.

7. **Backend has a lightweight database (SQLite or Postgres).** Stores: user settings (block threshold, high risk environment budget/window), FCM device tokens, active bypasses (whitelist entries), and running totals per spending window. The device is where users configure settings; changes sync to the backend DB so the backend can process Marqeta webhooks within 3 seconds.

8. **TrueLayer — read-only data source.** Connected to user's real bank accounts for context. Powers the "one consequence" line in prompts (e.g. "£140 left until loan payment"). If TrueLayer is not connected, fall back to just showing the transaction amount and budget numbers — no consequence line. Running totals within spending windows come from Marqeta webhooks, not TrueLayer.

9. **Remove from all docs:** escalating delays, conversational/ChatGPT-style prompt idea, "Ask me on every purchase" toggle.

## Output

Create SYSTEM.md with the unified spec. Keep it concise. Include a mode comparison table and updated use cases.

After creating SYSTEM.md, update:
- `backend/app/services/friction.py`, `backend/app/models/schemas.py`, and `backend/app/config.py` to match.
- Add a backend database model (SQLite for MVP) for user settings, FCM tokens, bypasses, and spending window state.
- Add a bypass service: create bypass on approve, check bypass on incoming webhook, expire after 5 minutes.
- `.claude/agents/backend.md` and `.claude/agents/frontend.md` with the unified mode definitions.
- `.claude/agents/tests.md` with updated test cases.
- Scaffold frontend screens in `frontend/`:
  - **Home/Dashboard** — active modes, spending window status, remaining budget, recent transactions
  - **Mode setup** — configure Block threshold and/or High Risk Environment budget + time window + optional real-world unit label. Both can be enabled. Syncs to backend on save.
  - **Block prompt (full screen)** — 40-second countdown timer, transaction details, one contextual line (TrueLayer data if connected, omit otherwise), Approve/Decline buttons (Approve disabled until timer completes)
  - **High Risk Environment overlay (auto-dismiss ~3s)** — under budget: remaining budget, auto-dismisses, no buttons
  - **High Risk Environment prompt (full screen)** — over budget: auto-declined, running total, how much over. Approve (whitelist + re-tap) / Decline (keep blocked). No timer.
- Add navigation between screens (React Navigation).
- Create an `api/` module for backend calls.
