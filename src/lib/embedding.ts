import { genAI } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { ChunkResult } from "@/types/index";

const EMBEDDING_MODEL = "gemini-embedding-001";
// gemini-embedding-001はデフォルト3072次元を返す。DBのvector列は768次元で作成しているため、
// MRL(Matryoshka Representation Learning)で学習された性質を利用し、先頭768次元に切り詰めて使用する。
const EMBEDDING_DIMENSIONS = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values.slice(0, EMBEDDING_DIMENSIONS);
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  matchCount: number = 5
): Promise<ChunkResult[]> {
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Failed to search similar chunks: ${error.message}`);
  }

  return (data ?? []) as ChunkResult[];
}
