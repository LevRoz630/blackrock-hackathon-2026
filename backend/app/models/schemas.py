from pydantic import BaseModel
from enum import Enum


class Mode(str, Enum):
    BLOCK = "block"
    NIGHT_OUT = "night_out"


class TransactionWebhook(BaseModel):
    token: str
    user_token: str
    amount: float
    currency_code: str = "GBP"
    merchant_name: str = ""
    merchant_category: str = ""


class FrictionPrompt(BaseModel):
    should_prompt: bool
    mode: Mode
    delay_seconds: int
    message: str
    total_spent: float | None = None
    budget: float | None = None


class UserDecision(BaseModel):
    transaction_token: str
    approved: bool


class TransactionResult(BaseModel):
    transaction_token: str
    status: str
    message: str
