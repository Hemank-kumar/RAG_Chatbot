import os
from typing import List, Dict, Any
from pypdf import PdfReader
from docx import Document as DocxDocument
from bs4 import BeautifulSoup
import markdown

from app.utils.logger import logger


class DocumentLoader:
    @staticmethod
    def load_document(file_path: str, filename: str) -> List[Dict[str, Any]]:
        """
        Loads document content and extracts structured pages/sections.
        Returns a list of pages/sections with keys:
        - page_number: int
        - section: str
        - text: str
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return DocumentLoader._load_pdf(file_path)
        elif ext == ".docx":
            return DocumentLoader._load_docx(file_path)
        elif ext == ".txt":
            return DocumentLoader._load_txt(file_path)
        elif ext in [".md", ".markdown"]:
            return DocumentLoader._load_markdown(file_path)
        elif ext in [".html", ".htm"]:
            return DocumentLoader._load_html(file_path)
        else:
            # Fallback to plain text
            return DocumentLoader._load_txt(file_path)

    @staticmethod
    def _load_pdf(file_path: str) -> List[Dict[str, Any]]:
        pages = []
        try:
            reader = PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append({
                        "page_number": idx + 1,
                        "section": f"Page {idx + 1}",
                        "text": text.strip()
                    })
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {e}")
            raise ValueError(f"Failed to process PDF: {str(e)}")
        
        if not pages:
            pages.append({"page_number": 1, "section": "Document", "text": ""})
        return pages

    @staticmethod
    def _load_docx(file_path: str) -> List[Dict[str, Any]]:
        pages = []
        try:
            doc = DocxDocument(file_path)
            current_section = "Main"
            section_text = []
            page_num = 1

            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    continue
                if p.style.name.startswith("Heading"):
                    if section_text:
                        pages.append({
                            "page_number": page_num,
                            "section": current_section,
                            "text": "\n".join(section_text)
                        })
                        section_text = []
                    current_section = text
                else:
                    section_text.append(text)
            
            if section_text:
                pages.append({
                    "page_number": page_num,
                    "section": current_section,
                    "text": "\n".join(section_text)
                })
        except Exception as e:
            logger.error(f"Error reading DOCX {file_path}: {e}")
            raise ValueError(f"Failed to process DOCX: {str(e)}")

        if not pages:
            pages.append({"page_number": 1, "section": "Document", "text": ""})
        return pages

    @staticmethod
    def _load_txt(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return [{"page_number": 1, "section": "Document", "text": content.strip()}]

    @staticmethod
    def _load_markdown(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        lines = content.splitlines()
        sections = []
        current_heading = "Overview"
        current_text = []

        for line in lines:
            if line.startswith("#"):
                if current_text:
                    sections.append({
                        "page_number": 1,
                        "section": current_heading,
                        "text": "\n".join(current_text).strip()
                    })
                    current_text = []
                current_heading = line.lstrip("#").strip()
            else:
                current_text.append(line)

        if current_text:
            sections.append({
                "page_number": 1,
                "section": current_heading,
                "text": "\n".join(current_text).strip()
            })

        return sections if sections else [{"page_number": 1, "section": "Markdown Document", "text": content.strip()}]

    @staticmethod
    def _load_html(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()

        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_text = "\n".join(lines)

        return [{"page_number": 1, "section": "HTML Document", "text": cleaned_text}]
