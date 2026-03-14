# System Overview

Three modes, one card. The mode determines how the app responds when a transaction hits a user's spending limit.

---

## Modes

### 1. Everyday — low friction, always on

For normal daily spending. Lightweight nudge that keeps the user aware without getting in the way.

- **When it fires:** Transaction exceeds the user's daily or category limit.
- **What happens:** Push notification with a 10-second reflection prompt. Timer counts down, then two buttons activate: **Continue** / **Cancel**.
- **Friction level:** Light. The purchase goes through by default if the user ignores the prompt.
- **Prompt example:** "You've spent £32 on food today — £12 over your usual. Continue?"
- **Escalation:** Each additional overspend in the same day adds 5 seconds to the next prompt (10s → 15s → 20s). Mirrors ScreenZen's escalating friction pattern.

**Why this works:** 10 seconds is enough to cause 36% abandonment of impulsive actions (PNAS 2023). Escalation penalises repeated overspending without punishing the first one.

---

### 2. Block — hard friction, opt-in

For users who want real accountability. The transaction does not go through until the user actively engages.

- **When it fires:** Any transaction while Block mode is active.
- **What happens:** Transaction is held. The app presents a 40-second reflection screen. The user cannot approve until the timer completes. After 40 seconds: **Approve** / **Decline**.
- **Friction level:** Hard. No transaction goes through without completing the reflection.
- **Prompt example:** "£28 at ASOS. In 6 months, is this something you're glad you bought — or something you forgot about?"
- **Cooldown to disable:** Turning off Block mode requires a 24-hour cooldown period. Prevents impulsive disabling.

**Why this works:** 40 seconds sits in the validated range for System 2 activation (CRT study, 2024). The 24-hour cooldown to disable mirrors Monzo's gambling block design — fewer than 10% of users ever removed theirs.

---

### 3. Night Out / Event — context-aware, time-boxed

For high-spend periods the user knows about in advance: nights out, holidays, trips, festivals. The user sets a budget and a time window. The mode activates and deactivates automatically.

- **When it fires:** Transaction exceeds the event budget, or cumulative spend during the window crosses the limit.
- **What happens:** 30-second prompt with a running total and projected impact. Two buttons after timer: **Approve** / **I'm done for tonight**.
- **Friction level:** Medium. Firm enough to pause a drunk purchase, short enough to not be embarrassing at a till.
- **Setup:** User sets budget (e.g. £60), start time (e.g. Friday 8pm), end time (e.g. Saturday 3am). Can also be open-ended ("until I turn it off").
- **Prompt example:** "That's £67 tonight — £7 over your £60 limit. At this pace you'll spend £95 by closing time. You've got £140 left until your next loan payment."
- **Escalation:** After the third prompt in the same event window, delay extends to 45 seconds and the prompt becomes more direct.

**Why this works:** Concrete future cost framing ("£140 left until loan payment") outperforms abstract warnings (temporal discounting meta-analysis, PMC 2018). The escalation within a single event session targets the pattern where spending accelerates as the night goes on.

---

## Prompt design principles (all modes)

These apply across all three modes, grounded in the research.

1. **Binary choice is mandatory.** Every prompt ends with two buttons. The dismiss/continue choice is the most powerful intervention component — more than the delay itself (d = 0.74).
2. **Concrete numbers, not lectures.** Show running total, remaining budget, and impact on next milestone (loan payment, savings goal, end-of-month balance). Calendar dates beat abstract durations.
3. **The UI must feel intentional.** In fintech, unexplained delays read as system errors. The prompt screen loads instantly with clear framing — a visible timer, the purchase amount, and the merchant name.
4. **Vary the prompt.** Rotate between reflection questions, future-cost framing, and spending stats to combat habituation. Same prompt every time becomes a speed bump users stop reading.

---

## Use cases

### Everyday mode

> **Monday lunch.** A student's daily food limit is £15. They tap their card for a £18 meal deal + coffee. A push notification appears: "£18 on food — £3 over your daily limit. You've spent £62 on food this week." 10-second timer, then Continue / Cancel. They glance at it, decide the coffee was unnecessary, hit Cancel. Total friction: 10 seconds.

> **Online shopping.** A student browses ASOS at 11pm. They add a £35 jacket to cart and pay with the virtual card. Notification: "£35 at ASOS — that's £48 on clothes this month, double your usual." 10-second timer. They think about it, hit Continue. Next purchase triggers a 15-second prompt.

### Block mode

> **Saving for a trip.** A student turns on Block mode for the month to build savings. Every transaction triggers a 40-second reflection screen. Most small purchases (coffee, snacks) get declined after the pause. Essentials (groceries, transport) get approved. At the end of the month they've saved £180 more than usual. They can't turn Block off on impulse — 24-hour cooldown.

### Night Out mode

> **Friday night.** A student sets a £60 budget, 8pm to 3am. First two rounds go through under budget — no friction. Third purchase puts them at £67. The app fires: "£67 tonight. £7 over your £60 limit. You've got £140 until your next loan payment." 30-second timer. They put the round on a friend instead. At 1am, after three prompts, the delay extends to 45 seconds: "You've spent £82 tonight. That's your entire weekly food budget."

> **Holiday.** A student sets a £200 budget for a 4-day trip to Barcelona. The mode runs continuously. On day 2 they've spent £130. The next purchase triggers: "£130 of £200 spent with 2 days left. That's £65/day — you'll overshoot by £60 at this rate." They skip the tourist-trap restaurant and find somewhere cheaper.

---

## Mode comparison

| | Everyday | Block | Night Out |
|---|---|---|---|
| **Default state** | Always on | Opt-in | Scheduled |
| **Initial delay** | 10 seconds | 40 seconds | 30 seconds |
| **Escalation** | +5s per repeat overspend/day | Fixed 40s | +15s after 3rd prompt in window |
| **If ignored** | Transaction approved | Transaction held | Transaction held |
| **Disable** | Toggle off instantly | 24-hour cooldown | Runs until window ends |
| **Best for** | Daily awareness | Saving periods, high discipline | Nights out, trips, festivals |
