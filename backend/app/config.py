from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    marqeta_base_url: str = "https://sandbox-api.marqeta.com/v3"
    marqeta_app_token: str = ""
    marqeta_access_token: str = ""

    default_block_delay_seconds: int = 40
    default_night_out_delay_seconds: int = 30
    extended_delay_seconds: int = 45
    extended_delay_after_prompts: int = 3

    model_config = {"env_prefix": "TBYS_"}


settings = Settings()
