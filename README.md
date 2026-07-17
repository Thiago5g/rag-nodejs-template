![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-0.7+-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

# rag-nodejs-template

Production-ready RAG (Retrieval-Augmented Generation) pipeline with Node.js, TypeScript, LangChain, and pgvector. Clone, configure, ship.

## Architecture

```
┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐
│Documents │───▶│ Chunking │───▶│ Embeddings │───▶│ pgvector │
│PDF/MD/TXT│    │Recursive │    │  OpenAI /  │    │  Store   │
└──────────┘    │Semantic  │    │   Local    │    └────┬─────┘
                └──────────┘    └────────────┘         │
                                                       ▼
┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐
│  Answer  │◀───│   LLM    │◀───│  Retrieval │◀───│  Query   │
│          │    │ (GPT-4o) │    │   Chain    │    │          │
└──────────┘    └──────────┘    └────────────┘    └──────────┘
```

## Quick Start

```bash
git clone https://github.com/Thiago5g/rag-nodejs-template.git
cd rag-nodejs-template
cp .env.example .env        # Add your OpenAI key
docker compose up -d        # Starts PostgreSQL + pgvector
npm install
npm run ingest -- --dir ./docs    # Ingest documents
npm run query -- "How does authentication work?"
```

## Features

- **Document ingestion** — PDF, Markdown, and plain text with automatic format detection
- **Chunking strategies** — Recursive character splitting and semantic chunking with configurable overlap
- **Embedding providers** — OpenAI `text-embedding-3-small` or local models via Ollama
- **Vector storage** — pgvector with HNSW indexing for sub-50ms similarity search
- **Metadata filtering** — Filter by source, date, tags, or custom fields at query time
- **Conversational retrieval** — Context-aware follow-up questions with chat history
- **Streaming responses** — Token-by-token output via LangChain streaming callbacks
- **Docker-ready** — Single `docker compose up` for full local environment
- **Tested** — Unit and integration tests with Vitest

## Project Structure

```
src/
├── ingestion/        # Document loaders, chunking, embedding pipeline
├── retrieval/        # Vector search, metadata filters, reranking
├── chains/           # Conversational retrieval chain, prompts
├── config/           # Environment, DB connection, model settings
└── server.ts         # Express API (ingest & query endpoints)
tests/
├── unit/             # Chunking, embedding, chain tests
└── integration/      # End-to-end ingestion + retrieval
Dockerfile
docker-compose.yml
```

## Configuration

Key environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | — |
| `EMBEDDING_MODEL` | Embedding model identifier | `text-embedding-3-small` |
| `PG_CONNECTION_STRING` | PostgreSQL connection URI | `postgresql://localhost:5432/rag` |
| `CHUNK_SIZE` | Characters per chunk | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` |
| `RETRIEVAL_K` | Number of documents to retrieve | `4` |

## Design Decisions

**pgvector over Pinecone/Weaviate** — No vendor lock-in, runs locally, same PostgreSQL you already operate. HNSW indexes give competitive recall at application-scale datasets (< 10M vectors).

**LangChain for orchestration** — Standardized interfaces for swapping LLMs, embeddings, and vector stores without rewriting retrieval logic. The abstractions pay off when moving between OpenAI and local models.

**Recursive chunking as default** — Preserves document structure better than fixed-size splits. Semantic chunking available for use cases requiring topic-coherent segments at higher compute cost.

**Express over framework** — Minimal HTTP layer keeps the template portable. Swap in Fastify, Hono, or wire directly into your existing service.

## Scripts

```bash
npm run ingest -- --dir ./path   # Ingest a directory of documents
npm run query -- "your question" # One-shot query from CLI
npm run dev                      # Start API server with hot reload
npm run test                     # Run test suite
npm run build                    # Compile TypeScript
```

## License

MIT
