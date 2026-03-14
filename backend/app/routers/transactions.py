from fastapi import APIRouter

from app.models.schemas import (
    FrictionPrompt,
    Mode,
    TransactionResult,
    TransactionWebhook,
    UserDecision,
)
from app.services.friction import evaluate_transaction
from app.services.marqeta import MarqetaClient

router = APIRouter()
marqeta = MarqetaClient()


@router.post("/webhooks/marqeta", response_model=FrictionPrompt)
async def marqeta_webhook(payload: TransactionWebhook) -> FrictionPrompt:
    """Receive a JIT funding webhook from Marqeta and decide whether to prompt."""
    # TODO: look up user's mode, budget, and session state from DB
    prompt = evaluate_transaction(
        transaction=payload,
        mode=Mode.BLOCK,
    )
    return prompt


@router.post("/transactions/decide", response_model=TransactionResult)
async def decide_transaction(decision: UserDecision) -> TransactionResult:
    """User approves or declines a held transaction."""
    if decision.approved:
        result = await marqeta.approve_transaction(decision.transaction_token)
    else:
        result = await marqeta.decline_transaction(decision.transaction_token)

    return TransactionResult(
        transaction_token=decision.transaction_token,
        status=result["status"],
        message=f"Transaction {result['status']}.",
    )
