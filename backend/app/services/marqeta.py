import httpx

from app.config import settings


class MarqetaClient:
    """Stub client for the Marqeta sandbox API."""

    def __init__(self) -> None:
        self.base_url = settings.marqeta_base_url
        self.auth = (settings.marqeta_app_token, settings.marqeta_access_token)

    async def approve_transaction(self, transaction_token: str) -> dict:
        """Send an approval for a JIT funding request."""
        # TODO: implement real Marqeta API call
        return {"token": transaction_token, "status": "approved"}

    async def decline_transaction(self, transaction_token: str) -> dict:
        """Send a decline for a JIT funding request."""
        # TODO: implement real Marqeta API call
        return {"token": transaction_token, "status": "declined"}
