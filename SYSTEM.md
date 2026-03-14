# System Overview

Two modes, one card.

---

## Modes

### 1. Block

User opts in. Every transaction is held until a 40-second reflection completes. Two buttons after timer: **Approve** / **Decline**. 24-hour cooldown to disable — prevents impulsive switch-off.

### 2. Night Out / Event

User sets a budget and a time window (e.g. £60, Friday 8pm–3am). No friction while under budget. Once the limit is crossed, each transaction triggers a 30-second hold with running total and two buttons: **Approve** / **I'm done**. After the 3rd prompt in the same window, delay extends to 45 seconds.

---

## Prompt design

1. **Two buttons, always.** The binary choice is the most effective component — more than the delay itself.
2. **One number, one consequence.** Running total + one concrete impact ("£140 left until loan payment"). No walls of text.
3. **Visible timer.** The delay must look intentional, not broken.

---

## Use cases

### Block

> A student turns on Block for the month to save. Every tap triggers the 40-second screen. Coffee and impulse buys get declined after the pause. Groceries get approved. They save £180 more than usual.

### Night Out

> Friday night, £60 budget. First two rounds go through — under limit, no friction. Third purchase crosses £60. The app fires: "£67 tonight. £140 left until loan payment." 30-second hold. They put the round on a friend.

### Holiday

> £200 budget, 4-day trip. On day 2 they've spent £130. Next purchase triggers: "£130 of £200, 2 days left." They find somewhere cheaper.

---

## Mode comparison

| | Block | Night Out |
|---|---|---|
| **Delay** | 40s | 30s (45s after 3rd prompt) |
| **Fires when** | Every transaction | Over budget only |
| **Disable** | 24-hour cooldown | Runs until window ends |
