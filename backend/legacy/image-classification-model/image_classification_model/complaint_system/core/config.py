import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fake and Spam Complaint Detection System"
    API_V1_STR: str = "/api/v1"
    
    # Use SQLite by default for simple local setup, but allow Postgres override
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./complaint_system.db"
    )
    
    # Module thresholds and configurations
    RISK_THRESHOLD_APPROVED: int = 30
    RISK_THRESHOLD_REJECTED: int = 70
    
    DUPLICATE_DISTANCE_THRESHOLD_METERS: float = 50.0
    DUPLICATE_TIME_WINDOW_HOURS: int = 48
    TEXT_SIMILARITY_THRESHOLD: float = 0.85
    
    class Config:
        case_sensitive = True

settings = Settings()
