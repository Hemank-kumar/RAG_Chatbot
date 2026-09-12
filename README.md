# Enterprise Multi-Agent RAG Knowledge Assistant Platform

A production-ready, evidence-grounded **Multi-Agent Retrieval-Augmented Generation (RAG)** platform. Built with **Python 3.11 FastAPI**, **PostgreSQL + pgvector** (with automatic zero-config **SQLite + Python Cosine Similarity** fallback), **Multi-LLM Provider Architecture** (Gemini 2.0, Ollama, Mistral AI, DeepSeek, Kimi/Moonshot), local **Hugging Face Sentence Transformers** (`BAAI/bge-small-en-v1.5`), and a modern **Next.js 14 (App Router)** TypeScript frontend.

---

## 🌟 Key Architecture & Multi-Agent Flow

```text
                           User Question
                                 ↓
      Query Understanding Agent (Intent, Rewriting, Injection Protection)
                                 ↓
            Query Decomposition Agent (Complex query splitting)
                                 ↓
Hybrid Retrieval (pgvector Cosine Search / SQLite Cosine Sim + Keyword RRF)
                                 ↓
        Reranking Agent (Cross-Encoder / Cosine Relevance Scoring)
                                 ↓
Context Compression Agent (Deduplication & [S1],[S2] Citation Tagging)
                                 ↓
       Relevance Score Filter (Threshold < 0.15 → Fallback Message)
                                 ↓
Answer Generation Agent (Multi-LLM: Gemini, Ollama, Mistral, DeepSeek, Kimi)
                                 ↓
Verification Agent (Factual Audit, Citation Verification & Anti-Hallucination)
                                 ↓
              Follow-Up Agent (Suggested 2-4 Questions)
                                 ↓
               Streaming SSE Response to Next.js Frontend
```

---

## 🚀 Key Capabilities & Features

- **Multi-LLM Provider Integration**:
  - **Gemini 2.0 / 2.5**: Powered by `google-genai` and `google-generativeai` SDKs.
  - **Ollama**: Local and cloud open-weights models (`llama3.2`, `deepseek-r1`, `mistral`, etc.).
  - **Mistral AI**: `mistral-small-latest`, `mistral-large-latest`.
  - **DeepSeek API**: `deepseek-chat`, `deepseek-coder`.
  - **Kimi / Moonshot AI**: `moonshot-v1-8k`, `moonshot-v1-32k`.
- **Zero-Config Database Engine**:
  - Automatic fallback to **SQLite (`sqlite+aiosqlite:///./data/rag_db.sqlite`)** with in-memory Python Cosine Similarity and tokenized keyword matching if PostgreSQL/pgvector is unavailable.
- **Direct & Preamble-Free Synthesis**:
  - Strict system prompt rules prohibiting filler phrases (`"Based on the retrieved context documents..."`). Answers start immediately with direct explanations, bold key terms, and Markdown summary tables.
- **Strict Relevance Thresholding & Anti-Hallucination**:
  - Context relevance filtering (`score < 0.15`). If documents lack sufficient evidence, returns a clean, polite fallback: *"I couldn't find relevant information in the uploaded documents to answer your question."*
- **Multi-Tenant Workspace Isolation**:
  - Scopes all conversations, documents, and vector embeddings strictly to specific User Workspaces and Knowledge Bases.
- **Structure-Aware Document Ingestion**:
  - Preserves headings, sections, page numbers, and metadata for **PDF, DOCX, TXT, Markdown, and HTML** documents.
- **Interactive Citations & Knowledge Base References**:
  - Clickable `[S1]`, `[S2]` citation tags with live popovers showing page numbers, document source names, and exact excerpt previews.
  - Automatic **Knowledge Base Source Reference** footers at the end of answers.

---

## 🧰 Technology Stack

- **Backend Framework**: Python 3.11+, FastAPI, Pydantic v2, AsyncIO, SQLAlchemy 2.0 Async.
- **Database Layer**: PostgreSQL + `pgvector` extension (Production) / SQLite + `aiosqlite` (Zero-Config Development).
- **Embeddings**: Hugging Face `sentence-transformers` (`BAAI/bge-small-en-v1.5`, 384-dim).
- **LLM Engine**: Multi-Provider Factory (Gemini 2.0, Ollama, Mistral AI, DeepSeek, Kimi/Moonshot).
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Containerization**: Docker & Docker Compose.

---

## ⚡ Quickstart

### Option A: Local Execution (Zero-Config SQLite)

#### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Run Next.js dev server
npm run dev
```

- **Frontend App**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/api/v1/docs`
- **Default Admin Account**: `admin@example.com` / `password123`

---

### Option B: Docker Compose (PostgreSQL + pgvector)

```bash
# 1. Copy environment template
cp backend/.env.example backend/.env

# 2. Build and start containers
docker compose up --build
```

---

## 📡 API Reference Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user account |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access token |
| `GET` | `/api/v1/auth/me` | Fetch current user profile |
| `GET` | `/api/v1/workspaces` | List user workspaces |
| `POST` | `/api/v1/workspaces` | Create a workspace |
| `GET` | `/api/v1/knowledge-bases` | List knowledge bases in workspace |
| `POST` | `/api/v1/knowledge-bases` | Create a knowledge base |
| `POST` | `/api/v1/documents/upload` | Upload & index PDF, DOCX, TXT, MD, or HTML file |
| `GET` | `/api/v1/documents` | List uploaded documents |
| `POST` | `/api/v1/documents/{id}/reindex` | Re-chunk & re-embed document |
| `DELETE`| `/api/v1/documents/{id}` | Delete document & vector embeddings |
| `POST` | `/api/v1/chat` | Execute multi-agent SSE streaming chat |
| `GET` | `/api/v1/conversations` | List conversation history |
| `GET` | `/api/v1/conversations/{id}` | Fetch full conversation with citations |
| `DELETE`| `/api/v1/conversations/{id}` | Delete conversation (HTTP 204) |
| `POST` | `/api/v1/messages/{id}/feedback` | Submit message feedback rating |

---

## 🧪 Testing & Evaluation

### Run Pytest Unit & Integration Suite

```bash
cd backend
pytest tests/ -v
```

### Run RAG Benchmark Evaluation

Evaluates retrieval precision, recall, citation accuracy, answer grounding, and latency:

```bash
cd backend
python -m app.evaluation.run
```

---

## 🔒 Security & Injection Defense

1. **Untrusted Data Boundaries**: Document text is isolated inside `<BEGIN UNTRUSTED DOCUMENT CONTEXT>` tags.
2. **System Instruction Integrity**: LLM system prompts strictly forbid following instructions contained inside retrieved documents.
3. **Multi-Tenant Isolation**: SQL queries and vector operations enforce `user_id` and `workspace_id` scoping to prevent cross-tenant leaks.
4. **Direct Password Hashing**: Modern `bcrypt` password hashing without passlib dependencies.

---

## 📄 License
MIT License. Open for enterprise and commercial deployment.
