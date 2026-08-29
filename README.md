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
- [Gemini API](https://ai.google.dev/)（`gemini-2.0-flash` / Embedding: `text-embedding-004`）
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
```

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
  app/
    page.tsx              # トップ（モード選択）
    qa/page.tsx            # QA Bot画面
    planner/page.tsx       # 企画書生成画面
    api/
      documents/           # PDFアップロード・一覧・削除
      chat/                 # QA BotのRAGチャットAPI
      planner/              # 企画書ヒアリング・生成API
  components/               # ChatWindow, DocumentUploader など
  lib/
    pdfParser.ts            # PDFテキスト抽出・チャンク分割
    embedding.ts            # Gemini Embedding生成・類似検索
    plannerAgent.ts          # 企画書ヒアリングのステップ管理・プロンプト構築
    supabase.ts              # Supabaseクライアント（anon / service role）
supabase/
  schema/                    # テーブル定義（参考用、実行はSupabase側で管理）
```

## 既知の制約

- ユーザー認証・ユーザーごとのデータ分離は未実装です
- `conversationId`はブラウザのメモリ上でのみ保持しており、ページを離れる/リロードすると会話を再開できません
- PDFアップロード時のEmbedding生成は、Gemini無料枠のレート制限（429エラー）を避けるため意図的に直列処理にしています（詳細は [`src/app/api/documents/upload/route.ts`](src/app/api/documents/upload/route.ts) のコメント参照）
