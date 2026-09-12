import os
import shutil
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.db.models import Document, DocumentChunk, KnowledgeBase, User
from app.rag.loaders import DocumentLoader
from app.rag.chunking import StructureAwareChunker
from app.rag.embeddings import get_embedding_provider
from app.utils.config import settings
from app.utils.logger import logger

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".markdown", ".html", ".htm"}


class DocumentService:
    @staticmethod
    async def process_and_index_document(
        db: AsyncSession,
        file: UploadFile,
        knowledge_base_id: str,
        user: User
    ) -> Document:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed: PDF, DOCX, TXT, MD, HTML"
            )

        # Verify KnowledgeBase ownership
        kb_stmt = select(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id)
        kb_res = await db.execute(kb_stmt)
        kb = kb_res.scalar_one_or_none()
        if not kb:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found.")

        workspace_id = kb.workspace_id

        # Save file to disk
        kb_dir = os.path.join(settings.UPLOAD_DIR, knowledge_base_id)
        os.makedirs(kb_dir, exist_ok=True)
        file_path = os.path.join(kb_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(file_path)
        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )

        # Create Document record
        document = Document(
            filename=file.filename,
            file_type=ext.lstrip("."),
            file_path=file_path,
            file_size=file_size,
            status="processing",
            knowledge_base_id=knowledge_base_id,
            workspace_id=workspace_id
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        try:
            # 1. Load & Extract Pages/Sections
            pages = DocumentLoader.load_document(file_path, file.filename)
            document.page_count = len(pages)

            # 2. Structure-Aware Chunking
            chunker = StructureAwareChunker(chunk_size=500, chunk_overlap=100)
            chunk_dicts = chunker.chunk_document(
                pages=pages,
                document_id=document.id,
                filename=file.filename,
                knowledge_base_id=knowledge_base_id,
                workspace_id=workspace_id
            )

            # 3. Generate Embeddings using Hugging Face provider
            embedding_provider = get_embedding_provider()
            contents = [c["content"] for c in chunk_dicts]
            embeddings = embedding_provider.embed_documents(contents)

            # 4. Save Chunks to Database
            db_chunks = []
            for idx, c in enumerate(chunk_dicts):
                vec = embeddings[idx] if idx < len(embeddings) else None
                db_chunk = DocumentChunk(
                    document_id=document.id,
                    knowledge_base_id=knowledge_base_id,
                    workspace_id=workspace_id,
                    chunk_index=c["chunk_index"],
                    content=c["content"],
                    metadata_json=c["metadata"],
                    embedding=vec
                )
                db_chunks.append(db_chunk)

            db.add_all(db_chunks)
            document.chunk_count = len(db_chunks)
            document.status = "indexed"
            await db.commit()
            await db.refresh(document)

            logger.info(f"Successfully processed document '{file.filename}' ({len(db_chunks)} chunks).")
            return document

        except Exception as e:
            logger.error(f"Failed to process document {file.filename}: {e}")
            document.status = "error"
            document.error_message = str(e)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to index document: {str(e)}"
            )

    @staticmethod
    async def reindex_document(db: AsyncSession, document_id: str, user: User) -> Document:
        stmt = select(Document).where(Document.id == document_id)
        res = await db.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        # Delete existing chunks
        del_stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
        await db.execute(del_stmt)

        # Re-load pages & re-chunk
        pages = DocumentLoader.load_document(doc.file_path, doc.filename)
        chunker = StructureAwareChunker()
        chunk_dicts = chunker.chunk_document(
            pages=pages,
            document_id=doc.id,
            filename=doc.filename,
            knowledge_base_id=doc.knowledge_base_id,
            workspace_id=doc.workspace_id
        )

        embedding_provider = get_embedding_provider()
        embeddings = embedding_provider.embed_documents([c["content"] for c in chunk_dicts])

        db_chunks = []
        for idx, c in enumerate(chunk_dicts):
            db_chunk = DocumentChunk(
                document_id=doc.id,
                knowledge_base_id=doc.knowledge_base_id,
                workspace_id=doc.workspace_id,
                chunk_index=c["chunk_index"],
                content=c["content"],
                metadata_json=c["metadata"],
                embedding=embeddings[idx] if idx < len(embeddings) else None
            )
            db_chunks.append(db_chunk)

        db.add_all(db_chunks)
        doc.chunk_count = len(db_chunks)
        doc.status = "indexed"
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: str, user: User):
        stmt = select(Document).where(Document.id == document_id)
        res = await db.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception as e:
                logger.warning(f"Could not delete physical file {doc.file_path}: {e}")

        await db.delete(doc)
        await db.commit()
