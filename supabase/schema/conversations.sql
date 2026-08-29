CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode = ANY (ARRAY['qa'::text, 'planner'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.conversations IS 'チャット・企画書ヒアリングの会話単位を表すテーブル。messages/plansの親';
COMMENT ON COLUMN public.conversations.mode IS '会話モード（qa: 資料QAチャット / planner: 企画書ヒアリング）';
