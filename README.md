# rag-nodejs-template

RAG (Retrieval-Augmented Generation) pipeline with Node.js, TypeScript, PostgreSQL, and pgvector.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-HNSW-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Architecture

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐
│Documents │───▶│ Recursive │───▶│  OpenAI    │───▶│ pgvector │
│PDF/MD/TXT│    │ Chunking  │    │ Embeddings │    │  Store   │
└──────────┘    └───────────┘    └────────────┘    └────┬─────┘
                                                        │
┌──────────┐    ┌───────────┐    ┌────────────┐        │
│  Answer  │◀───│ GPT-4o    │◀───│ Similarity │◀───────┘
│          │    │ (mini)    │    │  Search    │   ◀── Query
└──────────┘    └───────────┘    └────────────┘
```

## Quick Start

```bash
git clone https://github.com/Thiago5g/rag-nodejs-template.git
cd rag-nodejs-template
cp .env.example .env          # Add your OPENAI_API_KEY
docker compose up -d          # Starts PostgreSQL + pgvector
npm install
npm run db:migrate            # Create tables and indexes
npm run ingest -- --dir ./docs    # Ingest documents
npm run query -- "your question"  # Ask questions
```

## Features

- **Document ingestion** — PDF, Markdown, and plain text with recursive directory scanning
- **Recursive chunking** — Configurable chunk size and overlap, splits by paragraph/sentence/word
- **OpenAI embeddings** — `text-embedding-3-small` (1536 dimensions) with batch processing
- **pgvector storage** — HNSW indexing for cosine similarity search
- **Metadata filtering** — Filter results by source, type, or custom fields
- **Query chain** — Retrieves context → builds prompt → generates answer via LLM
- **No-context handling** — Graceful responses when no relevant documents are found
- **CLI tools** — `npm run ingest` and `npm run query` for terminal usage
- **REST API** — Express server with `/query`, `/ingest`, and `/health` endpoints
- **Docker support** — Multi-stage Dockerfile + docker-compose with pgvector

## API

```bash
# Ask a question
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How does authentication work?"}'

# Ingest a directory
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"directory": "./docs"}'

# Health check
curl http://localhost:3000/health
```

## Project Structure

```
src/
├── config.ts                 # Zod-validated environment config
├── server.ts                 # Express API (query, ingest, health)
├── db/
│   ├── connection.ts         # PostgreSQL pool + migration runner
│   └── migrate.ts            # CLI migration entry point
├── ingestion/
│   ├── loaders.ts            # Document loaders (PDF, MD, text)
│   ├── chunker.ts            # Recursive character text splitter
│   └── pipeline.ts           # Orchestrates: load → chunk → embed → store
├── embeddings/
│   └── provider.ts           # OpenAI + Fake (deterministic for tests)
├── retrieval/
│   ├── retriever.ts          # Vector similarity search
│   └── query-chain.ts        # Retrieve context → LLM answer
├── store/
│   └── vector-store.ts       # pgvector CRUD + search
└── cli/
    ├── ingest.ts             # CLI: ingest files/directories
    └── query.ts              # CLI: one-shot question
migrations/
└── 001_init.sql              # pgvector extension + tables + HNSW index
tests/
├── unit/
│   ├── chunker.test.ts       # Chunking logic
│   ├── embeddings.test.ts    # Fake embeddings provider
│   └── loaders.test.ts       # File loading
└── integration/
    └── pipeline.test.ts      # Full pipeline data flow
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | — |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `1536` |
| `CHUNK_SIZE` | Characters per chunk | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` |
| `RETRIEVAL_TOP_K` | Chunks to retrieve per query | `4` |
| `LLM_MODEL` | Model for answer generation | `gpt-4o-mini` |
| `PORT` | API server port | `3000` |

## Design Decisions

**pgvector over managed vector DBs** — No vendor lock-in, runs locally with Docker, same PostgreSQL you already operate. HNSW indexes give competitive recall for application-scale datasets. One less service to manage in production.

**No LangChain** — The pipeline is explicit and readable. Every step (load → chunk → embed → store → search → prompt → answer) is a function you can read, debug, and modify. The trade-off is less abstraction swapping, but more control and understanding.

**Recursive chunking** — Tries paragraph boundaries first (`\n\n`), then sentences, then words. Preserves document structure better than fixed-size windows. Overlap ensures context doesn't get cut at chunk boundaries.

**FakeEmbeddings for tests** — Deterministic hash-based vectors allow testing the full pipeline without API calls. Tests run fast, offline, and are reproducible.

## Testing

```bash
npm test              # Run all tests (no external services needed)
npm run typecheck     # TypeScript validation
npm run lint          # ESLint
```

Unit tests cover chunking logic, embedding generation, and file loading.
Integration tests validate the full pipeline data flow without requiring PostgreSQL.

## Limitations

- Single embedding provider (OpenAI only)
- No streaming responses
- No conversational memory (each query is independent)
- No reranking step
- No hybrid search (vector-only, no keyword BM25)
- Requires OpenAI API key for embeddings and LLM

## Roadmap

- [ ] Ollama/local embedding support
- [ ] Streaming responses
- [ ] Conversational memory (multi-turn)
- [ ] Hybrid search (vector + BM25)
- [ ] Semantic chunking (topic-based splits)
- [ ] Reranking with cross-encoder

## License

MIT
