# SYSTEM — Think Before You Spend

Single source of truth for product behaviour.

---

## Overview

A friction layer on top of Marqeta virtual cards that intercepts transactions in real time. Two independent modes — **Block** and **High Risk Environment** — can run simultaneously.

**Transaction flow:** User taps card -> Marqeta fires webhook to our server (3s budget) -> server checks modes -> approve or auto-decline -> if declined, push prompt via FCM -> user decides -> if approved, bypass created for re-tap.

---

## Modes

### Block

Hard friction for large individual purchases.

- User sets a **single-purchase threshold** (e.g. £50).
- Any transaction above it is **auto-declined** via Marqeta webhook.
- Full-screen prompt appears with a **40-second countdown timer**.
- Approve button is **disabled until timer completes**.
- Two buttons: **Approve** (whitelist + re-tap) / **Decline** (keep blocked).
- **24-hour cooldown** to disable Block mode (prevents impulsive disabling).

### High Risk Environment

Spending window with a strict budget.

- User sets a **budget** and a **time window** (e.g. £60 for 3 hours).
- Strict budget — no grace margin. Exceeding by even £0.01 triggers a block.
- Running total tracked from Marqeta webhooks (not TrueLayer).

**Under budget:** Transaction goes through. Brief overlay auto-dismisses after ~3 seconds showing remaining budget (e.g. "£18 left of £60 tonight"). No user interaction required. Optional: contextualise in real-world units ("~3 drinks left") using a user-defined label.

**Over budget:** Transaction is auto-declined. Full-screen prompt with Approve / Decline. **No timer** (unlike Block mode).

---

## Mode Comparison

| | Block | High Risk Environment |
|---|---|---|
| **Trigger** | Single purchase > threshold | Cumulative spend exceeds window budget |
| **Auto-decline** | Yes | Only when over budget |
| **Timer** | 40s countdown (Approve disabled until done) | None |
| **Prompt type** | Full-screen | Under budget: auto-dismiss overlay (~3s). Over budget: full-screen |
| **Buttons** | Approve / Decline | Over budget: Approve / Decline. Under budget: none |
| **Contextual line** | TrueLayer data if connected | Remaining budget + optional real-world units |
| **Disable cooldown** | 24 hours | None |
| **Can run together** | Yes | Yes |

---

## Approve Flow (Both Modes)

Marqeta cannot un-decline a transaction. When the user taps Approve:

1. Backend creates a **time-limited bypass** — scoped to user + amount range + merchant.
2. Bypass expires after **5 minutes**.
3. User re-taps their card.
4. Next matching webhook auto-approves and **consumes** the bypass.

---

## Prompt Design Rules

- **Two buttons** when a transaction is blocked. Auto-dismiss overlay (no buttons) when under budget.
- **One number, one consequence.** Running total + one concrete impact line. No walls of text.
- **Visible timer** — Block mode only.
- Consequence line powered by TrueLayer (e.g. "£140 left until loan payment"). If TrueLayer is not connected, show only the transaction amount and budget numbers — omit the consequence line.

---

## Prompt Delivery

Firebase Cloud Messaging (FCM). Push notification triggers the full-screen prompt on the user's phone. Works when the app is backgrounded.

---

## Backend

- **Database:** SQLite (MVP). Stores:
  - User settings (block threshold, high risk environment budget/window)
  - FCM device tokens
  - Active bypasses (whitelist entries)
  - Running totals per spending window
- **Settings sync:** User configures on device, changes sync to backend DB so webhooks can be processed within 3 seconds.
- **Bypass service:** Create on approve, check on incoming webhook, expire after 5 minutes.

---

## TrueLayer Integration

Read-only data source connected to the user's real bank accounts.

- Powers the "one consequence" line in prompts (e.g. "£140 left until loan payment").
- **Not used for running totals** — those come from Marqeta webhooks.
- If not connected, fall back to just showing transaction amount and budget numbers.

---

## Use Cases

### 1. Friday Night Out (High Risk Environment)

A student sets a £60 budget for the next 4 hours. They go to a bar.

- **First round (£12):** Transaction approved. Overlay flashes: "£48 left of £60 (~4 drinks left)." Auto-dismisses.
- **Second round (£15):** Transaction approved. Overlay: "£33 left (~2 drinks left)."
- **Fourth round (£18, total now £63):** Auto-declined. Full-screen prompt: "£3 over your £60 budget tonight." Approve / Decline.

### 2. Impulse Electronics Purchase (Block)

A student has Block mode on with a £50 threshold. They tap their card for a £90 pair of headphones.

- Transaction auto-declined. Full-screen prompt with 40-second timer. Shows: "£90 headphones. £140 left until loan payment on March 30th." (TrueLayer data). Approve button activates after timer. Student reconsiders and taps Decline.

### 3. Both Modes Active

Block threshold is £50. High Risk Environment is £80 for tonight. Student tries to buy a £65 item.

- Triggers **both** modes (above £50 threshold AND it would push total over £80).
- Block takes priority — 40-second timer applies.
- Prompt shows both: over single-purchase threshold and over budget.

### 4. TrueLayer Not Connected

Same as use case 2 but without TrueLayer. Prompt shows: "£90 headphones." No consequence line. Timer still runs.

---

## Explicitly Removed

The following are **not** part of the product:

- Escalating delays
- Conversational / ChatGPT-style prompts
- "Ask me on every purchase" toggle
- Think mode (replaced by Block + High Risk Environment)
- ML-suggested limits (MVP uses manual settings only)
