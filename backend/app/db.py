import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "tbys.db"

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        raise RuntimeError("Database not initialised")
    return _db


async def init_db() -> None:
    global _db
    _db = await aiosqlite.connect(DB_PATH)
    _db.row_factory = aiosqlite.Row
    await _db.executescript("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            block_threshold REAL,
            high_risk_budget REAL,
            high_risk_window_start TEXT,
            high_risk_window_end TEXT,
            real_world_unit_name TEXT,
            real_world_unit_value REAL,
            weekly_budget REAL,
            nightly_sub_budget REAL
        );

        CREATE TABLE IF NOT EXISTS fcm_tokens (
            user_id TEXT PRIMARY KEY,
            fcm_token TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bypasses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            merchant TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            consumed INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS spending_windows (
            user_id TEXT NOT NULL,
            window_id TEXT NOT NULL,
            total_spent REAL NOT NULL DEFAULT 0.0,
            PRIMARY KEY (user_id, window_id)
        );

        CREATE TABLE IF NOT EXISTS transaction_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            transaction_token TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            amount REAL NOT NULL,
            merchant_name TEXT NOT NULL DEFAULT '',
            merchant_category TEXT NOT NULL DEFAULT '',
            mode_triggered TEXT,
            was_blocked INTEGER NOT NULL DEFAULT 0,
            user_decision TEXT,
            decision_latency_ms INTEGER,
            window_total_at_time REAL,
            risk_score INTEGER,
            is_outlier INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_events_user_ts
            ON transaction_events (user_id, timestamp);

        CREATE TABLE IF NOT EXISTS linked_cards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            card_name TEXT NOT NULL,
            card_type TEXT NOT NULL,
            last_four TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            color TEXT NOT NULL DEFAULT '#333333'
        );

        CREATE INDEX IF NOT EXISTS idx_linked_cards_user
            ON linked_cards (user_id);
    """)
    await _db.commit()


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None
