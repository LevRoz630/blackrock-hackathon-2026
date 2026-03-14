from fastapi import APIRouter

from app.db import get_db
from app.models.schemas import (
    TransactionResult,
    TransactionWebhook,
    UserDecision,
    WebhookResponse,
)
from app.services.bypass import check_bypass, create_bypass
from app.services.friction import evaluate_transaction
from app.services.marqeta import MarqetaClient

router = APIRouter()
marqeta = MarqetaClient()


async def _get_user_settings(user_id: str) -> dict | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT * FROM user_settings WHERE user_id = ?", (user_id,)
    )
    if not rows:
        return None
    row = rows[0]
    return {
        "block_threshold": row[1],
        "high_risk_budget": row[2],
        "high_risk_window_start": row[3],
        "high_risk_window_end": row[4],
        "real_world_unit_name": row[5],
        "real_world_unit_value": row[6],
    }


async def _get_window_total(user_id: str, window_id: str) -> float:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT total_spent FROM spending_windows WHERE user_id = ? AND window_id = ?",
        (user_id, window_id),
    )
    if not rows:
        return 0.0
    return float(rows[0][0])


async def _update_window_total(user_id: str, window_id: str, new_total: float) -> None:
    db = await get_db()
    await db.execute(
        """INSERT INTO spending_windows (user_id, window_id, total_spent)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id, window_id) DO UPDATE SET total_spent = excluded.total_spent""",
        (user_id, window_id, new_total),
    )
    await db.commit()


@router.post("/webhooks/marqeta")
async def marqeta_webhook(payload: TransactionWebhook) -> WebhookResponse:
    bypass = await check_bypass(
        payload.user_token, payload.amount, payload.merchant_name
    )
    if bypass:
        return WebhookResponse(approved=True, reason="bypass_active")

    user_settings = await _get_user_settings(payload.user_token)
    block_threshold: float | None = None
    high_risk_budget: float | None = None
    total_spent: float = 0.0
    window_id: str | None = None

    if user_settings:
        block_threshold = user_settings["block_threshold"]
        high_risk_budget = user_settings["high_risk_budget"]

        if high_risk_budget is not None and user_settings["high_risk_window_start"]:
            window_id = (
                f"{user_settings['high_risk_window_start']}"
                f"_{user_settings['high_risk_window_end']}"
            )
            total_spent = await _get_window_total(payload.user_token, window_id)

    webhook_response, prompt = evaluate_transaction(
        transaction=payload,
        block_threshold=block_threshold,
        high_risk_budget=high_risk_budget,
        total_spent=total_spent,
    )

    if webhook_response.approved and high_risk_budget is not None and window_id:
        new_total = total_spent + payload.amount
        await _update_window_total(payload.user_token, window_id, new_total)

    if prompt.show_prompt:
        pass  # TODO: send FCM push to user's device

    return webhook_response


@router.post("/transactions/decide", response_model=TransactionResult)
async def decide_transaction(decision: UserDecision) -> TransactionResult:
    if decision.approved:
        bypass = await create_bypass(
            decision.user_token, decision.amount, decision.merchant_name
        )
        return TransactionResult(
            transaction_token=decision.transaction_token,
            status="bypass_created",
            message="Bypass created. Re-tap your card within 5 minutes.",
            bypass_id=bypass["id"],
        )

    result = await marqeta.decline_transaction(decision.transaction_token)
    return TransactionResult(
        transaction_token=decision.transaction_token,
        status=result["status"],
        message=f"Transaction {result['status']}.",
    )
