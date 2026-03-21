export interface Document {
  id: string;
  name: string;
  file_size: number;
  created_at: string;
}

export interface ChunkResult {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  similarity: number;
  document_name: string;
}

export interface Plan {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
}
