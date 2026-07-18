import OpenAI from 'openai';
import type { Retriever, RetrievalResult } from './retriever.js';

export interface QueryResult {
  answer: string;
  sources: Array<{ content: string; source: string; score: number }>;
  retrievalResult: RetrievalResult;
}

export interface QueryChainConfig {
  openaiApiKey: string;
  model?: string;
  retriever: Retriever;
}

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context.

Rules:
- Answer ONLY based on the context provided below.
- If the context doesn't contain enough information, say "I don't have enough information to answer that question."
- Be concise and direct.
- Cite which source documents you used when relevant.
- Do not make up information not present in the context.`;

function buildUserPrompt(question: string, context: string): string {
  return `Context:
---
${context}
---

Question: ${question}`;
}

/**
 * Query chain: retrieves relevant context and generates an answer using an LLM.
 */
export class QueryChain {
  private client: OpenAI;
  private model: string;
  private retriever: Retriever;

  constructor(config: QueryChainConfig) {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
    this.model = config.model ?? 'gpt-4o-mini';
    this.retriever = config.retriever;
  }

  /**
   * Execute the full RAG pipeline: retrieve → build prompt → generate answer.
   */
  async query(question: string): Promise<QueryResult> {
    // 1. Retrieve relevant chunks
    const retrievalResult = await this.retriever.retrieve(question);

    // 2. Handle no context found
    if (retrievalResult.chunks.length === 0) {
      return {
        answer: "I don't have any documents to answer your question. Please ingest some documents first.",
        sources: [],
        retrievalResult,
      };
    }

    // 3. Build context from chunks
    const context = retrievalResult.chunks
      .map((chunk, i) => `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}`)
      .join('\n\n');

    // 4. Generate answer with LLM
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(question, context) },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content ?? 'No response generated.';

    return {
      answer,
      sources: retrievalResult.chunks.map((c) => ({
        content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
        source: c.source,
        score: c.score,
      })),
      retrievalResult,
    };
  }
}
