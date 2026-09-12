import asyncio
from app.db.session import AsyncSessionLocal, init_db, engine
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth_service import register_user
from app.schemas.auth import UserCreate
from app.utils.logger import logger


async def seed():
    await init_db()
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            await register_user(
                db,
                UserCreate(
                    email="admin@example.com",
                    password="password123",
                    full_name="Admin User"
                )
            )
            logger.info("Demo user 'admin@example.com' seeded successfully!")
        except Exception as e:
            logger.info(f"Demo user exists or status: {e}")


if __name__ == "__main__":
    asyncio.run(seed())
