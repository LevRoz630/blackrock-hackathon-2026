from fastapi import APIRouter

from app.services.events import get_user_insights
from app.services.ml import (
    assess_transaction,
    get_dashboard_data,
    get_mode_suggestion,
    get_user_spending_profile,
)

router = APIRouter(prefix="/users", tags=["insights"])


@router.get("/{user_id}/insights")
async def user_insights(user_id: str) -> dict:
    return await get_user_insights(user_id)


@router.get("/{user_id}/spending-profile")
async def spending_profile(user_id: str) -> dict:
    return await get_user_spending_profile(user_id)


@router.get("/{user_id}/dashboard")
async def dashboard(user_id: str) -> dict:
    return await get_dashboard_data(user_id)


@router.get("/{user_id}/mode-suggestion")
async def mode_suggestion(user_id: str) -> dict:
    return await get_mode_suggestion(user_id)


@router.post("/{user_id}/assess")
async def assess(user_id: str, body: dict) -> dict:
    risk = await assess_transaction(
        user_id=user_id,
        amount=body["amount"],
        merchant_name=body.get("merchant_name", ""),
        merchant_category=body.get("merchant_category", ""),
    )
    return {
        "risk_score": risk.risk_score,
        "is_outlier": risk.is_outlier,
        "anomaly_score": risk.anomaly_score,
        "flags": risk.flags,
        "features": risk.features,
    }
