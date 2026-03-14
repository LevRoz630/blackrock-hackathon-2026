from fastapi import APIRouter

from app.models.schemas import (
    TransactionResult,
    TransactionWebhook,
    UserDecision,
    WebhookResponse,
)
from app.services.friction import evaluate_transaction
from app.services.marqeta import MarqetaClient

router = APIRouter()
marqeta = MarqetaClient()


@router.post("/webhooks/marqeta")
async def marqeta_webhook(payload: TransactionWebhook) -> WebhookResponse:
    # TODO: look up user settings from DB
    webhook_response, prompt = evaluate_transaction(
        transaction=payload,
        block_threshold=50.0,  # placeholder
    )

    if prompt.show_prompt:
        pass  # TODO: send FCM push to user's device

    return webhook_response


@router.post("/transactions/decide", response_model=TransactionResult)
async def decide_transaction(decision: UserDecision) -> TransactionResult:
    if decision.approved:
        result = await marqeta.approve_transaction(decision.transaction_token)
    else:
        result = await marqeta.decline_transaction(decision.transaction_token)

    return TransactionResult(
        transaction_token=decision.transaction_token,
        status=result["status"],
        message=f"Transaction {result['status']}.",
    )
