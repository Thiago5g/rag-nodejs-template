import express from 'express';
import { loadConfig } from './config.js';
import { createPool } from './db/connection.js';
import { VectorStore } from './store/vector-store.js';
import { OpenAIEmbeddings } from './embeddings/provider.js';
import { Retriever } from './retrieval/retriever.js';
import { QueryChain } from './retrieval/query-chain.js';
import { IngestionPipeline } from './ingestion/pipeline.js';
import { loadDirectory } from './ingestion/loaders.js';

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const store = new VectorStore(pool);
const embeddings = new OpenAIEmbeddings({
  apiKey: config.openaiApiKey,
  model: config.embeddingModel,
});
const retriever = new Retriever(embeddings, store, config.retrievalTopK);
const queryChain = new QueryChain({
  openaiApiKey: config.openaiApiKey,
  model: config.llmModel,
  retriever,
});
const pipeline = new IngestionPipeline(embeddings, store, {
  chunkOptions: {
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  },
});

const app = express();
app.use(express.json());

// ─── Health ──────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const stats = await store.getStats();
    res.json({
      status: 'ok',
      documents: stats.documents,
      chunks: stats.chunks,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: (err as Error).message,
    });
  }
});

// ─── Query ───────────────────────────────────────────────
app.post('/query', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Missing "question" field in request body.' });
    return;
  }

  try {
    const result = await queryChain.query(question);
    res.json({
      answer: result.answer,
      sources: result.sources,
    });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to process query.' });
  }
});

// ─── Ingest ──────────────────────────────────────────────
app.post('/ingest', async (req, res) => {
  const { directory } = req.body;

  if (!directory || typeof directory !== 'string') {
    res.status(400).json({ error: 'Missing "directory" field in request body.' });
    return;
  }

  try {
    const docs = await loadDirectory(directory);

    if (docs.length === 0) {
      res.status(400).json({ error: `No supported documents found in "${directory}".` });
      return;
    }

    const results = await pipeline.ingestDocuments(docs);
    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);

    res.json({
      ingested: results.length,
      totalChunks,
      documents: results.map((r) => ({
        source: r.source,
        chunks: r.chunksCreated,
      })),
    });
  } catch (err) {
    console.error('Ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest documents.' });
  }
});

// ─── Start ───────────────────────────────────────────────
async function start() {
  await store.initialize();
  app.listen(config.port, () => {
    console.log(`RAG API listening on http://localhost:${config.port}`);
    console.log(`  POST /query    - Ask a question`);
    console.log(`  POST /ingest   - Ingest documents from a directory`);
    console.log(`  GET  /health   - Health check`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
