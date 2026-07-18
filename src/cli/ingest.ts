import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { createPool } from '../db/connection.js';
import { VectorStore } from '../store/vector-store.js';
import { OpenAIEmbeddings } from '../embeddings/provider.js';
import { IngestionPipeline } from '../ingestion/pipeline.js';
import { loadDirectory, loadFile } from '../ingestion/loaders.js';
import fs from 'node:fs';

const program = new Command();

program
  .name('ingest')
  .description('Ingest documents into the RAG pipeline vector store')
  .option('--dir <path>', 'Directory to ingest (recursive)')
  .option('--file <path>', 'Single file to ingest')
  .parse(process.argv);

const opts = program.opts();

if (!opts.dir && !opts.file) {
  console.error('Error: provide --dir <path> or --file <path>');
  process.exit(1);
}

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const store = new VectorStore(pool);
const embeddings = new OpenAIEmbeddings({
  apiKey: config.openaiApiKey,
  model: config.embeddingModel,
});
const pipeline = new IngestionPipeline(embeddings, store, {
  chunkOptions: {
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  },
});

async function main() {
  await store.initialize();

  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      console.error(`File not found: ${opts.file}`);
      process.exit(1);
    }

    console.log(`📄 Ingesting file: ${opts.file}`);
    const doc = await loadFile(opts.file);
    const result = await pipeline.ingestDocument(doc);
    console.log(`   ✓ ${result.chunksCreated} chunks created (${result.totalCharacters} chars)`);
  }

  if (opts.dir) {
    if (!fs.existsSync(opts.dir)) {
      console.error(`Directory not found: ${opts.dir}`);
      process.exit(1);
    }

    console.log(`📂 Ingesting directory: ${opts.dir}`);
    const docs = await loadDirectory(opts.dir);

    if (docs.length === 0) {
      console.log('   No supported documents found.');
      process.exit(0);
    }

    console.log(`   Found ${docs.length} document(s)\n`);

    const results = await pipeline.ingestDocuments(docs, (result, i, total) => {
      console.log(`   [${i}/${total}] ${result.source} → ${result.chunksCreated} chunks`);
    });

    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);
    console.log(`\n✅ Done. ${results.length} documents → ${totalChunks} chunks ingested.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
