import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Agent RAG Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "production-secret-key-super-secure-rag-platform"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "rag_db"
    DATABASE_URL: Optional[str] = None

    # Default LLM Provider selection (gemini, ollama, mistral, deepseek, kimi)
    LLM_PROVIDER: str = "gemini"

    # Provider Configurations
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-chat"

    KIMI_API_KEY: str = ""
    KIMI_MODEL: str = "moonshot-v1-8k"

    # Embeddings Configuration
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_DIMENSION: int = 384  # Default BGE-small dimension

    # RAG Settings
    HYBRID_ALPHA: float = 0.5
    TOP_K_RETRIEVAL: int = 10
    TOP_K_RERANK: int = 5
    MAX_VERIFICATION_RETRIES: int = 2

    # Storage Settings
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "data", "uploads")
    MAX_FILE_SIZE_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
