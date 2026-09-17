from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.utils.config import settings
from app.utils.logger import logger
from app.db.session import init_db
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Production-safe behavior:
    - Initializes the database and pgvector extension.
    - Does NOT pre-load the HuggingFace embedding model.
    - Embedding model should be loaded lazily when it is actually needed.
    """

    logger.info("Initializing database and pgvector extension...")

    try:
        await init_db()
        logger.info("Database initialization completed.")
    except Exception as e:
        # Database initialization errors should not prevent the
        # application from starting if the database is temporarily
        # unavailable.
        logger.warning(
            f"Database init warning (may require postgres running): {e}"
        )

    # IMPORTANT:
    # Do NOT pre-warm/load SentenceTransformer here.
    #
    # The previous implementation loaded the HuggingFace embedding
    # model during application startup. On low-memory Render instances
    # this caused the process to exceed the memory limit.
    #
    # The embedding provider should load the model lazily when required.

    yield

    logger.info("Shutting down application...")


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


# ============================================================
# CORS Configuration
# ============================================================

# Local development origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]


app.add_middleware(
    CORSMiddleware,

    # Explicit local development origins
    allow_origins=origins,

    # Allow Vercel deployments.
    #
    # This supports:
    # https://your-project.vercel.app
    # https://your-preview-project.vercel.app
    #
    # It intentionally does not allow arbitrary Render origins.
    allow_origin_regex=r"https://.*\.vercel\.app",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Global Exception Handler
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    """
    Global fallback error handler.

    Prevents unhandled exceptions from returning raw stack traces
    to clients while preserving detailed logs on the backend.
    """

    logger.error(
        f"Unhandled error on "
        f"{request.method} "
        f"{request.url.path}: {exc}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": (
                "An internal server error occurred. "
                "Please try again later."
            )
        },
    )


# ============================================================
# Health Check
# ============================================================

@app.get(
    f"{settings.API_V1_STR}/health",
    tags=["Health"],
)
async def health_check():
    """
    Health endpoint used by monitoring/deployment systems.

    Checks Redis availability without making Redis mandatory.
    """

    from app.services.redis_client import get_redis_client

    try:
        redis_client = await get_redis_client()

        redis_status = (
            "connected"
            if redis_client
            else "disabled_or_unavailable"
        )

    except Exception as e:
        logger.warning(
            f"Redis health check warning: {e}"
        )

        redis_status = "disabled_or_unavailable"

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "embedding_model": settings.EMBEDDING_MODEL,
        "gemini_model": settings.GEMINI_MODEL,
        "redis_cache": redis_status,
        "db_pool_size": settings.DB_POOL_SIZE,
    }


# ============================================================
# API Routes
# ============================================================

app.include_router(
    api_router,
    prefix=settings.API_V1_STR,
)


# ============================================================
# Local Development Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn

    # Render provides PORT through the environment.
    #
    # For local development:
    #     PORT is normally not set
    #     -> defaults to 8000
    #
    # For Render:
    #     PORT is provided by Render
    #     -> typically 10000
    #
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )