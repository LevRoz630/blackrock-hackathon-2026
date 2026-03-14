# SpendZen — Functionality Writeup

## What it does

SpendZen is a friction layer that intercepts card transactions in real time via Marqeta webhooks. It forces a pause between impulse and action — backed by behavioural science showing that even brief delays shift decision-making from the emotional brain to the rational one.

Two independent modes can run simultaneously: **Block** and **High Risk Environment**.

---

## Screens

### Home
- Shows remaining budget (if High Risk Environment is active) with a progress bar
- Contextualises remaining budget in real-world units (e.g. "7 drinks left")
- Lists recent transactions
- Quick access to mode settings
- Demo buttons to simulate all three intervention types

### Settings (Mode Setup)
- Toggle Block mode on/off, set single-purchase threshold
- Toggle High Risk Environment on/off, set budget, time window, and optional unit label/cost
- Syncs to backend so webhooks can enforce rules within Marqeta's 3-second budget

### Block Prompt (adaptive timer)
- Full-screen intervention shown when a transaction exceeds the threshold
- **Adaptive cooling-off timer** (40–90s) computed from four factors:
  - **Transaction amount** (40% weight) — larger purchases get longer waits
  - **Override history** (30%) — users who frequently override get more friction
  - **Time of day** (15%) — late-night purchases (10pm–2am) add extra seconds
  - **Spending velocity** (15%) — 3+ blocks in one day trigger longer delays
- During the wait, rotating deliberation prompts show real stats:
  - "This is 1665% of your total budget"
  - "You have £42.00 left this window"
  - "3 transactions blocked today"
  - "You've overridden 7 blocks this month"
  - "Will you still want this tomorrow morning?"
  - TrueLayer context line (e.g. "£140 left until loan payment on Mar 28")
- Late-night tag shown when applicable
- OK button is disabled until the timer completes — no way to approve, only dismiss
- Records decision latency for analytics

### High Risk Overlay (under budget)
- Brief overlay that auto-dismisses after 3 seconds
- Shows remaining budget and optional real-world units ("~3 drinks left")
- No user interaction required — transaction goes through

### High Risk Prompt (over budget)
- Full-screen intervention when cumulative spend exceeds the window budget
- Shows spent-so-far and amount over budget
- Transaction is auto-declined, no approve option — only an OK dismiss button
- Records decision latency for analytics

---

## Use Cases

### 1. Friday Night Out — Under Budget
**Persona:** Second-year student, £60 budget set for 4 hours out.

The student taps their card for a £12 round at the pub. The transaction goes through. A brief overlay flashes: "£48 left of £60 (~4 drinks left)" and disappears after 3 seconds. No friction — just awareness.

Two rounds later (£15 each), the overlay shows "£18 left (~1 drink left)." The shrinking number makes the budget feel real.

### 2. Friday Night Out — Over Budget
**Persona:** Same student, now at £63 total.

They try to buy another £18 round. Auto-declined. Full-screen prompt: "£18 over your £60 budget tonight." Shows £78 spent vs £60 budget. Only option is OK — they can't override. The budget is a hard wall.

### 3. Impulse Electronics Purchase — Block Mode
**Persona:** Student with Block mode on, £50 threshold. Payday just hit.

They tap their card for £999 headphones at the Apple Store. Auto-declined. Full-screen prompt appears with a 62-second adaptive timer (high amount drives it above the 40s base). The screen shows:

- "£999.00 — Apple Store"
- Rotating prompts: "This is 1665% of your total budget" → "£140 left until loan payment on Mar 28" → "Will you still want this tomorrow morning?"

They can't dismiss until the timer finishes. By then, the impulse has faded. They tap OK and walk away.

### 4. Late-Night Impulse — Block Mode
**Persona:** Student browsing Amazon at 1am, Block threshold £50.

They try to buy a £120 gadget. Auto-declined. The prompt appears with a "Late-night purchase" tag and a longer timer (late-night factor adds ~4 seconds). The combination of the tag, the wait, and "Will you still want this tomorrow morning?" is enough. They close the app.

### 5. Repeat Offender — Escalating Friction
**Persona:** Student who has overridden 8 blocks this month, 3 blocks already today.

They try a £150 purchase. The adaptive timer computes to ~82 seconds (high amount + high override history + high velocity). The prompt shows "You've overridden 8 blocks this month" and "3 transactions blocked today." The escalating friction makes repeated impulsive spending progressively harder.

### 6. Both Modes Active
**Persona:** Block threshold £50, High Risk Environment £80 for tonight. Student tries a £65 item.

Triggers both modes (above £50 threshold AND would push total over £80). Block takes priority — the adaptive timer fires. After dismissal, the over-budget screen also shows if the cumulative total exceeds the window budget.

### 7. Small Intentional Purchase — No Friction
**Persona:** Student with Block threshold £50, buying a £3.50 coffee.

Transaction goes through instantly. If High Risk Environment is active, the brief overlay shows remaining budget. Otherwise, nothing happens. SpendZen stays invisible for normal spending.

---

## Adaptive Timer Formula

```
base = 40 seconds

amount_factor    = min(transaction_amount / 200, 1.0)     // 0–1
override_factor  = min(overrides_last_30_days / 10, 1.0)  // 0–1
time_factor      = is_late_night(22:00–02:00) ? 0.5 : 0   // 0 or 0.5
velocity_factor  = blocks_today > 2 ? 0.5 : 0             // 0 or 0.5

bonus = 50 × (0.4 × amount + 0.3 × override + 0.15 × time + 0.15 × velocity)

wait = clamp(base + bonus, 40, 90) seconds
```

| Scenario | Amount | Overrides | Late night | Blocks today | Wait |
|---|---|---|---|---|---|
| Small purchase, clean history | £60 | 0 | No | 0 | 46s |
| Large purchase, daytime | £200 | 2 | No | 1 | 63s |
| Large purchase, late night, repeat offender | £200 | 8 | Yes | 4 | 85s |
| Max friction | £200+ | 10+ | Yes | 3+ | 90s |

---

## Research Backing

- **The dismiss/continue choice** is the most powerful friction component (d = 0.74) — more than the delay itself (Gruning et al., PNAS 2023)
- **10 seconds** of friction reduces impulse actions by 57% (one sec / PNAS 2023)
- **40 seconds** sits in the productive middle between 30s (borderline System 2) and 60s (full deliberation) (CRT study, 2024)
- **Adaptive timing outperforms fixed by 32.8%** (Time2Stop, CHI 2024)
- **Friction is 16% more effective than hard lockouts** — 62% of users keep friction tools active vs 36% for lockouts (InteractOut, 2024)
- **Concrete future costs** reduce impulsive choices more than abstract warnings (temporal discounting meta-analysis, PMC 2018)
- **Late-night decisions** have higher regret rates due to ego depletion and decision fatigue

---

## Technical Stack

| Layer | Technology |
|---|---|
| Card issuing + webhooks | Marqeta (JIT Gateway funding) |
| Backend | FastAPI + SQLite |
| Frontend | React Native (Expo) |
| Bank data (context lines) | TrueLayer (read-only) |
| Push notifications | Firebase Cloud Messaging |
