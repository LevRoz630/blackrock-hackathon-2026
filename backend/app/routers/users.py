from fastapi import APIRouter

from app.db import get_db
from app.models.schemas import (
    FcmTokenRequest,
    FcmTokenResponse,
    UserSettingsRequest,
    UserSettingsResponse,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/{user_id}/settings", response_model=UserSettingsResponse)
async def sync_settings(user_id: str, body: UserSettingsRequest) -> UserSettingsResponse:
    db = await get_db()
    await db.execute(
        """INSERT INTO user_settings
               (user_id, block_threshold, high_risk_budget,
                high_risk_window_start, high_risk_window_end,
                real_world_unit_name, real_world_unit_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
               block_threshold = excluded.block_threshold,
               high_risk_budget = excluded.high_risk_budget,
               high_risk_window_start = excluded.high_risk_window_start,
               high_risk_window_end = excluded.high_risk_window_end,
               real_world_unit_name = excluded.real_world_unit_name,
               real_world_unit_value = excluded.real_world_unit_value""",
        (
            user_id,
            body.block_threshold,
            body.high_risk_budget,
            body.high_risk_window_start,
            body.high_risk_window_end,
            body.real_world_unit_name,
            body.real_world_unit_value,
        ),
    )
    await db.commit()
    return UserSettingsResponse(user_id=user_id, **body.model_dump())


@router.post("/{user_id}/fcm-token", response_model=FcmTokenResponse)
async def register_fcm_token(user_id: str, body: FcmTokenRequest) -> FcmTokenResponse:
    db = await get_db()
    await db.execute(
        """INSERT INTO fcm_tokens (user_id, fcm_token) VALUES (?, ?)
           ON CONFLICT(user_id) DO UPDATE SET fcm_token = excluded.fcm_token""",
        (user_id, body.fcm_token),
    )
    await db.commit()
    return FcmTokenResponse(user_id=user_id, fcm_token=body.fcm_token)
