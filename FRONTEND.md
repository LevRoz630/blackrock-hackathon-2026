# Frontend Spec

## 1) Customisation Page (Set Your Rules)

**Goal:** Let the user configure spending controls in one place: time-window limits, single-purchase limits, Think vs Block behaviour, and optional "low-alert" contextual units (e.g., shots).

### Layout

- Title: `Spending Controls`
- Helper text: "Set rules that activate during purchases."
- Three stacked cards (mobile-first):
  - `Spending Window`
  - `Single Purchase Limit`
  - `Modes + Preview`
- Sticky action bar:
  - `Save` (primary)
  - `Cancel` (secondary)

### Card: Spending Window

- Toggle: `Enable spending window`
- Time window:
  - `Next X hours`
  - `This weekend`
  - `Custom (start/end)`
- Spending cap: amount + currency (e.g., `GBP 40`)
- Option: `Ask me on every purchase`
- Live summary copy:
  - "During this window, each purchase shows spend so far and remaining budget."

### Optional: Low-alert contextualisation

- Toggle: `Use a real-world unit when I'm not fully alert`
- Unit name (string): `shots` / `rides` / `coffees`
- Unit value (money per unit): e.g., `GBP 6 per shot`
- Helper copy:
  - "You'll see: 'You have ~2 shots worth of budget left.'"

### Card: Single Purchase Limit

- Toggle: `Enable single purchase limit`
- Limit: amount + currency (e.g., `GBP 100`)
- When exceeded:
  - `Think` (reflection prompt)
  - `Block` (decline)

### Card: Modes + Preview

- Think mode:
  - Reflection prompt + 30 second countdown before proceeding
- Block mode:
  - Decline immediately when a rule is broken

---

## 2) Payment Intercept Page (Auto-appears at Checkout)

**Goal:** A full-screen friction layer that appears during a payment attempt, shows the relevant prompts, and enforces Think/Block based on the user's rules.

### Visual design

- Full-screen overlay with a warning feel:
  - Semi-transparent purple/blue tint (optionally blurred)
- High-contrast sheet/card containing the content
- State styling:
  - `Think` = calmer caution tint
  - `Block` = deeper tint and more assertive typography

### What it shows (dynamic)

- Header: `Pause and check`
- Purchase summary:
  - Merchant (or "Card purchase"), amount, category (if available), timestamp
- Spending window (if enabled):
  - "Spent this window: `GBP X`"
  - "Remaining: `GBP Y`"
  - If low-alert is enabled: "~N units left" (e.g., "~2 shots left")
- Core prompt (Think):
  - "Are you sure you want to make this purchase?"
  - Countdown: "Continue in `30s`"
  - Primary action disabled until countdown ends
- If limit exceeded (Block):
  - "You have exceeded your limit for this window."
  - No proceed option (single clear action like `OK`)
- If single purchase limit is exceeded:
  - Trigger the configured behaviour (`Think` prompt + countdown, or immediate `Block`)
