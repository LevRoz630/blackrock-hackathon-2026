from app.config import settings
from app.models.schemas import FrictionPrompt, Mode, TransactionWebhook


def evaluate_transaction(
    transaction: TransactionWebhook,
    mode: Mode,
    budget: float | None = None,
    total_spent: float = 0.0,
    prompt_count: int = 0,
) -> FrictionPrompt:
    """Determine whether a transaction should trigger a friction prompt."""

    if mode == Mode.BLOCK:
        return FrictionPrompt(
            should_prompt=True,
            mode=Mode.BLOCK,
            delay_seconds=settings.default_block_delay_seconds,
            message=(
                f"You're about to spend £{transaction.amount:.2f}"
                f" at {transaction.merchant_name or 'a merchant'}."
                " Take a moment to reflect."
            ),
        )

    # Night Out mode: no friction while under budget
    new_total = total_spent + transaction.amount
    if budget is not None and new_total <= budget:
        return FrictionPrompt(
            should_prompt=False,
            mode=Mode.NIGHT_OUT,
            delay_seconds=0,
            message="",
            total_spent=new_total,
            budget=budget,
        )

    # Over budget — prompt with escalating delay
    if prompt_count >= settings.extended_delay_after_prompts:
        delay = settings.extended_delay_seconds
    else:
        delay = settings.default_night_out_delay_seconds

    return FrictionPrompt(
        should_prompt=True,
        mode=Mode.NIGHT_OUT,
        delay_seconds=delay,
        message=(
            f"£{new_total:.2f} tonight."
            f" {'£' + f'{budget - new_total:.2f}' + ' over budget.' if budget else ''}"
        ),
        total_spent=new_total,
        budget=budget,
    )
