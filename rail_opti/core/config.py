"""Core configuration and settings module for RAILOPT AI."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "RAILOPT AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = "AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways (SIH26027)"
    
    # Environment & Demo Mode
    DEMO_MODE: bool = True
    DEMO_DATA_DISCLAIMER: str = "DEMO / SIMULATED DATA — NOT CONNECTED TO LIVE INDIAN RAILWAYS SYSTEMS"
    
    # Database
    DATABASE_URL: str = "sqlite:///./railopt.db"
    
    # Security & JWT
    SECRET_KEY: str = "sih26027_railopt_ai_super_secret_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")



settings = Settings()
