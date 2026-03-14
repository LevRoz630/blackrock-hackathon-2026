# Unify SYSTEM.md and RESEARCH.md

Read SYSTEM.md and RESEARCH.md. Rewrite SYSTEM.md as the single source of truth, resolving all conflicts between the two documents.

## Design decisions (locked in)

1. **Two modes: Block and Night Out.** Drop "Think" — it's the same as Block.

2. **Night Out/Travel- High spend risk — informational, but with a wait.** When the user is in a spending window and goes over budget, the transaction is held. The app shows what's remaining (e.g. "£12 left of £60 tonight") Two buttons: Approve / Decline. The user sees a running total and remaining budget. Optional: contextualise in real-world units the user defined ("~2 drinks left"). Under budget = no friction, transaction goes straight through.

3. **Block mode — for big individual purchases.** User sets a single-purchase threshold (e.g. £50). Any transaction above it is held with a 40-second timer and two buttons: Approve / Decline. 24-hour cooldown to disable. This is active friction — the purchase doesn't go through until the user decides.

4. **Prompt design rules stay:**
   - Two buttons, always.
   - One number, one consequence.
   - Visible timer (Block mode only).

5. **TrueLayer — data source only (for now).** Connect to user's real bank accounts via TrueLayer API as a read-only data source. For MVP, just get it connected and pulling balances/transaction history. This data powers the contextualisation in prompts — e.g. "£140 left until loan payment". Running totals within spending windows come from Marqeta webhooks, not TrueLayer.

6. **Remove:** escalating delays (no 45s after 3rd prompt), conversational/ChatGPT-style prompt idea.

## Output

Rewrite SYSTEM.md with the unified spec. Keep it concise — same style as current SYSTEM.md. Update the mode comparison table. Update use cases to match.

After updating SYSTEM.md, update `backend/app/services/friction.py`, `backend/app/models/schemas.py`, and `backend/app/config.py` to match the new spec (Night Out returns info only with no delay, Block only triggers above threshold).

Then update the frontend to match:
- Update `.claude/agents/frontend.md` with the unified mode definitions.
- Scaffold the following screens in `frontend/`:
  - **Home/Dashboard** — current mode (Block / Night Out), active spending window if any, recent transactions
  - **Mode setup** — pick Block or Night Out. Block: set single-purchase threshold. Night Out: set budget + time window, optional real-world unit label.
  - **Block prompt** — 40-second countdown timer, transaction details, one contextual line (TrueLayer data), Approve/Decline buttons (disabled until timer completes)
  - **Night Out prompt (full screen)** — over-budget alert as a full-screen takeover (not just a notification). Shows running total and remaining budget. Approve/Decline.
- Add navigation between screens (React Navigation).
- Create an `api/` module for backend calls (`/webhooks/marqeta`, `/transactions/decide`).
