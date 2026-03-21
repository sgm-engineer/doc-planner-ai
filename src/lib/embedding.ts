import { genAI } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { ChunkResult } from "@/types/index";

const EMBEDDING_MODEL = "text-embedding-004";

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
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
