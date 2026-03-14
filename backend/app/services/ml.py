from __future__ import annotations

import math
from datetime import datetime, timezone
from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import IsolationForest

from app.db import get_db

MIN_HISTORY = 10


@dataclass
class TransactionFeatures:
    amount: float
    hour: int
    day_of_week: int
    minutes_since_last: float
    amount_vs_avg_ratio: float
    rolling_1h_count: int
    rolling_1h_total: float
    merchant_frequency: int


@dataclass
class RiskAssessment:
    risk_score: int
    is_outlier: bool
    anomaly_score: float
    flags: list[str]
    features: dict


def _extract_features_from_rows(
    rows: list[tuple],
    merchant_counts: dict[str, int],
) -> list[list[float]]:
    features = []
    for i, row in enumerate(rows):
        amount = row[0]
        ts = datetime.fromisoformat(row[1])
        merchant = row[2] or ""

        hour = ts.hour
        dow = ts.weekday()

        if i > 0:
            prev_ts = datetime.fromisoformat(rows[i - 1][1])
            delta = (ts - prev_ts).total_seconds() / 60.0
        else:
            delta = 1440.0

        amounts_so_far = [r[0] for r in rows[:i + 1]]
        avg = sum(amounts_so_far) / len(amounts_so_far)
        ratio = amount / avg if avg > 0 else 1.0

        one_hour_ago = ts.timestamp() - 3600
        recent = [
            r for r in rows[:i + 1]
            if datetime.fromisoformat(r[1]).timestamp() > one_hour_ago
        ]
        rolling_count = len(recent)
        rolling_total = sum(r[0] for r in recent)

        merch_freq = merchant_counts.get(merchant, 0)

        features.append([
            amount,
            hour,
            dow,
            delta,
            ratio,
            rolling_count,
            rolling_total,
            merch_freq,
        ])
    return features


async def _load_user_history(user_id: str) -> tuple[list[tuple], dict[str, int]]:
    db = await get_db()
    rows = await db.execute_fetchall(
        """SELECT amount, timestamp, merchant_name, merchant_category
           FROM transaction_events
           WHERE user_id = ?
           ORDER BY timestamp ASC""",
        (user_id,),
    )
    rows = [(r[0], r[1], r[2], r[3]) for r in rows]

    merchant_counts: dict[str, int] = {}
    for r in rows:
        m = r[2] or ""
        merchant_counts[m] = merchant_counts.get(m, 0) + 1

    return rows, merchant_counts


def _build_model(feature_matrix: np.ndarray) -> IsolationForest:
    n = len(feature_matrix)
    contamination = min(0.1, max(0.01, 2.0 / n))
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    model.fit(feature_matrix)
    return model


def _compute_risk_score(
    anomaly_score: float,
    features: TransactionFeatures,
) -> tuple[int, list[str]]:
    flags: list[str] = []

    norm_anomaly = max(0.0, min(1.0, 0.5 - anomaly_score))

    amount_signal = min(1.0, max(0.0, (features.amount_vs_avg_ratio - 1.0) / 3.0))

    velocity_signal = min(1.0, features.rolling_1h_count / 8.0)

    late_night = 1.0 if features.hour >= 22 or features.hour < 5 else 0.0

    rapid = 1.0 if features.minutes_since_last < 5 else 0.0

    raw = (
        norm_anomaly * 0.35
        + amount_signal * 0.25
        + velocity_signal * 0.15
        + late_night * 0.10
        + rapid * 0.15
    )

    score = int(min(100, max(0, round(raw * 100))))

    if features.amount_vs_avg_ratio > 2.5:
        flags.append(f"Amount is {features.amount_vs_avg_ratio:.1f}x your average")
    if features.rolling_1h_count >= 5:
        flags.append(f"{features.rolling_1h_count} transactions in the last hour")
    if features.minutes_since_last < 3:
        flags.append(f"Only {features.minutes_since_last:.0f}min since last purchase")
    if late_night:
        flags.append("Late-night transaction")
    if features.merchant_frequency >= 5:
        flags.append(f"Frequent merchant ({features.merchant_frequency} visits)")

    return score, flags


async def assess_transaction(
    user_id: str,
    amount: float,
    merchant_name: str,
    merchant_category: str,
) -> RiskAssessment:
    rows, merchant_counts = await _load_user_history(user_id)

    now = datetime.now(timezone.utc)
    hour = now.hour
    dow = now.weekday()

    if rows:
        last_ts = datetime.fromisoformat(rows[-1][1])
        if last_ts.tzinfo is None:
            last_ts = last_ts.replace(tzinfo=timezone.utc)
        mins_since_last = (now - last_ts).total_seconds() / 60.0
    else:
        mins_since_last = 1440.0

    all_amounts = [r[0] for r in rows] + [amount]
    avg = sum(all_amounts) / len(all_amounts)
    ratio = amount / avg if avg > 0 else 1.0

    one_hour_ago = now.timestamp() - 3600
    recent = [
        r for r in rows
        if datetime.fromisoformat(r[1]).replace(tzinfo=timezone.utc).timestamp() > one_hour_ago
    ]
    rolling_count = len(recent) + 1
    rolling_total = sum(r[0] for r in recent) + amount

    merch_freq = merchant_counts.get(merchant_name, 0)

    current_features = TransactionFeatures(
        amount=amount,
        hour=hour,
        day_of_week=dow,
        minutes_since_last=mins_since_last,
        amount_vs_avg_ratio=ratio,
        rolling_1h_count=rolling_count,
        rolling_1h_total=rolling_total,
        merchant_frequency=merch_freq,
    )

    current_vector = [
        amount, hour, dow, mins_since_last,
        ratio, rolling_count, rolling_total, merch_freq,
    ]

    if len(rows) < MIN_HISTORY:
        score, flags = _compute_risk_score(-0.1, current_features)
        return RiskAssessment(
            risk_score=score,
            is_outlier=False,
            anomaly_score=0.0,
            flags=flags + [f"Building profile ({len(rows)}/{MIN_HISTORY} transactions)"],
            features=_features_to_dict(current_features),
        )

    history_features = _extract_features_from_rows(rows, merchant_counts)
    feature_matrix = np.array(history_features, dtype=np.float64)

    model = _build_model(feature_matrix)

    current_array = np.array([current_vector], dtype=np.float64)
    prediction = model.predict(current_array)[0]
    anomaly_score = model.decision_function(current_array)[0]

    is_outlier = prediction == -1
    score, flags = _compute_risk_score(anomaly_score, current_features)

    if is_outlier:
        flags.insert(0, "Unusual spending pattern detected")

    return RiskAssessment(
        risk_score=score,
        is_outlier=is_outlier,
        anomaly_score=round(float(anomaly_score), 4),
        flags=flags,
        features=_features_to_dict(current_features),
    )


def _features_to_dict(f: TransactionFeatures) -> dict:
    return {
        "amount": f.amount,
        "hour": f.hour,
        "day_of_week": f.day_of_week,
        "minutes_since_last": round(f.minutes_since_last, 1),
        "amount_vs_avg_ratio": round(f.amount_vs_avg_ratio, 2),
        "rolling_1h_count": f.rolling_1h_count,
        "rolling_1h_total": round(f.rolling_1h_total, 2),
        "merchant_frequency": f.merchant_frequency,
    }


async def get_dashboard_data(user_id: str) -> dict:
    db = await get_db()
    rows = await db.execute_fetchall(
        """SELECT amount, timestamp, merchant_name, merchant_category,
                  was_blocked, user_decision, decision_latency_ms,
                  risk_score, is_outlier
           FROM transaction_events
           WHERE user_id = ?
           ORDER BY timestamp ASC""",
        (user_id,),
    )
    rows = [tuple(r) for r in rows]

    if not rows:
        return {"status": "no_data"}

    amounts = [r[0] for r in rows]
    total = sum(amounts)
    avg = total / len(amounts)
    std = (sum((a - avg) ** 2 for a in amounts) / len(amounts)) ** 0.5

    blocked = [r for r in rows if r[4]]
    overrides = [r for r in rows if r[5] == "approved"]
    latencies = [r[6] for r in rows if r[6] is not None]

    risk_buckets = [0] * 10
    for r in rows:
        score = r[7] or 0
        bucket = min(9, score // 10)
        risk_buckets[bucket] += 1

    merchant_totals: dict[str, float] = {}
    for r in rows:
        name = r[2] or "Unknown"
        merchant_totals[name] = merchant_totals.get(name, 0) + r[0]
    top_merchants = sorted(merchant_totals.items(), key=lambda x: x[1], reverse=True)[:6]

    hourly = [{"hour": h, "count": 0, "total": 0.0} for h in range(24)]
    daily = [{"day": d, "count": 0, "total": 0.0} for d in range(7)]
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    daily_velocity: dict[str, float] = {}
    for r in rows:
        ts = datetime.fromisoformat(r[1])
        hourly[ts.hour]["count"] += 1
        hourly[ts.hour]["total"] = round(hourly[ts.hour]["total"] + r[0], 2)
        daily[ts.weekday()]["count"] += 1
        daily[ts.weekday()]["total"] = round(daily[ts.weekday()]["total"] + r[0], 2)
        day_key = ts.strftime("%Y-%m-%d")
        daily_velocity[day_key] = daily_velocity.get(day_key, 0) + r[0]

    for d in daily:
        d["day"] = day_names[d["day"]]

    velocity_series = [
        {"date": k, "total": round(v, 2)}
        for k, v in sorted(daily_velocity.items())
    ]

    outlier_list = [
        {
            "amount": r[0],
            "timestamp": r[1],
            "merchant": r[2],
            "category": r[3],
            "risk_score": r[7],
        }
        for r in rows if r[8]
    ]

    return {
        "stats": {
            "total_transactions": len(rows),
            "total_spent": round(total, 2),
            "avg_amount": round(avg, 2),
            "std_amount": round(std, 2),
            "suggested_threshold": round(avg + 2 * std, 2),
        },
        "overrides": {
            "blocked_count": len(blocked),
            "override_count": len(overrides),
            "override_rate": round(len(overrides) / len(blocked), 2) if blocked else 0,
            "avg_decision_latency_ms": round(sum(latencies) / len(latencies)) if latencies else 0,
        },
        "risk_distribution": risk_buckets,
        "top_merchants": [{"name": m, "total": round(t, 2)} for m, t in top_merchants],
        "hourly_heatmap": hourly,
        "daily_heatmap": daily,
        "daily_velocity": velocity_series,
        "outliers": outlier_list,
    }


async def get_mode_suggestion(user_id: str) -> dict:
    db = await get_db()
    rows = await db.execute_fetchall(
        """SELECT amount, timestamp, merchant_name, merchant_category,
                  was_blocked, user_decision
           FROM transaction_events
           WHERE user_id = ?
           ORDER BY timestamp ASC""",
        (user_id,),
    )
    rows = [tuple(r) for r in rows]

    if len(rows) < MIN_HISTORY:
        return {"has_suggestion": False, "reason": "insufficient_data"}

    grid: dict[tuple[int, int], dict] = {}
    for dow in range(7):
        for h in range(24):
            grid[(dow, h)] = {"count": 0, "total": 0.0, "blocked": 0}

    category_stats: dict[str, dict] = {}
    for r in rows:
        ts = datetime.fromisoformat(r[1])
        cell = grid[(ts.weekday(), ts.hour)]
        cell["count"] += 1
        cell["total"] += r[0]
        cell["blocked"] += 1 if r[4] else 0

        cat = r[3] or "other"
        if cat not in category_stats:
            category_stats[cat] = {"count": 0, "blocked": 0}
        category_stats[cat]["count"] += 1
        category_stats[cat]["blocked"] += 1 if r[4] else 0

    now = datetime.now()
    dow_now = now.weekday()
    hour_now = now.hour
    current_cell = grid[(dow_now, hour_now)]

    signals = []
    confidence = 0.0

    if current_cell["count"] >= 3:
        block_rate = current_cell["blocked"] / current_cell["count"]
        if block_rate > 0.3:
            signals.append(f"Historically risky time slot ({block_rate:.0%} block rate)")
            confidence += block_rate * 0.3

    nearby_count = 0
    nearby_total = 0.0
    for dh in range(-1, 2):
        h = (hour_now + dh) % 24
        c = grid[(dow_now, h)]
        nearby_count += c["count"]
        nearby_total += c["total"]
    if nearby_count >= 5:
        signals.append(f"Active spending window ({nearby_count} historical txns nearby)")
        confidence += 0.1

    thirty_min_ago = now.timestamp() - 1800
    recent_txns = [
        r for r in rows
        if datetime.fromisoformat(r[1]).timestamp() > thirty_min_ago
    ]
    if len(recent_txns) >= 3:
        signals.append(f"High velocity: {len(recent_txns)} transactions in 30 min")
        confidence += 0.2

    if dow_now >= 4 and hour_now >= 18:
        signals.append("Weekend evening — historically high-risk period")
        confidence += 0.15

    risky_cats = [
        cat for cat, s in category_stats.items()
        if s["count"] >= 3 and s["blocked"] / s["count"] > 0.3
    ]
    if risky_cats:
        confidence += 0.05

    confidence = min(1.0, confidence)

    if confidence < 0.3:
        return {"has_suggestion": False, "reason": "low_confidence", "confidence": round(confidence, 2)}

    similar_amounts = []
    for dh in range(-2, 3):
        h = (hour_now + dh) % 24
        for dow in range(max(0, dow_now - 1), min(7, dow_now + 2)):
            c = grid[(dow, h)]
            if c["count"] > 0:
                similar_amounts.append(c["total"] / c["count"])

    if similar_amounts:
        avg_spend = sum(similar_amounts) / len(similar_amounts)
        budget = max(20, min(200, round(avg_spend * 0.8 / 5) * 5))
    else:
        budget = 50

    mode = "block" if confidence > 0.6 else "high_risk"
    reason = signals[0] if signals else "Elevated risk detected"

    return {
        "has_suggestion": True,
        "suggestion": {
            "mode": mode,
            "reason": reason,
            "signals": signals,
            "confidence": round(confidence, 2),
            "recommended_budget": budget,
            "recommended_window_minutes": 180,
        },
    }


async def get_user_spending_profile(user_id: str) -> dict:
    rows, merchant_counts = await _load_user_history(user_id)

    if not rows:
        return {"status": "no_data"}

    amounts = [r[0] for r in rows]
    timestamps = [datetime.fromisoformat(r[1]) for r in rows]

    avg_amount = sum(amounts) / len(amounts)
    std_amount = (sum((a - avg_amount) ** 2 for a in amounts) / len(amounts)) ** 0.5

    hourly_spend: dict[int, list[float]] = {}
    for ts, amt in zip(timestamps, amounts):
        h = ts.hour
        hourly_spend.setdefault(h, []).append(amt)

    peak_hour = max(hourly_spend, key=lambda h: sum(hourly_spend[h]))

    daily_spend: dict[int, list[float]] = {}
    for ts, amt in zip(timestamps, amounts):
        d = ts.weekday()
        daily_spend.setdefault(d, []).append(amt)

    peak_day = max(daily_spend, key=lambda d: sum(daily_spend[d]))
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    if len(rows) >= MIN_HISTORY:
        history_features = _extract_features_from_rows(rows, merchant_counts)
        feature_matrix = np.array(history_features, dtype=np.float64)
        model = _build_model(feature_matrix)
        scores = model.decision_function(feature_matrix)
        outlier_indices = [
            i for i, s in enumerate(scores) if s < np.percentile(scores, 10)
        ]
        outlier_transactions = [
            {
                "amount": rows[i][0],
                "timestamp": rows[i][1],
                "merchant": rows[i][2],
                "anomaly_score": round(float(scores[i]), 4),
            }
            for i in outlier_indices
        ]
    else:
        outlier_transactions = []

    return {
        "total_transactions": len(rows),
        "avg_amount": round(avg_amount, 2),
        "std_amount": round(std_amount, 2),
        "high_threshold": round(avg_amount + 2 * std_amount, 2),
        "peak_hour": peak_hour,
        "peak_day": day_names[peak_day],
        "top_merchants": sorted(
            merchant_counts.items(), key=lambda x: x[1], reverse=True
        )[:5],
        "outlier_transactions": outlier_transactions,
        "model_ready": len(rows) >= MIN_HISTORY,
    }
