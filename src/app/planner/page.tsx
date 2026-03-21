"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import StepIndicator from "@/components/StepIndicator";
import MarkdownPreview from "@/components/MarkdownPreview";

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
      const step = Math.min(count + 1, 6);
      setCurrentStep(step);

      // ステップ6（全完了）になったとき、かつ前回より増えたとき
      if (count >= 5 && count > prevAssistantCount.current) {
        prevAssistantCount.current = count;
        setPlanLoading(true);

        // サーバーでの企画書生成完了を少し待つ
        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          const res = await fetch(
            `/api/planner/plan?conversationId=${conversationId}`
          );
          const data = await res.json();
          if (data.plan?.content) {
            setPlanMarkdown(data.plan.content);
          }
        } catch {
          // ignore
        } finally {
          setPlanLoading(false);
        }
      } else {
        prevAssistantCount.current = count;
      }
    },
    [conversationId]
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 左ペイン */}
      <aside className="w-full md:w-[380px] shrink-0 flex flex-col gap-4 p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
        {/* ステップ進捗 */}
        <div className="rounded-xl border border-gray-200 p-4">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* チャット */}
        <div className="flex-1 min-h-[400px]">
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
      <main className="flex flex-1 flex-col p-4 min-h-screen">
        <h1 className="mb-4 text-lg font-semibold text-gray-800">企画書プレビュー</h1>
        <div className="flex-1">
          <MarkdownPreview markdown={planMarkdown} isLoading={planLoading} />
        </div>
      </main>
    </div>
  );
}
