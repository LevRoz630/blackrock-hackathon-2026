from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import IsolationForest

from app.db import get_db

MIN_HISTORY = 10

# St Andrews town grid (0-100). X: west->east, Y: north->south.
# Three main streets run roughly W->E, fanning out from West Port:
#   North St ~ y 20, Market St ~ y 48, South St ~ y 76
MERCHANT_LOCATIONS: dict[str, dict[str, float]] = {
    "The Vic":             {"x": 34.6, "y": 37.7},
    "Aikman's":            {"x": 59.2, "y": 56.3},
    "The Rule":            {"x": 71.9, "y": 67.3},
    "Lizard Lounge":       {"x": 63.7, "y": 29.0},
    "Tesco Express":       {"x": 56.9, "y": 47.6},
    "Pret A Manger":       {"x": 45.5, "y": 43.2},
    "Costa Coffee":        {"x": 50.1, "y": 61.8},
    "Jannettas Gelateria": {"x": 61.5, "y": 62.9},
    "Sainsbury's Local":   {"x": 79.7, "y": 69.5},
    "Stagecoach":          {"x": 22.8, "y": 50.9},
    "Uber":                {"x": 52.4, "y": 47.6},
    "Argos":               {"x": 29.6, "y": 50.9},
    "Zara":                {"x": 47.8, "y": 45.4},
}


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


def _is_high_risk_hour(hour: int) -> bool:
    return hour >= 18 or hour < 2


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

    # --- risk map: per-merchant aggregation with location ---
    merchant_agg: dict[str, dict] = {}
    for r in rows:
        name = r[2] or "Unknown"
        if name not in merchant_agg:
            merchant_agg[name] = {"total": 0.0, "count": 0, "blocked": 0}
        merchant_agg[name]["total"] += r[0]
        merchant_agg[name]["count"] += 1
        merchant_agg[name]["blocked"] += 1 if r[4] else 0

    risk_map = []
    for name, agg in merchant_agg.items():
        loc = MERCHANT_LOCATIONS.get(name)
        if not loc:
            continue
        block_rate = agg["blocked"] / agg["count"] if agg["count"] else 0
        if block_rate > 0.3:
            risk_level = "high"
        elif block_rate > 0.1:
            risk_level = "medium"
        else:
            risk_level = "low"
        risk_map.append({
            "name": name,
            "x": loc["x"],
            "y": loc["y"],
            "total_spent": round(agg["total"], 2),
            "count": agg["count"],
            "block_rate": round(block_rate, 2),
            "risk_level": risk_level,
        })

    # --- weekly summary ---
    settings_row = await db.execute_fetchall(
        "SELECT weekly_budget, nightly_sub_budget FROM user_settings WHERE user_id = ?",
        (user_id,),
    )
    weekly_budget = 120.0
    nightly_sub_budget = 60.0
    if settings_row:
        weekly_budget = settings_row[0][0] or 120.0
        nightly_sub_budget = settings_row[0][1] or 60.0

    now = datetime.now()
    monday = now - timedelta(days=now.weekday())
    week_start = monday.replace(hour=0, minute=0, second=0, microsecond=0)

    week_txns = [
        r for r in rows
        if datetime.fromisoformat(r[1]) >= week_start
    ]
    weekly_spent = sum(r[0] for r in week_txns)

    night_txns = [
        r for r in week_txns
        if _is_high_risk_hour(datetime.fromisoformat(r[1]).hour)
    ]
    night_spent = sum(r[0] for r in night_txns)

    nightly_buckets: dict[str, float] = {}
    for r in night_txns:
        ts = datetime.fromisoformat(r[1])
        night_key = (ts - timedelta(hours=6)).strftime("%Y-%m-%d")
        nightly_buckets[night_key] = nightly_buckets.get(night_key, 0) + r[0]

    nightly_breakdown = [
        {
            "date": d,
            "total": round(t, 2),
            "budget": nightly_sub_budget,
            "pct_used": round(t / nightly_sub_budget * 100, 1) if nightly_sub_budget else 0,
        }
        for d, t in sorted(nightly_buckets.items())
    ]
    nights_used = len(nightly_buckets)
    avg_per_night = round(night_spent / nights_used, 2) if nights_used else 0

    weekly_summary = {
        "weekly_budget": weekly_budget,
        "weekly_spent": round(weekly_spent, 2),
        "weekly_remaining": round(weekly_budget - weekly_spent, 2),
        "night_spent": round(night_spent, 2),
        "nights_used": nights_used,
        "avg_per_night": avg_per_night,
        "nightly_sub_budget": nightly_sub_budget,
        "nightly_breakdown": nightly_breakdown,
    }

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
        "risk_map": risk_map,
        "weekly_summary": weekly_summary,
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
        signals.append("Weekend evening -- historically high-risk period")
        confidence += 0.15

    risky_cats = [
        cat for cat, s in category_stats.items()
        if s["count"] >= 3 and s["blocked"] / s["count"] > 0.3
    ]
    if risky_cats:
        confidence += 0.05

    # Weekly budget pacing check
    srow = await db.execute_fetchall(
        "SELECT weekly_budget, nightly_sub_budget FROM user_settings WHERE user_id = ?",
        (user_id,),
    )
    if srow and srow[0][0]:
        wb = srow[0][0]
        nb = srow[0][1] or wb
        wk_start = now - timedelta(days=now.weekday())
        wk_start = wk_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_spend = sum(
            r[0] for r in rows
            if datetime.fromisoformat(r[1]) >= wk_start
        )
        wr = wb - week_spend
        if wr < nb:
            signals.append(f"Weekly budget tight ({wr:.0f} left of {wb:.0f})")
            confidence += 0.2

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


LOCATION_ZONES: dict[str, list[str]] = {
    "nightlife": ["The Vic", "Aikman's", "The Rule", "Lizard Lounge"],
    "food": ["Tesco Express", "Pret A Manger", "Jannettas Gelateria", "Sainsbury's Local"],
    "shopping": ["Argos", "Zara", "Costa Coffee"],
    "transport": ["Stagecoach", "Uber"],
}

ZONE_BY_MERCHANT: dict[str, str] = {}
for _zone, _merchants in LOCATION_ZONES.items():
    for _m in _merchants:
        ZONE_BY_MERCHANT[_m] = _zone


def _classify_zone(merchant: str) -> str:
    return ZONE_BY_MERCHANT.get(merchant, "other")


async def compute_auto_mode(
    user_id: str,
    current_hour: int | None = None,
    current_dow: int | None = None,
    current_location: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    hour = current_hour if current_hour is not None else now.hour
    dow = current_dow if current_dow is not None else now.weekday()
    zone = _classify_zone(current_location or "")

    rows, merchant_counts = await _load_user_history(user_id)

    if len(rows) < MIN_HISTORY:
        return {
            "auto_activate": False,
            "reason": f"Need {MIN_HISTORY - len(rows)} more transactions to learn your patterns",
        }

    context_rows = []
    wider_rows = []
    for r in rows:
        ts = datetime.fromisoformat(r[1])
        r_dow = ts.weekday()
        r_hour = ts.hour
        r_zone = _classify_zone(r[2] or "")

        dow_match = abs(r_dow - dow) <= 1 or abs(r_dow - dow) >= 6
        hour_match = abs(r_hour - hour) <= 2 or abs(r_hour - hour) >= 22

        if dow_match and hour_match:
            wider_rows.append(r)
            if zone != "other" and r_zone == zone:
                context_rows.append(r)

    best_rows = context_rows if len(context_rows) >= 5 else wider_rows

    if len(best_rows) < 3:
        is_evening = hour >= 18 or hour < 2
        is_weekend = dow >= 4
        if is_evening and is_weekend:
            return {
                "auto_activate": True,
                "mode": "high_risk",
                "reason": "Weekend evening — limited history, using safe defaults",
                "optimal_ceiling": 50.0,
                "savings_target": 42.0,
                "confidence": 0.3,
                "basis": "default",
            }
        return {"auto_activate": False, "reason": "Not enough pattern data for this context"}

    amounts = [r[0] for r in best_rows]
    total_per_session = _estimate_session_totals(best_rows)

    if total_per_session:
        typical_session = sum(total_per_session) / len(total_per_session)
        p75 = sorted(total_per_session)[int(len(total_per_session) * 0.75)]
        median = sorted(total_per_session)[len(total_per_session) // 2]
    else:
        typical_session = sum(amounts)
        p75 = typical_session
        median = typical_session

    savings_factor = 0.85
    optimal = round(p75 * savings_factor / 5) * 5
    optimal = max(15.0, optimal)

    confidence_signals = []
    confidence = 0.0

    if len(best_rows) >= 10:
        confidence += 0.3
        confidence_signals.append(f"Strong history ({len(best_rows)} similar transactions)")
    elif len(best_rows) >= 5:
        confidence += 0.15
        confidence_signals.append(f"Moderate history ({len(best_rows)} similar transactions)")

    is_evening = hour >= 18 or hour < 2
    is_weekend = dow >= 4
    if is_evening:
        confidence += 0.15
        confidence_signals.append("Evening hours — historically higher spend")
    if is_weekend:
        confidence += 0.1
        confidence_signals.append("Weekend — historically higher spend")

    if zone == "nightlife":
        confidence += 0.25
        confidence_signals.append("Nightlife area — high risk zone")
    elif zone == "food":
        confidence += 0.05

    blocked_in_context = sum(1 for r in best_rows if len(r) > 4 and r[4])
    if len(best_rows) > 0:
        block_rate = blocked_in_context / len(best_rows)
        if block_rate > 0.2:
            confidence += 0.15
            confidence_signals.append(f"High block rate in this context ({block_rate:.0%})")

    confidence = min(1.0, confidence)

    mode = "high_risk"
    if confidence > 0.6 and not is_evening:
        mode = "block"

    should_activate = confidence >= 0.35

    return {
        "auto_activate": should_activate,
        "mode": mode,
        "optimal_ceiling": round(p75, 2),
        "savings_target": float(optimal),
        "typical_session_spend": round(typical_session, 2),
        "median_session_spend": round(median, 2),
        "confidence": round(confidence, 2),
        "signals": confidence_signals,
        "context": {
            "hour": hour,
            "day_of_week": dow,
            "zone": zone if zone != "other" else None,
            "matching_transactions": len(best_rows),
        },
        "reason": confidence_signals[0] if confidence_signals else "Pattern match",
        "basis": "location" if context_rows and len(context_rows) >= 5 else "time",
    }


def _estimate_session_totals(rows: list[tuple]) -> list[float]:
    if not rows:
        return []

    sessions: list[float] = []
    current_total = 0.0
    last_ts = None

    for r in rows:
        ts = datetime.fromisoformat(r[1])
        if last_ts and (ts - last_ts).total_seconds() > 3600:
            if current_total > 0:
                sessions.append(current_total)
            current_total = 0.0
        current_total += r[0]
        last_ts = ts

    if current_total > 0:
        sessions.append(current_total)

    return sessions


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
