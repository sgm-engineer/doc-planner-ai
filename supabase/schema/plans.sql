CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  title text,
  step integer DEFAULT 1,
  background text,
  purpose text,
  target text,
  measures text,
  kpi text,
  content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);

COMMENT ON TABLE public.plans IS 'ヒアリングを経て生成された企画書を保存するテーブル。NOTE: 現状のアプリコード(src/app/api/planner/route.ts)はconversation_idとcontentしかinsertしておらず、title/step/background以下のカラムは未使用（企画書は1本のMarkdown文字列として生成される実装のため）';
COMMENT ON COLUMN public.plans.conversation_id IS '紐づくconversations.id';
COMMENT ON COLUMN public.plans.title IS '企画書タイトル（ヒアリング1問目の回答から生成想定）';
COMMENT ON COLUMN public.plans.step IS 'ヒアリング進捗ステップ（1〜5、完了後の値は未定義）';
COMMENT ON COLUMN public.plans.background IS '「背景・課題」セクション';
COMMENT ON COLUMN public.plans.purpose IS '「目的・ゴール」セクション';
COMMENT ON COLUMN public.plans.target IS '「ターゲット・ペルソナ」セクション';
COMMENT ON COLUMN public.plans.measures IS '「施策・解決策」セクション';
COMMENT ON COLUMN public.plans.kpi IS '「期待効果・KPI」セクション';
COMMENT ON COLUMN public.plans.content IS '生成された企画書のMarkdown全文（アプリコードが実際に読み書きしているのはこのカラムのみ）';
