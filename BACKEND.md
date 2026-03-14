# BACKEND.md

## Product Simulation Overview

This app is a **visual payment simulation**, not a real banking product.  
No real card, wallet, or payment integration is required.

When the app opens, the main screen should show a **mock card** at the top with an **artificial balance**.  
This card is only a visual placeholder to make the demo feel like a real fintech app.

Example card data:
- Card name
- Fake card number mask
- Artificial balance
- Optional gradient / premium visual styling

---

## Core Logic

The app has **two modes**.

### 1. Block Mode

In this mode, the user sets a **single-purchase limit**.

Example:
- "Block any purchase above £25"

Behaviour:
- if the simulated purchase amount is **less than or equal to** the limit, it is approved immediately
- if the simulated purchase amount is **greater than** the limit, the app opens a blocking screen for **10 seconds**
- after the timer ends, the user can choose:
  - **Approve**
  - **Decline**

The goal of this mode is to slow down impulsive larger purchases.

---

### 2. Budget Window Mode

In this mode, the user sets:
- a **maximum total amount**
- a **time period**

Example:
- "Do not let me spend more than £60 this evening"
- "Do not let me spend more than £150 this weekend"

Behaviour:
- the app tracks the total simulated spend within the selected time window
- every new purchase checks the running total
- when the user makes a purchase, the app opens an intercept screen for **10 seconds**
- the intercept screen shows:
  - current purchase amount
  - total spent in the current period
  - remaining budget
  - time left in the period
  - optional warning if the new purchase exceeds the target budget

After the timer ends, the user can choose:
- **Approve**
- **I'm done** / **Cancel**

This mode is meant to create friction during a spending session, such as a night out or a trip.

---

## Main UI Requirements

### Home Screen

The app should look polished and modern.

Top section:
- large simulated bank card
- artificial balance
- fake card details
- attractive fintech-style design

Below the card:
- mode selector
  - `Block Mode`
  - `Budget Window Mode`

Below that:
- settings form for the selected mode
- simulated purchase input
- purchase history or running total summary

---

## Intercept Screen

When a purchase is triggered, a full-screen overlay should appear.

This screen should look intentional and stylish, not like an error.

It should show:
- merchant name or "Card purchase"
- purchase amount
- current mode
- timer countdown (`10s`)
- summary information

### In Block Mode
Show:
- single purchase limit
- whether this purchase exceeded it

### In Budget Window Mode
Show:
- total spent in this period
- remaining budget
- period end or time remaining
- whether this purchase pushes the user over the limit

Buttons become active only after the countdown ends.

---

## Backend Responsibilities

The backend is only for simulation logic.

It should:

1. store the current fake balance
2. store the selected mode
3. store the user’s limits
4. store the active budget window
5. store simulated transactions
6. decide whether a purchase:
   - is approved immediately
   - opens the 10-second intercept screen
   - is declined

---

## Suggested Backend State

The backend should keep:

- `fakeBalance`
- `mode`
- `singlePurchaseLimit`
- `windowBudget`
- `windowStart`
- `windowEnd`
- `transactions[]`

---

## Purchase Evaluation Rules

### Block Mode
- if `purchaseAmount <= singlePurchaseLimit` → approve
- if `purchaseAmount > singlePurchaseLimit` → show 10-second block screen

### Budget Window Mode
- calculate total spend in active window
- calculate projected total after new purchase
- always show 10-second intercept screen for each purchase in this mode
- display:
  - spent so far
  - remaining budget
  - projected remaining budget after this purchase

---

## Important Note

This is a **simulation-only MVP**.

The app should feel like a real fintech product, but:
- no real card is required
- no Google Pay is required
- no bank connection is required
- no payment processor is required

The goal is to make the experience **beautiful, believable, and demo-ready**.