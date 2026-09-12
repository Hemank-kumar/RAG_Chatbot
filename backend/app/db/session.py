import os
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.utils.config import settings
from app.utils.logger import logger

DATABASE_URL = settings.get_database_url()

# Check if SQLite fallback should be used
IS_SQLITE = "sqlite" in DATABASE_URL.lower()

if IS_SQLITE:
    os.makedirs(os.path.dirname(os.path.abspath("./data/rag_db.sqlite")), exist_ok=True)
    engine = create_async_engine(
        "sqlite+aiosqlite:///./data/rag_db.sqlite",
        echo=False,
        future=True,
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    global engine, AsyncSessionLocal, IS_SQLITE
    if not IS_SQLITE:
        try:
            async with engine.begin() as conn:
                from sqlalchemy import text
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Successfully connected to PostgreSQL + pgvector.")
                return
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database (rag_db.sqlite)...")
            IS_SQLITE = True
            os.makedirs(os.path.dirname(os.path.abspath("./data/rag_db.sqlite")), exist_ok=True)
            engine = create_async_engine(
                "sqlite+aiosqlite:///./data/rag_db.sqlite",
                echo=False,
                future=True,
            )
            AsyncSessionLocal = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Successfully initialized local SQLite database.")
