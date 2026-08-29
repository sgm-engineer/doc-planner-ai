CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);

COMMENT ON TABLE public.messages IS 'チャット・プランナーの会話履歴（発言単位）を保存するテーブル';
COMMENT ON COLUMN public.messages.conversation_id IS '紐づくconversations.id';
COMMENT ON COLUMN public.messages.role IS '発言者（user: ユーザー入力 / assistant: AI応答）';
COMMENT ON COLUMN public.messages.content IS '発言本文（assistant側はRAG参照元の資料名が付記される場合あり）';
