import re
from typing import List, Dict, Any
from datetime import datetime, timezone


class StructureAwareChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(
        self,
        pages: List[Dict[str, Any]],
        document_id: str,
        filename: str,
        knowledge_base_id: str,
        workspace_id: str
    ) -> List[Dict[str, Any]]:
        """
        Takes extracted pages/sections and generates chunks preserving section/page metadata.
        """
        chunks = []
        global_chunk_index = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            section = page.get("section", "General")
            text = page.get("text", "")

            if not text.strip():
                continue

            # Split into paragraphs/paragraphs or sentences
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
            
            current_chunk_paragraphs = []
            current_length = 0

            for paragraph in paragraphs:
                para_len = len(paragraph)
                
                # If a single paragraph exceeds chunk size, split by sentences
                if para_len > self.chunk_size:
                    if current_chunk_paragraphs:
                        chunk_text = "\n\n".join(current_chunk_paragraphs)
                        chunks.append(self._create_chunk_dict(
                            content=chunk_text,
                            chunk_index=global_chunk_index,
                            document_id=document_id,
                            filename=filename,
                            page_number=page_num,
                            section=section,
                            knowledge_base_id=knowledge_base_id,
                            workspace_id=workspace_id
                        ))
                        global_chunk_index += 1
                        current_chunk_paragraphs = []
                        current_length = 0

                    sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                    sub_text_acc = []
                    sub_len = 0
                    for sent in sentences:
                        if sub_len + len(sent) > self.chunk_size and sub_text_acc:
                            chunks.append(self._create_chunk_dict(
                                content=" ".join(sub_text_acc),
                                chunk_index=global_chunk_index,
                                document_id=document_id,
                                filename=filename,
                                page_number=page_num,
                                section=section,
                                knowledge_base_id=knowledge_base_id,
                                workspace_id=workspace_id
                            ))
                            global_chunk_index += 1
                            # Handle overlap
                            overlap_sents = sub_text_acc[-1:] if sub_text_acc else []
                            sub_text_acc = overlap_sents + [sent]
                            sub_len = sum(len(s) for s in sub_text_acc)
                        else:
                            sub_text_acc.append(sent)
                            sub_len += len(sent)
                    if sub_text_acc:
                        chunks.append(self._create_chunk_dict(
                            content=" ".join(sub_text_acc),
                            chunk_index=global_chunk_index,
                            document_id=document_id,
                            filename=filename,
                            page_number=page_num,
                            section=section,
                            knowledge_base_id=knowledge_base_id,
                            workspace_id=workspace_id
                        ))
                        global_chunk_index += 1
                else:
                    if current_length + para_len > self.chunk_size and current_chunk_paragraphs:
                        chunk_text = "\n\n".join(current_chunk_paragraphs)
                        chunks.append(self._create_chunk_dict(
                            content=chunk_text,
                            chunk_index=global_chunk_index,
                            document_id=document_id,
                            filename=filename,
                            page_number=page_num,
                            section=section,
                            knowledge_base_id=knowledge_base_id,
                            workspace_id=workspace_id
                        ))
                        global_chunk_index += 1
                        
                        # Apply overlap by keeping last paragraph if small enough
                        if len(current_chunk_paragraphs[-1]) < self.chunk_overlap:
                            current_chunk_paragraphs = [current_chunk_paragraphs[-1], paragraph]
                            current_length = sum(len(p) for p in current_chunk_paragraphs)
                        else:
                            current_chunk_paragraphs = [paragraph]
                            current_length = para_len
                    else:
                        current_chunk_paragraphs.append(paragraph)
                        current_length += para_len

            if current_chunk_paragraphs:
                chunk_text = "\n\n".join(current_chunk_paragraphs)
                chunks.append(self._create_chunk_dict(
                    content=chunk_text,
                    chunk_index=global_chunk_index,
                    document_id=document_id,
                    filename=filename,
                    page_number=page_num,
                    section=section,
                    knowledge_base_id=knowledge_base_id,
                    workspace_id=workspace_id
                ))
                global_chunk_index += 1

        return chunks

    def _create_chunk_dict(
        self,
        content: str,
        chunk_index: int,
        document_id: str,
        filename: str,
        page_number: int,
        section: str,
        knowledge_base_id: str,
        workspace_id: str
    ) -> Dict[str, Any]:
        return {
            "chunk_index": chunk_index,
            "content": content,
            "metadata": {
                "document_id": document_id,
                "source": filename,
                "page_number": page_number,
                "section": section,
                "knowledge_base_id": knowledge_base_id,
                "workspace_id": workspace_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
