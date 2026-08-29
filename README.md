# Doc Planner AI

社内ドキュメント（PDF）をアップロードし、RAGを使ってAIに質問したり、AIとのヒアリングを通じて企画書を自動生成できるNext.jsアプリです。

## 機能

### Mode 1: QA Bot（`/qa`）
- PDF資料をアップロードすると、テキスト抽出 → チャンク分割 → Embedding化してSupabaseに保存
- ユーザーの質問をEmbedding化し、pgvectorで類似チャンクを検索（RAG）
- 検索結果を根拠として、根拠付きでAIが回答（参照ドキュメント名を表示）

### Mode 2: 企画書生成（`/planner`）
- AIとの5ステップのヒアリング（テーマ・背景・ターゲット・施策・KPI）を1問ずつ実施
- アップロード済み資料があれば、関連する過去事例をRAGで参照しながら質問・生成
- ヒアリング完了後、5セクション構成（背景・課題／目的・ゴール／ターゲット・ペルソナ／施策・解決策／期待効果・KPI）のMarkdown企画書を自動生成

## 技術スタック

- [Next.js 16](https://nextjs.org/)（App Router）
- [Vercel AI SDK](https://sdk.vercel.ai/)（`ai`, `@ai-sdk/google`, `@ai-sdk/react`）
- [Gemini API](https://ai.google.dev/)（`gemini-3.5-flash-lite` / Embedding: `gemini-embedding-001`、768次元に切り詰めて使用）
- [Supabase](https://supabase.com/)（Postgres + pgvector）
- Tailwind CSS

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` を作成し、以下を設定してください。

```bash
# Gemini API
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Basic認証（任意。設定するとアプリ全体にBasic認証がかかります）
BASIC_AUTH_USER=
BASIC_AUTH_PASSWORD=
```

`BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD`は未設定の場合、認証をスキップします（ローカル開発用）。公開デプロイ（Vercelなど）では、認証のないAPIを誰でも叩けてGeminiのクォータを消費されてしまうため、**必ず設定してください**。

### 3. データベースのセットアップ

Supabase側でテーブル・pgvector拡張・類似検索用の`match_chunks`関数を用意する必要があります。テーブル定義は [`supabase/schema/`](supabase/schema) 配下を参照してください（`documents` → `document_chunks`、`conversations` → `messages`/`plans` の順に依存）。

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動します。

## ディレクトリ構成（抜粋）

```
src/
  middleware.ts              # Basic認証（BASIC_AUTH_USER/PASSWORD設定時のみ有効）
  app/
    page.tsx              # トップ（モード選択）
    qa/page.tsx            # QA Bot画面
    planner/page.tsx       # 企画書生成画面
    api/
      documents/           # PDFアップロード・一覧・削除
      chat/                 # QA BotのRAGチャットAPI
      planner/              # 企画書ヒアリング・生成API
  components/               # ChatWindow, DocumentUploader, AppHeader など
  lib/
    pdfParser.ts            # PDFテキスト抽出・チャンク分割
    embedding.ts            # Gemini Embedding生成・類似検索
    plannerAgent.ts          # 企画書ヒアリングのステップ管理・プロンプト構築
    supabase.ts              # Supabaseクライアント（anon / service role）
supabase/
  schema/                    # テーブル定義（参考用、実行はSupabase側で管理）
```

