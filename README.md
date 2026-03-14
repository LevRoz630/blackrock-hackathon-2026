# SpendPause

Real-time friction layer on card payments that intercepts transactions via Marqeta webhooks and applies behavioural science-backed interventions to combat impulse spending.

## How it works

SpendPause sits between your card and the payment network. Every tap goes through our backend, which decides in under 3 seconds whether to approve, block, or nudge.

Two independent modes run simultaneously:

**Block mode** — auto-declines purchases above a threshold. An adaptive timer (40–90s) forces a cooling-off period before you can approve. The timer gets longer based on transaction amount, override history, time of day, and spending velocity.

**High Risk Environment** — sets a spending budget for a time window. Under budget: brief overlay shows remaining balance. Over budget: hard decline, no override.

## ML features

### Anomaly detection
IsolationForest trained on each user's transaction history. 8-feature vector: amount, hour, day of week, time since last transaction, amount vs average ratio, rolling 1-hour count, rolling 1-hour total, merchant frequency. Produces a 0–100 risk score and flags unusual patterns.

### Auto-mode activation
Analyses historical spending by day of week, hour, and location zone (nightlife, food, shopping, transport). When the current context matches a historically risky pattern, SpendPause auto-activates the appropriate mode.

### Optimal spending ceiling
Instead of users guessing their budget, ML analyses session spending in similar contexts (same day/time/location). Groups transactions into sessions (1-hour gap = new session), takes the 75th percentile of session totals, and sets the ceiling at 85% — nudging savings down gradually, session by session.

### Adaptive timer
The Block mode timer scales from 40s to 90s based on four weighted factors:
- Transaction amount (40%) — bigger purchase, longer wait
- Override history (30%) — frequent overriders get more friction
- Time of day (15%) — late-night purchases (10pm–2am) add seconds
- Spending velocity (15%) — 3+ blocks in one day triggers longer delays

### Mode suggestion engine
Time-of-day grid analysis (7 days x 24 hours) combined with category statistics, velocity patterns, and weekly budget pacing. Returns a suggested mode with confidence score.

## Screens

**Home** — virtual card balance, linked accounts, tonight's budget with real-world units ("~4 drinks left"), smart suggestions from ML, recent transactions

**Settings** — toggle Block/High Risk independently, set thresholds, budgets, time windows, unit labels

**Block prompt** — full-screen, adaptive timer with rotating deliberation prompts showing real stats and TrueLayer context. Late-night tag when applicable.

**Under-budget overlay** — 3-second auto-dismiss flash showing remaining budget

**Over-budget prompt** — hard decline, shows spent-so-far vs budget

**Dashboard** — risk map (merchant locations colour-coded by block rate), weekly budget tracking with nightly breakdown, risk distribution histogram, hourly/daily heatmaps, outlier transactions, spending profile

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

## Research backing

- Dismiss/continue friction is the most effective intervention (d = 0.74, Gruning et al., PNAS 2023)
- 10 seconds of friction reduces impulse actions by 57% (PNAS 2023)
- Adaptive timing outperforms fixed delays by 32.8% (Time2Stop, CHI 2024)
- Friction is 16% more effective than hard lockouts — 62% retention vs 36% (InteractOut, 2024)
- Concrete future costs reduce impulsive choices more than abstract warnings (temporal discounting meta-analysis, PMC 2018)

## Running

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npx expo start
```
