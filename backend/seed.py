#!/usr/bin/env python3
"""Seed tbys.db with 50+ realistic transactions for demo-user over 14 days."""

import sqlite3
import random
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "tbys.db"

random.seed(42)

BASE_DATE = datetime(2026, 3, 1, 10, 0, 0)

WEEKDAY_LUNCH = [
    ("Pret A Manger", "food_and_drink", 4.20, 6.80),
    ("Tesco Express", "grocery", 3.50, 12.00),
    ("Greggs", "food_and_drink", 2.80, 5.50),
    ("Costa Coffee", "food_and_drink", 3.00, 5.50),
    ("Boots", "pharmacy", 2.50, 8.00),
    ("Sainsbury's Local", "grocery", 4.00, 15.00),
]

BAR_MERCHANTS = [
    ("Wetherspoons", "bars_and_pubs", 8.00, 28.00),
    ("The Crown", "bars_and_pubs", 10.00, 35.00),
    ("All Bar One", "bars_and_pubs", 12.00, 30.00),
    ("BrewDog", "bars_and_pubs", 9.00, 25.00),
]

OUTLIERS = [
    ("Currys", "electronics", 89.99),
    ("Zara", "clothing", 64.50),
    ("ASOS", "clothing", 47.99),
]

TRANSPORT = [
    ("TfL", "transport", 2.80, 6.50),
    ("Uber", "transport", 8.00, 22.00),
]


def generate_transactions():
    txns = []

    for day_offset in range(14):
        date = BASE_DATE + timedelta(days=day_offset)
        dow = date.weekday()

        if dow < 5:
            lunch_hour = random.randint(11, 13)
            lunch_min = random.randint(0, 55)
            merchant, cat, lo, hi = random.choice(WEEKDAY_LUNCH)
            amount = round(random.uniform(lo, hi), 2)
            ts = date.replace(hour=lunch_hour, minute=lunch_min)
            txns.append((ts, amount, merchant, cat, False, None))

            if random.random() < 0.5:
                m2, c2, l2, h2 = random.choice(WEEKDAY_LUNCH)
                ts2 = date.replace(hour=random.randint(7, 9), minute=random.randint(0, 55))
                txns.append((ts2, round(random.uniform(l2, h2), 2), m2, c2, False, None))

            if random.random() < 0.4:
                m3, c3, l3, h3 = random.choice(TRANSPORT)
                ts3 = date.replace(hour=random.randint(17, 19), minute=random.randint(0, 55))
                txns.append((ts3, round(random.uniform(l3, h3), 2), m3, c3, False, None))

        if dow in (4, 5, 6):
            n_bar = random.randint(2, 5)
            start_hour = random.randint(18, 21)
            for j in range(n_bar):
                merchant, cat, lo, hi = random.choice(BAR_MERCHANTS)
                amount = round(random.uniform(lo, hi), 2)
                ts = date.replace(
                    hour=min(23, start_hour + j),
                    minute=random.randint(0, 55),
                )
                was_blocked = amount > 20 or j >= 3
                decision = None
                if was_blocked:
                    decision = "approved" if random.random() < 0.4 else "declined"
                txns.append((ts, amount, merchant, cat, was_blocked, decision))

    outlier_days = random.sample(range(14), min(3, len(OUTLIERS)))
    for i, day_offset in enumerate(outlier_days):
        date = BASE_DATE + timedelta(days=day_offset)
        merchant, cat, amount = OUTLIERS[i]
        ts = date.replace(hour=random.randint(14, 17), minute=random.randint(0, 55))
        txns.append((ts, amount, merchant, cat, True, "approved"))

    txns.sort(key=lambda t: t[0])
    return txns


def compute_risk_score(amount, hour, was_blocked):
    score = 10
    if amount > 30:
        score += 25
    elif amount > 15:
        score += 10
    if hour >= 21 or hour < 5:
        score += 20
    if was_blocked:
        score += 15
    score += random.randint(-5, 10)
    return max(0, min(100, score))


def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("DELETE FROM transaction_events WHERE user_id = 'demo-user'")
    c.execute("DELETE FROM user_settings WHERE user_id = 'demo-user'")

    c.execute("""
        INSERT OR REPLACE INTO user_settings
        (user_id, block_threshold, high_risk_budget, high_risk_window_start,
         high_risk_window_end, real_world_unit_name, real_world_unit_value)
        VALUES ('demo-user', 50, 60, '18:00', '02:00', 'drinks', 6)
    """)

    txns = generate_transactions()
    for i, (ts, amount, merchant, category, was_blocked, decision) in enumerate(txns):
        risk = compute_risk_score(amount, ts.hour, was_blocked)
        is_outlier = 1 if amount > 40 else 0
        mode = "block" if was_blocked else None
        latency = random.randint(3000, 45000) if decision else None

        c.execute("""
            INSERT INTO transaction_events
            (user_id, transaction_token, timestamp, amount, merchant_name,
             merchant_category, mode_triggered, was_blocked, user_decision,
             decision_latency_ms, risk_score, is_outlier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "demo-user",
            f"tok-seed-{i:03d}",
            ts.isoformat(),
            amount,
            merchant,
            category,
            mode,
            1 if was_blocked else 0,
            decision,
            latency,
            risk,
            is_outlier,
        ))

    conn.commit()

    count = c.execute(
        "SELECT COUNT(*) FROM transaction_events WHERE user_id='demo-user'"
    ).fetchone()[0]
    blocked = c.execute(
        "SELECT COUNT(*) FROM transaction_events WHERE user_id='demo-user' AND was_blocked=1"
    ).fetchone()[0]
    overrides = c.execute(
        "SELECT COUNT(*) FROM transaction_events WHERE user_id='demo-user' AND user_decision='approved'"
    ).fetchone()[0]

    print(f"Seeded {count} transactions for demo-user")
    print(f"  Blocked: {blocked}, Overrides: {overrides}")
    print(f"  Override rate: {overrides/blocked*100:.0f}%" if blocked else "  No blocks")

    conn.close()


if __name__ == "__main__":
    main()
