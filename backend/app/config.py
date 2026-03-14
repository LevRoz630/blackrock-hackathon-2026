from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    marqeta_base_url: str = "https://sandbox-api.marqeta.com/v3"
    marqeta_app_token: str = ""
    marqeta_access_token: str = ""

    block_delay_seconds: int = 40

    model_config = {"env_prefix": "TBYS_"}


settings = Settings()
