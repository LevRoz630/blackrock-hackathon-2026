from fastapi import APIRouter

from app.db import get_db
from app.models.schemas import (
    LinkedCard,
    VirtualCard,
    WalletResponse,
    WalletTransaction,
)

router = APIRouter(prefix="/users", tags=["wallet"])

CATEGORY_CARD_MAP = {
    "food_and_drink": 0,
    "grocery": 0,
    "pharmacy": 0,
    "transport": 0,
    "bars_and_pubs": 2,
    "electronics": 1,
    "clothing": 1,
}


@router.get("/{user_id}/wallet", response_model=WalletResponse)
async def get_wallet(user_id: str) -> WalletResponse:
    db = await get_db()

    cursor = await db.execute(
        "SELECT * FROM linked_cards WHERE user_id = ? ORDER BY balance DESC",
        (user_id,),
    )
    card_rows = await cursor.fetchall()
    cards = [
        LinkedCard(
            id=r["id"],
            card_name=r["card_name"],
            card_type=r["card_type"],
            last_four=r["last_four"],
            balance=r["balance"],
            color=r["color"],
        )
        for r in card_rows
    ]

    total_balance = sum(c.balance for c in cards)

    cursor = await db.execute(
        """SELECT id, merchant_name, amount, timestamp, merchant_category, was_blocked
           FROM transaction_events
           WHERE user_id = ?
           ORDER BY timestamp DESC
           LIMIT 25""",
        (user_id,),
    )
    txn_rows = await cursor.fetchall()

    transactions = []
    for t in txn_rows:
        cat = t["merchant_category"]
        card_idx = CATEGORY_CARD_MAP.get(cat, 0)
        if card_idx >= len(cards):
            card_idx = 0
        source = cards[card_idx] if cards else None
        transactions.append(
            WalletTransaction(
                id=t["id"],
                merchant=t["merchant_name"],
                amount=t["amount"],
                timestamp=t["timestamp"],
                category=cat,
                was_blocked=bool(t["was_blocked"]),
                source_card=source.card_name if source else "Unknown",
                source_color=source.color if source else "#555",
            )
        )

    return WalletResponse(
        virtual_card=VirtualCard(
            last_four="7842",
            total_balance=round(total_balance, 2),
            status="active",
            card_count=len(cards),
        ),
        linked_cards=cards,
        recent_transactions=transactions,
    )
