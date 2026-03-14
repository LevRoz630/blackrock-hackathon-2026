# Think Before You Spend
*Product concept note | BlackRock challenge*

---

## Problem

Students make impulsive purchases they later regret. Existing apps track spending after the fact — they do nothing at the moment of decision. The pre-mortem intervention catches users before the damage is done.

---

## Core concept

A friction layer that activates when a user is about to make a significant purchase. The user encounters a short reflective prompt — designed around the behavioural economics concept of the pre-mortem — before the transaction completes. The goal is not to block spending, but to make the decision conscious.

---

## How it works

- **Spending limit:** User sets a card-level limit for a specific context (e.g. nights out) or a time window (e.g. this weekend). Can also be permanent. Default limits suggested by ML based on past behaviour.
- **Trigger:** When a purchase approaches or exceeds the limit, the app intercepts with a 40-second reflection prompt before the transaction is approved. 
- **The prompt:** "You have exceeded the allowed limit.
Are you sure you want to make this purchase?"
- **Contextualisation:** The app shows the real cost in future terms — what this purchase means for your end-of-month balance, your savings goal, or your hourly wage. Visual and specific, not abstract. (Minimal or no info, privacy concerns)

---

## Prompt design

The 40-second duration is a hypothesis to be validated. Research on optimal friction suggests enough time to engage System 2 thinking without becoming dismissible. To be tested via interview study and a/b testing against shorter and longer windows. A ChatGPT-style conversational format may outperform a static prompt.

---

## Two modes

- **Think:** User sees the prompt and can choose to proceed or pause. Soft friction.
- **Block:** Purchase is held until the user completes the reflection. Hard friction. User opts in to this mode for higher accountability.

---

## ML angle

Predictive model sets personalised default limits based on spending history, time of week, and category. Surfaces patterns the user has not noticed (e.g. Friday night spend consistently 3x weekly average). For MVP, replace with simple stats: median spend by category and day.

---

## Implementation (MVP)

- **Frontend:** Hard-coded UI. User sets limit, enters purchase manually, receives prompt. No bank integration required to prove the concept.
- **Backend:** Hard-coded logic. Simple threshold check triggers the pre-mortem flow. Static contextual stats (category averages).
- **Phase 2:** TrueLayer or Plaid integration for real transaction interception. ML model for personalised limits.

---

## Technical architecture: Marqeta + JIT funding

Real-time interception is possible using Marqeta's virtual card platform. Marqeta issues the user a virtual card and sits in the authorisation flow between the merchant and the card network. The key mechanism is JIT (Just-in-Time) Gateway funding: when a transaction is attempted, Marqeta fires a webhook to our server before approving it. Our server then decides whether to approve or decline based on the user's limit settings and triggers the pre-mortem prompt.

**Flow:**
1. User taps virtual card at a merchant
2. Marqeta receives the authorisation request from Visa/Mastercard
3. Marqeta fires a webhook to our server in real time
4. Server checks: does this hit the user's limit? If yes, push notification fires with the pre-mortem prompt
5. User responds in app. Server sends approve or decline back to Marqeta
6. Transaction completes or is held

**Constraint:** Marqeta allows 3 seconds for the authorisation decision. For a hard block this requires the user to have pre-enabled 'hold mode'. For most users the softer version fires the prompt immediately post-transaction — still valuable as a reflection tool even if not a literal gate.

---

## Use case scenario

It is Friday night. A student has set a £40 night-out limit for the weekend. They are at a bar and tap their virtual card for a £45 round of drinks.

Marqeta intercepts the transaction and fires a webhook.
The app sends a push notification: "You are £5 over your night-out limit. 

- Think mode: 
Are you sure?" Upon the completion of waiting period, two buttons are activated: Approve anyway / Cancel.

- Block mode: 
Nothing happens, transaction blocjks 



Below the prompt the app shows: "This takes your total spend tonight to £45.".

**Sandbox:** Marqeta's sandbox is free, available immediately on sign-up, and supports full transaction simulation including webhooks. The entire demo flow above can be built and shown without any live bank connection or regulatory approval.

---

## Open questions

- What is the optimal friction duration? (Interview + a/b test)
- Conversational (ChatGPT-style) vs static prompt: which converts better?
- Does showing future cost (savings impact) or peer comparison discourage spend more effectively?
- Should limits be self-set, ML-suggested, or both?
