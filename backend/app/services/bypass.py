from datetime import datetime, timedelta, timezone

from app.db import get_db

BYPASS_TTL_MINUTES = 5


async def create_bypass(user_id: str, amount: float, merchant: str) -> dict:
    db = await get_db()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=BYPASS_TTL_MINUTES)
    cursor = await db.execute(
        """INSERT INTO bypasses (user_id, amount, merchant, created_at, expires_at, consumed)
           VALUES (?, ?, ?, ?, ?, 0)""",
        (user_id, amount, merchant, now.isoformat(), expires_at.isoformat()),
    )
    await db.commit()
    return {
        "id": cursor.lastrowid,
        "user_id": user_id,
        "amount": amount,
        "merchant": merchant,
        "expires_at": expires_at.isoformat(),
    }


async def check_bypass(user_id: str, amount: float, merchant: str) -> dict | None:
    db = await get_db()
    now = datetime.now(timezone.utc).isoformat()
    row = await db.execute_fetchall(
        """SELECT id, amount, merchant, expires_at FROM bypasses
           WHERE user_id = ? AND merchant = ? AND consumed = 0 AND expires_at > ?
           ORDER BY created_at DESC LIMIT 1""",
        (user_id, merchant, now),
    )
    if not row:
        return None
    match = row[0]
    await db.execute("UPDATE bypasses SET consumed = 1 WHERE id = ?", (match[0],))
    await db.commit()
    return {"id": match[0], "amount": match[1], "merchant": match[2]}


async def cleanup_expired() -> int:
    db = await get_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = await db.execute(
        "DELETE FROM bypasses WHERE expires_at <= ? OR consumed = 1", (now,)
    )
    await db.commit()
    return cursor.rowcount
