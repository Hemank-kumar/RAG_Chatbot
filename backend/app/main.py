from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.utils.config import settings
from app.utils.logger import logger
from app.db.session import init_db
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and pgvector extension...")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database init warning (may require postgres running): {e}")

    # Pre-warm Hugging Face embedding model in RAM for instant sub-second vector search
    try:
        import asyncio
        from app.rag.embeddings import HuggingFaceEmbeddingProvider
        logger.info("Pre-warming HuggingFace embedding model in RAM...")
        provider = HuggingFaceEmbeddingProvider()
        await asyncio.to_thread(provider.embed_query, "warmup query")
        logger.info("HuggingFace embedding model pre-warmed successfully.")
    except Exception as e:
        logger.warning(f"Embedding model pre-warm notice: {e}")

    yield
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS with explicit origin matching
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    from app.services.redis_client import get_redis_client
    redis_client = await get_redis_client()
    redis_status = "connected" if redis_client else "disabled_or_unavailable"

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "embedding_model": settings.EMBEDDING_MODEL,
        "gemini_model": settings.GEMINI_MODEL,
        "redis_cache": redis_status,
        "db_pool_size": settings.DB_POOL_SIZE
    }


app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
