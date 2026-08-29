CREATE TABLE public.document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  embedding USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);

COMMENT ON TABLE public.document_chunks IS 'PDFをチャンク分割し、EmbeddingとともにRAG検索用に保存するテーブル';
COMMENT ON COLUMN public.document_chunks.document_id IS '紐づくdocuments.id（削除時cascade想定）';
COMMENT ON COLUMN public.document_chunks.content IS 'チャンク分割されたPDF本文の1片';
COMMENT ON COLUMN public.document_chunks.chunk_index IS '同一document内でのチャンク順序（0始まり）';
COMMENT ON COLUMN public.document_chunks.embedding IS 'ChunkのEmbeddingベクトル（Gemini gemini-embedding-001を768次元に切り詰めたもの、pgvector型）。match_chunks RPCの類似度検索で使用';
