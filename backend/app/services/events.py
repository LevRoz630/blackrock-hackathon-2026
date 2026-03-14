from datetime import datetime, timezone

from app.db import get_db


async def log_transaction_event(
    user_id: str,
    transaction_token: str,
    amount: float,
    merchant_name: str,
    merchant_category: str,
    mode_triggered: str | None,
    was_blocked: bool,
    window_total_at_time: float | None,
    risk_score: int | None = None,
    is_outlier: bool = False,
) -> int:
    db = await get_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = await db.execute(
        """INSERT INTO transaction_events
           (user_id, transaction_token, timestamp, amount, merchant_name,
            merchant_category, mode_triggered, was_blocked, window_total_at_time,
            risk_score, is_outlier)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id,
            transaction_token,
            now,
            amount,
            merchant_name,
            merchant_category,
            mode_triggered,
            int(was_blocked),
            window_total_at_time,
            risk_score,
            int(is_outlier),
        ),
    )
    await db.commit()
    return cursor.lastrowid


async def record_decision(
    transaction_token: str,
    user_id: str,
    decision: str,
    latency_ms: int | None,
) -> None:
    db = await get_db()
    await db.execute(
        """UPDATE transaction_events
           SET user_decision = ?, decision_latency_ms = ?
           WHERE transaction_token = ? AND user_id = ?""",
        (decision, latency_ms, transaction_token, user_id),
    )
    await db.commit()


async def get_user_insights(user_id: str) -> dict:
    db = await get_db()

    total = await db.execute_fetchall(
        "SELECT COUNT(*) FROM transaction_events WHERE user_id = ?",
        (user_id,),
    )
    total_count = total[0][0] if total else 0

    blocked = await db.execute_fetchall(
        "SELECT COUNT(*) FROM transaction_events WHERE user_id = ? AND was_blocked = 1",
        (user_id,),
    )
    blocked_count = blocked[0][0] if blocked else 0

    overrides = await db.execute_fetchall(
        """SELECT COUNT(*) FROM transaction_events
           WHERE user_id = ? AND was_blocked = 1 AND user_decision = 'approved'""",
        (user_id,),
    )
    override_count = overrides[0][0] if overrides else 0

    avg_latency = await db.execute_fetchall(
        """SELECT AVG(decision_latency_ms) FROM transaction_events
           WHERE user_id = ? AND decision_latency_ms IS NOT NULL""",
        (user_id,),
    )
    avg_latency_ms = round(avg_latency[0][0]) if avg_latency and avg_latency[0][0] else None

    top_merchants = await db.execute_fetchall(
        """SELECT merchant_name, COUNT(*) as cnt, SUM(amount) as total
           FROM transaction_events
           WHERE user_id = ? AND merchant_name != ''
           GROUP BY merchant_name ORDER BY cnt DESC LIMIT 5""",
        (user_id,),
    )

    hourly = await db.execute_fetchall(
        """SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour,
                  COUNT(*) as cnt, SUM(amount) as total
           FROM transaction_events WHERE user_id = ?
           GROUP BY hour ORDER BY hour""",
        (user_id,),
    )

    avg_spend = await db.execute_fetchall(
        "SELECT AVG(amount) FROM transaction_events WHERE user_id = ?",
        (user_id,),
    )
    avg_amount = round(avg_spend[0][0], 2) if avg_spend and avg_spend[0][0] else None

    recent_velocity = await db.execute_fetchall(
        """SELECT COUNT(*), SUM(amount) FROM transaction_events
           WHERE user_id = ? AND timestamp > datetime('now', '-1 hour')""",
        (user_id,),
    )
    last_hour_count = recent_velocity[0][0] if recent_velocity else 0
    last_hour_total = round(recent_velocity[0][1], 2) if recent_velocity and recent_velocity[0][1] else 0

    return {
        "total_transactions": total_count,
        "blocked_count": blocked_count,
        "override_count": override_count,
        "override_rate": round(override_count / blocked_count, 2) if blocked_count > 0 else 0,
        "avg_decision_latency_ms": avg_latency_ms,
        "avg_transaction_amount": avg_amount,
        "top_merchants": [
            {"name": r[0], "count": r[1], "total_spent": round(r[2], 2)}
            for r in top_merchants
        ],
        "hourly_distribution": [
            {"hour": r[0], "count": r[1], "total_spent": round(r[2], 2)}
            for r in hourly
        ],
        "last_hour": {"count": last_hour_count, "total": last_hour_total},
    }


async def get_savings_summary(user_id: str) -> dict:
    db = await get_db()

    saved = await db.execute_fetchall(
        """SELECT COALESCE(SUM(amount), 0) FROM transaction_events
           WHERE user_id = ? AND was_blocked = 1
           AND (user_decision IS NULL OR user_decision = 'declined')""",
        (user_id,),
    )
    total_saved = round(saved[0][0], 2) if saved else 0.0

    saved_week = await db.execute_fetchall(
        """SELECT COALESCE(SUM(amount), 0) FROM transaction_events
           WHERE user_id = ? AND was_blocked = 1
           AND (user_decision IS NULL OR user_decision = 'declined')
           AND timestamp > datetime('now', '-7 days')""",
        (user_id,),
    )
    saved_this_week = round(saved_week[0][0], 2) if saved_week else 0.0

    blocks_declined = await db.execute_fetchall(
        """SELECT COALESCE(COUNT(*), 0) FROM transaction_events
           WHERE user_id = ? AND was_blocked = 1
           AND (user_decision IS NULL OR user_decision = 'declined')""",
        (user_id,),
    )
    impulses_stopped = blocks_declined[0][0] if blocks_declined else 0

    streak_rows = await db.execute_fetchall(
        """SELECT DATE(timestamp) as day, SUM(CASE WHEN was_blocked = 1
           AND (user_decision IS NULL OR user_decision = 'declined') THEN 1 ELSE 0 END) as declined
           FROM transaction_events
           WHERE user_id = ?
           GROUP BY day ORDER BY day DESC LIMIT 30""",
        (user_id,),
    )
    streak = 0
    for row in streak_rows:
        if row[1] and row[1] > 0:
            streak += 1
        else:
            break

    return {
        "total_saved": total_saved,
        "saved_this_week": saved_this_week,
        "impulses_stopped": impulses_stopped,
        "streak_days": streak,
    }
