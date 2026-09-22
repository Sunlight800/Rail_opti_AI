"""Core configuration and settings module for RAILOPT AI."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any, Union
import json


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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Any) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return str(v)
    
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
        "https://rail-opt-ai.vercel.app",
        "https://railopt-ai.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "https://rail-opt-ai.vercel.app",
            "https://railopt-ai.vercel.app",
        ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")



settings = Settings()

