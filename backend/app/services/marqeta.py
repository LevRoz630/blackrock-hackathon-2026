from app.config import settings


class MarqetaClient:
    def __init__(self) -> None:
        self.base_url = settings.marqeta_base_url
        self.auth = (settings.marqeta_app_token, settings.marqeta_access_token)

    async def approve_transaction(self, transaction_token: str) -> dict:
        # TODO: real Marqeta API call
        return {"token": transaction_token, "status": "approved"}

    async def decline_transaction(self, transaction_token: str) -> dict:
        # TODO: real Marqeta API call
        return {"token": transaction_token, "status": "declined"}
