import Link from "next/link";

const MODES = [
  {
    href: "/qa",
    label: "QA Bot",
    badge: "Mode 1",
    description: "社内ドキュメントをアップロードして、AIに質問できます。RAGで関連資料を参照しながら正確に回答します。",
    features: ["PDF資料のアップロード", "RAGによる根拠付き回答", "参照ドキュメントの表示"],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
      </svg>
    ),
    color: "blue",
  },
  {
    href: "/planner",
    label: "企画書生成",
    badge: "Mode 2",
    description: "AIとの5ステップのヒアリングを通じて企画書を自動生成します。過去資料を参照し、根拠のある提案を作成します。",
    features: ["5ステップのヒアリング", "Markdown形式で企画書生成", "過去事例の参照・引用"],
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "violet",
  },
] as const;

const colorMap = {
  blue: {
    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
    icon: "bg-blue-50 text-blue-600",
    check: "text-blue-500",
    cta: "bg-blue-600 hover:bg-blue-700 text-white",
    border: "hover:border-blue-200",
  },
  violet: {
    badge: "bg-violet-50 text-violet-600 ring-1 ring-violet-200",
    icon: "bg-violet-50 text-violet-600",
    check: "text-violet-500",
    cta: "bg-violet-600 hover:bg-violet-700 text-white",
    border: "hover:border-violet-200",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Doc Planner AI</span>
        </div>
      </header>

      {/* メイン */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* タイトル */}
        <div className="text-center mb-12 space-y-3">
          <p className="text-sm font-medium text-blue-600 tracking-wide uppercase">
            RAG × AI Agent
          </p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            社内ドキュメントAIアシスタント
          </h1>
          <p className="max-w-md text-base text-gray-500 leading-relaxed">
            PDFをアップロードして、QAや企画書生成にご利用ください。
          </p>
        </div>

        {/* モード選択カード */}
        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          {MODES.map((mode) => {
            const c = colorMap[mode.color];
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={[
                  "group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
                  "transition-all duration-200 hover:shadow-md",
                  c.border,
                ].join(" ")}
              >
                {/* バッジ + アイコン */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-xl p-2.5 ${c.icon}`}>
                    {mode.icon}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                    {mode.badge}
                  </span>
                </div>

                {/* ラベル・説明 */}
                <h2 className="text-lg font-bold text-gray-900 mb-2">{mode.label}</h2>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {mode.description}
                </p>

                {/* 機能リスト */}
                <ul className="mt-4 space-y-1.5">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <svg
                        className={`w-3.5 h-3.5 shrink-0 ${c.check}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${c.cta}`}>
                  {mode.label}を開く
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <p className="text-center text-xs text-gray-400">
            Next.js 16 · Gemini API · Supabase pgvector · Vercel AI SDK
          </p>
        </div>
      </footer>
    </div>
  );
}
