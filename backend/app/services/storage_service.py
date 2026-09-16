import os
import httpx
from typing import Optional
from app.utils.config import settings
from app.utils.logger import logger


class StorageService:
    _bucket_checked = False

    @classmethod
    async def ensure_bucket_public(cls):
        """
        Ensures the Supabase storage bucket exists and is set to Public access.
        """
        if cls._bucket_checked or not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return

        bucket = settings.STORAGE_BUCKET or "rag-documents"
        supabase_url = settings.SUPABASE_URL.rstrip("/")

        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
            "apiKey": settings.SUPABASE_SERVICE_KEY
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{supabase_url}/storage/v1/bucket/{bucket}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    if not data.get("public"):
                        await client.put(f"{supabase_url}/storage/v1/bucket/{bucket}", headers=headers, json={"public": True})
                        logger.info(f"Updated Supabase storage bucket '{bucket}' to Public.")
                elif res.status_code == 404:
                    await client.post(f"{supabase_url}/storage/v1/bucket", headers=headers, json={"id": bucket, "name": bucket, "public": True})
                    logger.info(f"Created public Supabase storage bucket '{bucket}'.")

                cls._bucket_checked = True
        except Exception as e:
            logger.warning(f"Could not check/ensure Supabase bucket status: {e}")

    @classmethod
    async def upload_file_to_supabase(
        cls,
        local_file_path: str,
        destination_path: str,
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """
        Uploads a file to Supabase Cloud Storage bucket.
        Returns the public URL if successful, or None if disabled/failed.
        """
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            logger.info("Supabase storage credentials not configured. Using local disk storage.")
            return None

        await cls.ensure_bucket_public()

        bucket = settings.STORAGE_BUCKET or "rag-documents"
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        endpoint = f"{supabase_url}/storage/v1/object/{bucket}/{destination_path}"

        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
            "apiKey": settings.SUPABASE_SERVICE_KEY,
            "x-upsert": "true",
            "Content-Type": content_type
        }

        try:
            with open(local_file_path, "rb") as f:
                file_data = f.read()

            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(endpoint, headers=headers, content=file_data)
                if res.status_code in (200, 201):
                    public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{destination_path}"
                    logger.info(f"Successfully uploaded '{destination_path}' to Supabase Storage: {public_url}")
                    return public_url
                else:
                    logger.error(f"Failed to upload to Supabase Storage ({res.status_code}): {res.text}")
                    return None
        except Exception as e:
            logger.error(f"Error uploading file to Supabase Storage: {e}")
            return None

    @classmethod
    async def delete_file_from_supabase(cls, destination_path: str) -> bool:
        """
        Deletes a file from Supabase Cloud Storage bucket.
        """
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return False

        bucket = settings.STORAGE_BUCKET or "rag-documents"
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        endpoint = f"{supabase_url}/storage/v1/object/{bucket}/{destination_path}"

        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
            "apiKey": settings.SUPABASE_SERVICE_KEY
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.delete(endpoint, headers=headers)
                return res.status_code in (200, 204)
        except Exception as e:
            logger.warning(f"Failed to delete file from Supabase Storage: {e}")
            return False
