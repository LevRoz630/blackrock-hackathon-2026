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
