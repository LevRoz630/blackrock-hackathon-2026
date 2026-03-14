# SpendPause

Real-time friction layer on card payments that intercepts transactions via Marqeta webhooks and applies behavioural science-backed interventions to combat impulse spending.

## How it works

SpendPause sits between your card and the payment network. Every tap goes through our backend, which decides in under 3 seconds whether to approve, block, or nudge.

Two independent modes run simultaneously:

**Block mode** — auto-declines purchases above a threshold. An adaptive timer (40–90s) forces a cooling-off period before you can approve. The timer scales based on transaction amount, override history, time of day, and spending velocity.

**High Risk Environment** — sets a spending budget for a time window. Under budget: brief overlay shows remaining balance. Over budget: hard decline, no override.

## Features

### Screens

| Screen | What it does |
|---|---|
| **Home** | Virtual card with balance, linked accounts carousel, savings streak with pulsing animations, tonight's budget bar, ML-powered mode suggestions with confidence score, transaction feed with blocked badges |
| **Block prompt** | Full-screen adaptive timer (40–90s), rotating deliberation prompts with real stats, risk badge (high/medium/low), late-night tag, haptic feedback, decision latency tracking |
| **Under-budget overlay** | Blurred 3-second auto-dismiss flash showing remaining budget in £ and real-world units ("~3 drinks left") |
| **Over-budget prompt** | Hard decline screen showing spent vs budget, amount over, approve/decline |
| **Settings** | Toggle Block/High Risk independently, set thresholds, budgets, time windows, unit labels, cost per unit |
| **Dashboard** | Risk map, weekly budget tracking with nightly breakdown, risk distribution histogram, hourly + daily heatmaps, outlier transactions, spending profile, top merchants |

### Risk map

Merchant locations in St Andrews colour-coded by block rate. Pulsing red dots for high-risk venues, orange for medium, green for low. Tap for merchant details.

### ML engine

**Anomaly detection** — IsolationForest trained per user on an 8-feature vector: amount, hour, day of week, time since last transaction, amount-vs-average ratio, rolling 1h count, rolling 1h total, merchant frequency. Outputs a 0–100 risk score with human-readable flags.

**Adaptive timer** — scales from 40s to 90s using four weighted factors: transaction amount (40%), override history (30%), time of day (15%), spending velocity (15%).

**Auto-mode activation** — matches current context (day, hour, location zone) against historical spending patterns. When a risky pattern is detected, auto-activates the appropriate mode.

**Optimal spending ceiling** — analyses session spending in similar contexts. Groups transactions into sessions (1h gap = new session), takes the 75th percentile, sets ceiling at 85% — nudging savings down gradually.

**Mode suggestion engine** — 7×24 grid analysis combining category stats, velocity patterns, and weekly budget pacing. Returns a suggested mode with confidence score and recommended budget.

### Backend

- **13 API endpoints** covering webhooks, decisions, settings, insights, dashboard, wallet, savings, risk assessment, mode suggestions, and auto-mode
- **Bypass system** — 5-minute time-limited whitelist scoped to user + amount + merchant for re-tap after approval
- **Full audit trail** — every transaction logged with decision latency, risk score, mode triggered, and user outcome
- **Spending window tracking** — running totals maintained per time window

### Integrations

| Service | Role |
|---|---|
| Marqeta | JIT Gateway — virtual card issuing, real-time webhooks, approve/decline |
| TrueLayer | Read-only bank data powering consequence lines ("£140 left until loan payment") |
| Firebase (FCM) | Push notifications triggering full-screen prompts when app is backgrounded |

## Data-driven automation

The user gives permission once. The app makes better real-time decisions than they can — because it has data they don't have in their head at the point of purchase.

### Auto-calculated safe-to-spend

Users don't set budgets manually. The app computes them from real financial data via TrueLayer Open Banking:

```
safe_to_spend = available_balance
              - upcoming standing orders (exact dates + amounts)
              - predicted direct debits (from last month's pattern)
              - safety buffer
```

Standing orders provide `next_payment_date` and `next_payment_amount`. Direct debits are predicted from `previous_payment_date` and `previous_payment_amount`. The budget updates in real time as obligations are paid or new ones appear.

### MCC-aware friction

Not all spending is equal. Marqeta webhooks include `card_acceptor.mcc` (merchant category code). The system applies different friction levels per category — no friction on groceries (MCC 5411), maximum friction on bars (5813), gambling (7995), and impulse shopping categories. No user configuration needed.

| MCC | Category | Friction |
|---|---|---|
| 5411 | Grocery stores | None |
| 5542 | Petrol stations | None |
| 5812 | Restaurants | Low |
| 5813 | Bars, taverns | High |
| 5921 | Liquor stores | High |
| 7995 | Gambling | Maximum |
| 5691 | Clothing stores | Medium |
| 5732 | Electronics stores | Medium |

### Location-aware auto-activation

Expo Location provides real-time coordinates. Google Places Nearby Search (50m radius) identifies the place type — `bar`, `night_club`, `shopping_mall`, `casino`. When the user walks into a nightlife zone on a Friday night, High Risk mode auto-activates with a computed budget. No user action required.

### Stacked risk scoring

Individual signals are weak. Stacked together, the app knows a decision is bad before the user does. The risk score scales with the number of concurrent signals:

- **Velocity** — 3rd transaction in 45 minutes at bars (Marqeta rolling data)
- **Time** — it's 1am
- **Location** — user is in a nightlife zone (Google Places)
- **Balance** — 60% of safe-to-spend already gone (TrueLayer)
- **Obligations** — rent direct debit hits in 4 days (TrueLayer standing orders)

### Real obligation consequence lines

The block prompt pulls the user's actual next obligation from their bank data:

> "£18 bar tab. Your £95 student loan payment is in 3 days. You'd have £12 left."

Standing orders provide exact upcoming payments with references ("RENT", "LOAN"). Direct debits provide payee names ("STUDENT LOANS COMPANY", "BRITISH GAS"). This is information the user genuinely doesn't have in their head at 1am.

## Research backing

- Dismiss/continue friction is the most effective intervention (d = 0.74, Gruning et al., PNAS 2023)
- 10 seconds of friction reduces impulse actions by 57% (PNAS 2023)
- Adaptive timing outperforms fixed delays by 32.8% (Time2Stop, CHI 2024)
- Friction is 16% more effective than hard lockouts — 62% retention vs 36% (InteractOut, 2024)
- Concrete future costs reduce impulsive choices more than abstract warnings (temporal discounting meta-analysis, PMC 2018)

## Architecture

```
Card tap → Marqeta webhook → FastAPI backend (3s SLA)
                                 ├── Check bypass (5-min whitelist)
                                 ├── Evaluate friction (block / high risk)
                                 ├── ML risk assessment (IsolationForest)
                                 ├── Auto-mode check (time + location)
                                 ├── Log event (full audit trail)
                                 └── FCM push → React Native prompt
```

| Layer | Tech |
|---|---|
| Card issuing + webhooks | Marqeta JIT Gateway |
| Backend | FastAPI, SQLite, scikit-learn |
| Frontend | React Native (Expo) |
| Bank data / context | TrueLayer (read-only) |
| Push notifications | Firebase Cloud Messaging |

## Running

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Seed demo data
cd backend && python seed.py

# Frontend
cd frontend && npm install && npx expo start
```
