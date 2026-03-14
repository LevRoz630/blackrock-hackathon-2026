from app.config import settings
from app.models.schemas import FrictionPrompt, Mode, TransactionWebhook, WebhookResponse


def evaluate_transaction(
    transaction: TransactionWebhook,
    block_threshold: float | None = None,
    high_risk_budget: float | None = None,
    total_spent: float = 0.0,
) -> tuple[WebhookResponse, FrictionPrompt]:
    # Block: auto-decline above threshold
    if block_threshold is not None and transaction.amount > block_threshold:
        return (
            WebhookResponse(approved=False, reason="block_threshold_exceeded"),
            FrictionPrompt(
                show_prompt=True,
                mode=Mode.BLOCK,
                delay_seconds=settings.block_delay_seconds,
                message=(
                    f"£{transaction.amount:.2f}"
                    f" at {transaction.merchant_name or 'a merchant'}."
                    f" Over your £{block_threshold:.2f} limit."
                ),
            ),
        )

    # High Risk: check spending window budget
    if high_risk_budget is not None:
        new_total = total_spent + transaction.amount

        if new_total > high_risk_budget:
            return (
                WebhookResponse(approved=False, reason="high_risk_over_budget"),
                FrictionPrompt(
                    show_prompt=True,
                    mode=Mode.HIGH_RISK,
                    delay_seconds=0,
                    message=(
                        f"£{new_total:.2f} spent tonight."
                        f" £{abs(high_risk_budget - new_total):.2f} over budget."
                    ),
                    total_spent=new_total,
                    budget=high_risk_budget,
                ),
            )

        remaining = high_risk_budget - new_total
        return (
            WebhookResponse(approved=True, reason="high_risk_under_budget"),
            FrictionPrompt(
                show_prompt=True,
                mode=Mode.HIGH_RISK,
                delay_seconds=0,
                message=f"£{remaining:.2f} left of £{high_risk_budget:.2f} tonight.",
                total_spent=new_total,
                budget=high_risk_budget,
            ),
        )

    # No mode active
    return (
        WebhookResponse(approved=True, reason="within_limits"),
        FrictionPrompt(
            show_prompt=False,
            mode=Mode.BLOCK,
            delay_seconds=0,
            message="",
        ),
    )
