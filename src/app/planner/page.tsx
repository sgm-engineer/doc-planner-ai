"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import StepIndicator from "@/components/StepIndicator";
import MarkdownPreview from "@/components/MarkdownPreview";
import AppHeader from "@/components/AppHeader";

function generateId(): string {
  return crypto.randomUUID();
}

export default function PlannerPage() {
  const [conversationId] = useState<string>(() => generateId());
  const [currentStep, setCurrentStep] = useState(1);
  const [planMarkdown, setPlanMarkdown] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const prevAssistantCount = useRef(0);

  // アシスタントメッセージ数変化 → ステップ更新 & プラン取得
  const handleAssistantCount = useCallback(
    async (count: number) => {
      const step = Math.min(count, 6);
      setCurrentStep(step);

      // ステップ6（全完了メッセージ受信）になったとき、かつ前回より増えたとき
      if (step === 6 && count > prevAssistantCount.current) {
        prevAssistantCount.current = count;
        setPlanLoading(true);

        // サーバー側の企画書生成（5セクション並列）完了までポーリング
        const MAX_ATTEMPTS = 15;
        const INTERVAL_MS = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));

          try {
            const res = await fetch(
              `/api/planner/plan?conversationId=${conversationId}`
            );
            const data = await res.json();
            if (data.plan?.content) {
              setPlanMarkdown(data.plan.content);
              break;
            }
          } catch {
            // ネットワークエラー時はリトライを続ける
          }
        }

        setPlanLoading(false);
      } else {
        prevAssistantCount.current = count;
      }
    },
    [conversationId]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <AppHeader title="企画書生成" />
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* 左ペイン */}
        <aside className="w-full md:w-[380px] shrink-0 flex flex-col min-h-0 gap-4 p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-white overflow-y-auto md:overflow-visible">
          {/* ステップ進捗 */}
          <div className="rounded-xl border border-gray-200 p-4 shrink-0">
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* チャット */}
          <div className="flex-1 min-h-[400px] md:min-h-0">
            <ChatWindow
              api="/api/planner"
              conversationId={conversationId}
              placeholder="回答を入力してください..."
              emptyStateText="企画書のヒアリングを開始します..."
              initialMessage="__init__"
              onAssistantCount={handleAssistantCount}
            />
          </div>
        </aside>

        {/* 右ペイン */}
        <main className="flex flex-1 min-h-0 flex-col p-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 shrink-0">企画書プレビュー</h2>
          <div className="flex-1 min-h-0">
            <MarkdownPreview markdown={planMarkdown} isLoading={planLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
