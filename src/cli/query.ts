import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { createPool } from '../db/connection.js';
import { VectorStore } from '../store/vector-store.js';
import { OpenAIEmbeddings } from '../embeddings/provider.js';
import { Retriever } from '../retrieval/retriever.js';
import { QueryChain } from '../retrieval/query-chain.js';

const program = new Command();

program
  .name('query')
  .description('Query the RAG pipeline')
  .argument('<question>', 'The question to ask')
  .option('--top-k <n>', 'Number of chunks to retrieve', '4')
  .option('--sources', 'Show source documents', false)
  .parse(process.argv);

const question = program.args[0];
const opts = program.opts();

if (!question) {
  console.error('Error: provide a question as argument');
  process.exit(1);
}

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const store = new VectorStore(pool);
const embeddings = new OpenAIEmbeddings({
  apiKey: config.openaiApiKey,
  model: config.embeddingModel,
});
const retriever = new Retriever(embeddings, store, parseInt(opts.topK, 10));
const queryChain = new QueryChain({
  openaiApiKey: config.openaiApiKey,
  model: config.llmModel,
  retriever,
});

async function main() {
  await store.initialize();

  console.log(`\n🔍 Question: ${question}\n`);

  const result = await queryChain.query(question);

  console.log(`💡 Answer:\n${result.answer}\n`);

  if (opts.sources && result.sources.length > 0) {
    console.log('📚 Sources:');
    for (const source of result.sources) {
      console.log(`   [${source.score.toFixed(3)}] ${source.source}`);
      console.log(`       "${source.content}"\n`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error('❌ Query failed:', err);
  process.exit(1);
});
