import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./smarterp.db"
    secret_key: str = "smarterp_super_secret_key_change_me_in_production_12345"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    chroma_db_path: str = "./chroma_db"

    # Support reading from .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
