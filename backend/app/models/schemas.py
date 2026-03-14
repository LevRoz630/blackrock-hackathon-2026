from enum import Enum

from pydantic import BaseModel


class Mode(str, Enum):
    BLOCK = "block"
    HIGH_RISK = "high_risk"


class TransactionWebhook(BaseModel):
    token: str
    user_token: str
    amount: float
    currency_code: str = "GBP"
    merchant_name: str = ""
    merchant_category: str = ""


class WebhookResponse(BaseModel):
    approved: bool
    reason: str
    risk_score: int | None = None
    risk_flags: list[str] = []


class FrictionPrompt(BaseModel):
    show_prompt: bool
    mode: Mode
    delay_seconds: int
    message: str
    total_spent: float | None = None
    budget: float | None = None


class UserDecision(BaseModel):
    transaction_token: str
    user_token: str
    amount: float
    merchant_name: str = ""
    approved: bool
    decision_latency_ms: int | None = None


class TransactionResult(BaseModel):
    transaction_token: str
    status: str
    message: str
    bypass_id: int | None = None


class UserSettingsRequest(BaseModel):
    block_threshold: float | None = None
    high_risk_budget: float | None = None
    high_risk_window_start: str | None = None
    high_risk_window_end: str | None = None
    real_world_unit_name: str | None = None
    real_world_unit_value: float | None = None


class UserSettingsResponse(BaseModel):
    user_id: str
    block_threshold: float | None = None
    high_risk_budget: float | None = None
    high_risk_window_start: str | None = None
    high_risk_window_end: str | None = None
    real_world_unit_name: str | None = None
    real_world_unit_value: float | None = None


class FcmTokenRequest(BaseModel):
    fcm_token: str


class FcmTokenResponse(BaseModel):
    user_id: str
    fcm_token: str
