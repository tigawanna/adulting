/**
 * Embedding scaffold.
 *
 * The `events` table already reserves `embedding BLOB` + `embedding_model`,
 * so enabling natural-language search later is a code-only change — no
 * migration required. To switch it on:
 *
 *   1. Add your provider key to `.env` (see `.env.example`).
 *   2. Replace the body of `generateEmbedding` with a provider call.
 *   3. Write the returned Float32Array into `events.embedding` on create/update.
 *   4. Use `rankBySimilarity` in `/api/events?semantic=true` (hook below).
 */

export interface EmbeddingResult {
  vector: number[] | null;
  model: string | null;
}

const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  void text;
  // TODO: call your embedding provider with process.env.EMBEDDING_API_KEY.
  // Example:
  //   const res = await fetch("https://api.openai.com/v1/embeddings", { ... });
  //   return { vector: (await res.json()).data[0].embedding, model: MODEL };
  void MODEL;
  return { vector: null, model: null };
}

/** Cosine similarity for comparing a query vector with stored event vectors. */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Reserved semantic-search hook — intentionally a no-op until a provider is wired in. */
export async function rankBySimilarity<T>(items: T[], query: string): Promise<T[]> {
  void query;
  return items;
}
