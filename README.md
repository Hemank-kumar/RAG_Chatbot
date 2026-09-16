# Enterprise Multi-Agent RAG Knowledge Assistant Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7_Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-ready, evidence-grounded Multi-Agent Retrieval-Augmented Generation (RAG) platform featuring 8 LLM providers, hybrid vector + keyword search, multi-agent verification, interactive 3D WebGL vector visualization, and zero-config local execution.**

[Key Features](#-key-capabilities--innovations) • [Architecture](#-system-architecture--multi-agent-workflow) • [Tech Stack](#-technology-stack) • [Quickstart](#-quickstart-guide) • [API Reference](#-api-reference-endpoints) • [Evaluation](#-testing--rag-benchmarks)

</div>

---

## 🌟 Overview

The **Enterprise Multi-Agent RAG Knowledge Assistant Platform** (`AgentRAG AI`) is engineered for organizations demanding deterministic, fact-verified, and citation-backed intelligence over proprietary document repositories.

Rather than relying on naive single-shot semantic search, the platform employs a coordinated **Multi-Agent Pipeline** that decomposes user intent, searches across dense vector embeddings and sparse keyword indices using **Reciprocal Rank Fusion (RRF)**, reranks candidate passages, filters low-relevance noise, verifies answer grounding against hallucinations, and streams answers with clickable interactive citations.

---

## 🏗️ System Architecture & Multi-Agent Workflow

```
                             ┌────────────────────────┐
                             │     User Question      │
                             └───────────┬────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │          Query Understanding Agent              │
                 │  - Intent Extraction & Scope Classification     │
                 │  - Prompt Injection & Jailbreak Defense         │
                 │  - Context-Aware Query Rewriting                │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │          Query Decomposition Agent              │
                 │  - Evaluates Question Complexity                │
                 │  - Splits Multi-Hop Queries into Sub-Questions  │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │             Hybrid Retrieval Engine             │
                 │  ┌────────────────────────┬───────────────────┐ │
                 │  │ Dense Vector Search    │ Sparse Keyword    │ │
                 │  │ (pgvector Cosine /     │ (PostgreSQL FTS / │ │
                 │  │  SQLite Python Sim)    │  Tokenized ILIKE) │ │
                 │  └───────────┬────────────┴───────────┬───────┘ │
                 │              └────────────┬───────────┘         │
                 │                           ▼                     │
                 │           Reciprocal Rank Fusion (RRF)          │
                 │             Score = α·R_vec + (1-α)·R_kw        │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │                Reranking Agent                  │
                 │  - Cross-Encoder / Cosine Relevance Scoring     │
                 │  - Top-K Candidate Pruning                     │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │            Context Compression Agent            │
                 │  - Deduplication & Context Window Packing       │
                 │  - Citation Anchor Tagging ([S1], [S2], ...)    │
                 └───────────────────────┬─────────────────────────┘
                                         │
                         Score Threshold Check (Score ≥ 0.15?)
                                    /         \
                         YES       /           \       NO / Out-of-Domain
                                  ▼             ▼
  ┌─────────────────────────────────┐    ┌───────────────────────────────────┐
  │     Answer Generation Agent     │    │   Web Search Fallback Agent       │
  │  - Direct, Preamble-Free Style  │    │  - Prompts User for Web Consent   │
  │  - Multi-LLM Provider Engine    │    │  - DuckDuckGo / Tavily API Search │
  │  - Markdown Tables & Bold Terms │    │  - Real-Time Web Citations        │
  └───────────────┬─────────────────┘    └─────────────────┬─────────────────┘
                  │                                        │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────────────┐
                 │               Verification Agent                │
                 │  - Factual Grounding & Hallucination Audit      │
                 │  - Strict Citation-to-Evidence Verification     │
                 │  - Computes Numerical Confidence Score          │
                 └───────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────────────┐
                 │                Follow-Up Agent                  │
                 │  - Formulates 2-4 High-Relevance Next Questions │
                 └───────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────────────┐
                 │      Streaming SSE Delivery to Frontend         │
                 │  - Real-Time Token Generation                   │
                 │  - Step-by-Step Multi-Agent Progress Badges     │
                 │  - Interactive [S1] Popovers & 3D WebGL Sphere  │
                 └─────────────────────────────────────────────────┘
```

---

## 🚀 Key Capabilities & Innovations

### 1. 🤖 Multi-Agent Orchestration Swarm
- **Query Understanding Agent**: Normalizes queries, removes conversational noise, resolves ambiguity from conversation history, and screens for prompt injection attempts.
- **Decomposition Agent**: Automatically detects complex comparative questions (e.g., *"Compare refund policy between Tier A and Tier B after 30 days"*) and splits them into distinct retrieval sub-queries.
- **Hybrid Retrieval & RRF**: Melds dense semantic similarity (`BAAI/bge-small-en-v1.5`, 384 dimensions) with sparse keyword matching using Reciprocal Rank Fusion ($k=60$), balanced by a configurable $\alpha$ hyperparameter.
- **Reranking & Context Compression**: Deduplicates overlapping passages and formats excerpts with standardized `[S1]`, `[S2]` citation anchors.
- **Relevance Gate & Anti-Hallucination**: Filters documents scoring below $0.15$. If retrieved context is insufficient, returns a transparent fallback message rather than hallucinating.
- **Verification Agent**: Performs an independent audit on draft answers against source context, computing a numerical confidence score ($0.0 - 1.0$).
- **Suggested Follow-Up Agent**: Dynamically generates 2 to 4 contextually relevant follow-up inquiries.
- **Web Search Fallback**: Seamlessly bridges internal knowledge boundaries by asking user consent to fetch live public web results via DuckDuckGo or Tavily when internal documentation is insufficient.

### 2. 🔌 Broad Multi-LLM Provider Support (8 Providers)
Switch models on the fly with unified streaming interfaces and client-side API key overrides:
| Provider | Default / Supported Models | Integration SDK |
| :--- | :--- | :--- |
| **Google Gemini** *(Default)* | `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro` | Official `google-genai` SDK |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo` | Async HTTP / OpenAI API |
| **Anthropic** | `claude-3-5-sonnet-20241022`, `claude-3-haiku` | Async Anthropic API |
| **Groq** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` | Ultra-low latency Groq API |
| **Ollama (Local)** | `llama3.2`, `deepseek-r1`, `mistral`, `qwen2.5` | Local HTTP endpoint (Zero cloud cost) |
| **Mistral AI** | `mistral-small-latest`, `mistral-large-latest` | Mistral AI API |
| **DeepSeek** | `deepseek-chat`, `deepseek-coder` | DeepSeek API |
| **Moonshot / Kimi** | `moonshot-v1-8k`, `moonshot-v1-32k` | Moonshot AI API |

### 3. 🗄️ Dual-Mode Database Engine (Zero-Config + Enterprise)
- **Zero-Config Development**: Out-of-the-box fallback to **SQLite + `aiosqlite`** with in-memory Python Cosine Similarity and tokenized keyword search. Requires **zero external database installations** for instant local onboarding.
- **Enterprise Production**: Native **PostgreSQL 16** with the **`pgvector`** extension utilizing HNSW indexing and `to_tsvector` English full-text search. Compatible with **Supabase**, **Neon.tech**, **AWS RDS**, and Docker containers.

### 4. 📄 Structure-Aware Document Processing
- Supports **PDF** (`pypdf`), **DOCX** (`python-docx`), **Markdown** (`markdown`), **HTML** (`BeautifulSoup4`), and **TXT**.
- Preserves document hierarchy, section headings, page numbers, and structural metadata.
- Smart overlap chunking (default 500 characters with 100 character overlap) that respects paragraph boundaries and sentence punctuation.

### 5. ⚡ Performance, Caching & Scalability
- **Sub-Second Embeddings**: Embeddings model (`BAAI/bge-small-en-v1.5`) pre-warms into RAM during FastAPI startup lifecycle for immediate query vectorization.
- **Redis Semantic Cache**: Optional Redis 7 / Upstash integration for query response caching and token-bucket rate limiting (`RATE_LIMIT_PER_MINUTE`).
- **Client-Side Cache with TTL**: Next.js frontend employs dual-layer `localStorage` caching with time-to-live for instant conversation history navigation with zero round-trip latency.

### 6. 🎨 Modern Interactive Frontend (Next.js 14)
- **3D WebGL Vector Space Sphere**: Custom Three.js visualization representing vector embeddings in 3D space.
- **Real-Time SSE Streaming**: Live character streaming with visual step indicators for each agent phase (*Analyzing*, *Retrieving*, *Reranking*, *Synthesizing*, *Verifying*).
- **Interactive Citation Popovers**: Hover/click `[S1]`, `[S2]` citation badges to inspect the exact document excerpt, file name, section, and page number.
- **Dedicated Settings Panel**: Centralized management for active model engine selection and provider API keys (stored safely in `localStorage`).

---

## 🧰 Technology Stack

```text
├── Backend
│   ├── Python 3.11+ / FastAPI (Async ASGI framework)
│   ├── SQLAlchemy 2.0 Async + aiosqlite / asyncpg
│   ├── Pydantic v2 & Pydantic-Settings
│   ├── Hugging Face Sentence-Transformers (BAAI/bge-small-en-v1.5)
│   ├── PyTorch (CPU / CUDA embedding acceleration)
│   ├── PyPDF, Python-Docx, BeautifulSoup4, Markdown
│   └── Pytest & Pytest-Asyncio
│
├── Frontend
│   ├── Next.js 14 (App Router, Server & Client Components)
│   ├── React 18 & TypeScript 5.4
│   ├── Tailwind CSS & PostCSS
│   ├── Three.js & @types/three (WebGL 3D Core Visualization)
│   ├── Lucide React (Icons)
│   └── React Markdown, Rehype-Highlight & Remark-GFM
│
├── Vector & Storage Layer
│   ├── PostgreSQL 16 + pgvector (Production Vector DB)
│   ├── SQLite + Python Cosine Distance (Local Zero-Config Fallback)
│   ├── Redis 7 (Query Caching & Rate Limiting)
│   └── Supabase Storage / Local Disk Storage
│
└── Infrastructure & DevOps
    ├── Docker & Multi-stage Dockerfiles
    ├── Docker Compose (Development & Production profiles)
    └── GNU Makefile automation
```

---

## 📁 Repository Structure

```text
.
├── Makefile                      # Management commands (up, down, test, eval)
├── README.md                     # Documentation & Architecture guide
├── docker-compose.yml            # Local development compose (Postgres + Backend + Frontend)
├── docker-compose.prod.yml       # Production compose (Postgres + Redis + Backend + Frontend)
│
├── backend/                      # FastAPI Python Backend
│   ├── Dockerfile                # Production Python container spec
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend environment template
│   ├── app/
│   │   ├── main.py               # Application entrypoint & lifespan pre-warming
│   │   ├── seed.py               # Default database seeder script
│   │   ├── agents/               # Multi-Agent swarm implementations
│   │   │   ├── orchestrator.py   # Pipeline coordinator (synchronous & SSE stream)
│   │   │   ├── query_agent.py    # Intent classifier & query rewriter
│   │   │   ├── decomposition_agent.py # Multi-hop query splitter
│   │   │   ├── retrieval_agent.py# Hybrid retriever coordinator
│   │   │   ├── reranking_agent.py# Relevance ranker
│   │   │   ├── compression_agent.py # Context compressor & citation indexer
│   │   │   ├── answer_agent.py   # Synthesis agent (streaming & non-streaming)
│   │   │   ├── verification_agent.py # Anti-hallucination & grounding auditor
│   │   │   ├── followup_agent.py # Suggested question generator
│   │   │   └── state.py          # Shared AgentState dataclass
│   │   ├── api/                  # REST & SSE route handlers
│   │   │   ├── router.py         # Root API router
│   │   │   └── v1/               # v1 Endpoints (auth, chat, documents, etc.)
│   │   ├── db/                   # Database models & Async session management
│   │   │   ├── models.py         # SQLAlchemy models (User, Workspace, Document, etc.)
│   │   │   └── session.py        # Async engine & zero-config SQLite fallback
│   │   ├── evaluation/           # RAG Evaluation benchmark suite
│   │   │   ├── evaluator.py      # Precision, recall, faithfulness & citation metrics
│   │   │   ├── dataset.json      # Gold-standard benchmark evaluation dataset
│   │   │   └── run.py            # Benchmark execution script
│   │   ├── llm/                  # Multi-LLM provider abstraction layer
│   │   │   ├── factory.py        # Provider instantiation factory
│   │   │   ├── base.py           # Abstract Base LLM Provider
│   │   │   ├── gemini.py         # Google Gemini 2.0 / 2.5 provider
│   │   │   ├── openai_provider.py# OpenAI provider
│   │   │   ├── anthropic_provider.py # Anthropic Claude provider
│   │   │   ├── groq_provider.py  # Groq provider
│   │   │   ├── ollama.py         # Local Ollama provider
│   │   │   ├── mistral.py        # Mistral AI provider
│   │   │   ├── deepseek.py       # DeepSeek provider
│   │   │   ├── kimi.py           # Moonshot AI provider
│   │   │   └── prompts.py        # Guardrailed system prompts
│   │   ├── rag/                  # RAG core components
│   │   │   ├── chunking.py       # Structure-aware document chunker
│   │   │   ├── compression.py    # Context compressor & citation formatter
│   │   │   ├── embeddings.py     # Hugging Face BGE sentence-transformers
│   │   │   ├── hybrid_retriever.py # pgvector / SQLite hybrid RRF retriever
│   │   │   ├── loaders.py        # PDF, DOCX, TXT, MD, HTML extractors
│   │   │   └── reranker.py       # Cross-encoder / cosine reranking
│   │   ├── services/             # Application services
│   │   │   ├── auth_service.py   # JWT & bcrypt security
│   │   │   ├── chat_service.py   # Conversation persistence
│   │   │   ├── document_service.py # Ingestion & vector indexing pipeline
│   │   │   ├── redis_client.py   # Redis connection & cache helpers
│   │   │   ├── storage_service.py# File storage (Local / Supabase)
│   │   │   └── web_search_service.py # DuckDuckGo / Tavily web fallback
│   │   └── utils/                # Settings & structured logging
│   └── tests/                    # Pytest test suite
│
└── frontend/                     # Next.js 14 Frontend Application
    ├── Dockerfile                # Production Next.js container spec
    ├── package.json              # NPM dependencies & scripts
    ├── .env.example              # Frontend environment template
    ├── app/                      # Next.js App Router pages
    │   ├── page.tsx              # Root landing redirect
    │   ├── login/                # Authentication page
    │   ├── register/             # User registration
    │   ├── dashboard/            # Workspace & Knowledge Base overview
    │   ├── chat/                 # Multi-agent streaming chat interface
    │   ├── documents/            # Document manager & chunk preview
    │   └── settings/             # Model engine & API key management
    ├── components/               # Modular UI components
    │   ├── navbar.tsx            # Global navigation bar
    │   ├── chat/                 # Chat message, citations, progress, follow-ups
    │   ├── documents/            # Document uploader, list, chunk modal
    │   └── ui/                   # Reusable buttons, cards, modals, 3D WebGL sphere
    ├── lib/                      # API client, models registry, helper utilities
    └── types/                    # TypeScript interfaces & definitions
```

---

## ⚡ Quickstart Guide

### Option 1: Local Development (Fastest — Zero-Config SQLite Fallback)

In this mode, SQLite and in-memory vector search are used automatically if no PostgreSQL instance is configured.

#### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed
- An API key for at least one model provider (e.g. [Google AI Studio](https://aistudio.google.com/app/apikey) for Gemini, or [OpenAI](https://platform.openai.com/api-keys), or run [Ollama](https://ollama.com/) locally).

#### Step 1: Configure & Start Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Set your API key in backend/.env (e.g., GEMINI_API_KEY=your_key_here)
# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
*The backend automatically creates `./data/rag_db.sqlite` and pre-warms the Hugging Face embedding model.*

#### Step 2: Configure & Start Frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run Next.js development server
npm run dev
```

#### Step 3: Access Application
- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **API Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Default Seed Account**: `admin@example.com` / `password123` *(or register a new user in the UI)*

---

### Option 2: Docker Compose (PostgreSQL 16 + pgvector)

Run the full stack with native `pgvector` containerized:

```bash
# 1. Copy backend environment template
cp backend/.env.example backend/.env

# 2. Add your Gemini or OpenAI API key to backend/.env:
# GEMINI_API_KEY=AIzaSy...

# 3. Build and launch all containers
docker compose up --build -d

# 4. View logs
docker compose logs -f
```

To stop containers:
```bash
docker compose down
```

---

### Option 3: Production Docker Stack (with Redis Caching)

Deploy using the production compose configuration featuring Redis 7 caching and restart policies:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

---

## ⚙️ Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `"Multi-Agent RAG Platform"` | Display title of the application |
| `SECRET_KEY` | *(Random secret)* | Cryptographic key for signing JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `43200` (30 days) | Session duration before re-authentication |
| `LLM_PROVIDER` | `gemini` | Default LLM provider (`gemini`, `openai`, `anthropic`, `groq`, `ollama`, `mistral`, `deepseek`, `kimi`) |
| `GEMINI_API_KEY` | `""` | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model variant |
| `OPENAI_API_KEY` | `""` | OpenAI API key (for GPT-4o / GPT-4o-mini) |
| `ANTHROPIC_API_KEY` | `""` | Anthropic API key (for Claude 3.5 Sonnet) |
| `GROQ_API_KEY` | `""` | Groq Cloud API key (for Llama 3.3) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama API host |
| `OLLAMA_MODEL` | `llama3.2` | Local model tag installed in Ollama |
| `MISTRAL_API_KEY` | `""` | Mistral AI API key |
| `DEEPSEEK_API_KEY` | `""` | DeepSeek API key |
| `KIMI_API_KEY` | `""` | Moonshot / Kimi API key |
| `EMBEDDING_MODEL` | `BAAI/bge-small-en-v1.5` | Hugging Face embedding model |
| `EMBEDDING_DIMENSION` | `384` | Vector dimension size |
| `DATABASE_URL` | `""` | Postgres connection string (`postgresql+asyncpg://...`). Leave blank for SQLite fallback |
| `HYBRID_ALPHA` | `0.5` | Weight for vector vs. keyword search ($0.0 = pure keyword, $1.0 = pure vector) |
| `TOP_K_RETRIEVAL` | `10` | Number of candidate chunks retrieved before reranking |
| `TOP_K_RERANK` | `5` | Final chunk count passed to Answer Agent |
| `ENABLE_REDIS_CACHE` | `True` | Toggle Redis query caching |
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `RATE_LIMIT_PER_MINUTE` | `60` | Maximum API requests per minute per IP/user |
| `MAX_FILE_SIZE_MB` | `25` | Maximum upload size per document |
| `SUPABASE_URL` | `""` | Supabase project URL (optional cloud storage) |
| `SUPABASE_SERVICE_KEY` | `""` | Supabase service role key |
| `TAVILY_API_KEY` | `""` | Optional Tavily API key for web search fallback |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | URL pointing to the FastAPI backend |

---

## 📡 API Reference Endpoints

All endpoints are prefixed with `/api/v1`. Full OpenAPI specification is accessible at `/api/v1/docs`.

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account with email and password |
| `POST` | `/auth/login` | Authenticate and obtain OAuth2 JWT bearer token |
| `GET` | `/auth/me` | Fetch currently authenticated user profile |

### Workspaces & Knowledge Bases
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/workspaces` | List all workspaces owned by current user |
| `POST` | `/workspaces` | Create a new isolated workspace |
| `GET` | `/workspaces/{id}` | Get specific workspace details |
| `GET` | `/knowledge-bases` | List knowledge bases (filterable by `workspace_id`) |
| `POST` | `/knowledge-bases` | Create a new knowledge base container |
| `GET` | `/knowledge-bases/{id}` | Get knowledge base statistics and document count |

### Document Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/documents/upload` | Upload & ingest file (PDF, DOCX, TXT, MD, HTML) |
| `GET` | `/documents` | List uploaded documents in knowledge base |
| `GET` | `/documents/{id}` | Retrieve document metadata and indexing status |
| `GET` | `/documents/{id}/chunks` | Inspect parsed text chunks, embeddings & metadata |
| `POST` | `/documents/{id}/reindex` | Trigger re-chunking and re-vectorization |
| `DELETE`| `/documents/{id}` | Delete document and cascade delete associated vector chunks |

### Multi-Agent Chat & Conversations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat` | **Server-Sent Events (SSE) Streaming**: Dispatches multi-agent workflow |
| `GET` | `/conversations` | List conversation sessions for a knowledge base |
| `GET` | `/conversations/{id}` | Fetch conversation thread with full message history and citations |
| `DELETE`| `/conversations/{id}` | Delete conversation thread |
| `POST` | `/messages/{id}/feedback`| Submit user thumbs-up / thumbs-down rating and feedback |

### Direct Search & System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/search` | Direct hybrid search endpoint (returns scored chunks without LLM synthesis) |
| `GET` | `/health` | System health check, DB pool status, and active model verification |

---

## 🧪 Testing & RAG Benchmarks

### 1. Run Backend Pytest Suite
Runs automated unit and integration tests covering agent orchestration, chunking logic, embeddings, and prompt safety:

```bash
# Using Makefile
make backend-test

# Or directly in backend directory
cd backend
pytest tests/ -v
```

### 2. Run RAG Benchmark Evaluation
The platform includes an automated benchmarking tool (`app/evaluation/run.py`) evaluating retrieval accuracy, citation compliance, and answer faithfulness against a gold-standard dataset:

```bash
# Using Makefile
make eval

# Or directly in backend directory
cd backend
python -m app.evaluation.run
```

**Evaluated Metrics:**
- **Retrieval Precision & Recall**: Verifies whether candidate passages containing ground truth appear in top-K search results.
- **Answer Faithfulness**: Cosine similarity and semantic alignment between generated answer and ground-truth evidence.
- **Citation Correctness**: Ensures every substantive factual assertion references a valid `[S#]` source anchor.

---

## 🛠️ Makefile Commands

| Command | Description |
| :--- | :--- |
| `make help` | Display available command menu |
| `make up` | Start all Docker Compose containers in background |
| `make down` | Stop and remove all running containers |
| `make restart` | Restart all Docker services |
| `make logs` | Tail live logs from all containers |
| `make backend-test` | Execute Pytest suite in backend |
| `make eval` | Run RAG benchmark evaluation suite |

---

## 🔒 Security & Prompt Injection Defense

1. **Untrusted Context Boundaries**: Ingested document passages are encapsulated within strict `<BEGIN UNTRUSTED DOCUMENT CONTEXT>` delimiters, preventing prompt injection instructions embedded inside uploaded files from hijacking system behavior.
2. **System Instruction Isolation**: LLM prompts explicitly enforce that instructions inside retrieved documents cannot alter core behavioral guidelines or leak confidential workspace data.
3. **Multi-Tenant Scoping**: All database queries and vector distance searches mandate explicit `workspace_id` and `user_id` filtering at the SQL engine level.
4. **Direct Password Security**: Uses direct `bcrypt` password hashing with zero legacy dependencies.
5. **Secure Browser Storage**: Model provider API keys entered in the frontend remain solely in the user's browser `localStorage` and are transmitted per-request over secure HTTPS headers.

---

## 📄 License

Distributed under the **MIT License**. Permitted for commercial use, enterprise deployment, modification, and private distribution.
