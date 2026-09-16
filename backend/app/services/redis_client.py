import json
import hashlib
from typing import Optional
from app.utils.config import settings
from app.utils.logger import logger

_redis_client = None
_redis_available = False


async def get_redis_client():
    global _redis_client, _redis_available
    if not settings.ENABLE_REDIS_CACHE:
        return None

    if _redis_client is not None:
        return _redis_client if _redis_available else None

    try:
        import redis.asyncio as aioredis
        use_ssl = "upstash.io" in settings.REDIS_HOST.lower() or settings.REDIS_PORT == 6380
        _redis_client = aioredis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            ssl=use_ssl,
            ssl_cert_reqs=None if use_ssl else "required",
            decode_responses=True,
            socket_timeout=3.0
        )
        await _redis_client.ping()
        _redis_available = True
        logger.info(f"Successfully connected to Redis cache ({settings.REDIS_HOST}:{settings.REDIS_PORT}).")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis cache connection unavailable ({e}). Operating with in-memory / direct DB mode.")
        _redis_available = False
        _redis_client = None
        return None


class CacheService:
    @staticmethod
    def generate_cache_key(query: str, knowledge_base_id: str, response_mode: str) -> str:
        raw = f"{query.strip().lower()}:{knowledge_base_id}:{response_mode}"
        return f"rag:cache:{hashlib.sha256(raw.encode('utf-8')).hexdigest()}"

    @staticmethod
    async def get_cached_response(query: str, knowledge_base_id: str, response_mode: str) -> Optional[dict]:
        client = await get_redis_client()
        if not client:
            return None

        try:
            key = CacheService.generate_cache_key(query, knowledge_base_id, response_mode)
            val = await client.get(key)
            if val:
                logger.info(f"[CacheService] Cache HIT for key: {key[:20]}...")
                return json.loads(val)
        except Exception as e:
            logger.warning(f"[CacheService] Error reading from cache: {e}")
        return None

    @staticmethod
    async def set_cached_response(query: str, knowledge_base_id: str, response_mode: str, response_data: dict, ttl: int = None):
        client = await get_redis_client()
        if not client:
            return

        if ttl is None:
            ttl = settings.CACHE_TTL_SECONDS

        try:
            key = CacheService.generate_cache_key(query, knowledge_base_id, response_mode)
            await client.setex(key, ttl, json.dumps(response_data))
            logger.info(f"[CacheService] Cached response set for key: {key[:20]} (TTL: {ttl}s)")
        except Exception as e:
            logger.warning(f"[CacheService] Error setting cache: {e}")
