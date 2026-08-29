CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_size integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.documents IS 'アップロードされたPDFの管理テーブル。1件がPDF1ファイルに対応';
COMMENT ON COLUMN public.documents.name IS 'アップロードされたPDFのファイル名';
COMMENT ON COLUMN public.documents.file_size IS 'ファイルサイズ（バイト、上限10MB）';
