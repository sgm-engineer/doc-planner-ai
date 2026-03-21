"use client";

import { PLANNER_STEPS } from "@/lib/plannerAgent";

interface StepIndicatorProps {
  currentStep: number; // 1〜5、完了は6+
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 mb-2">ヒアリング進捗</p>
      <div className="flex items-center gap-1">
        {PLANNER_STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center flex-1 min-w-0">
              {/* ステップ丸 */}
              <div className="relative flex flex-col items-center flex-1">
                <div
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white ring-2 ring-blue-200 animate-pulse"
                      : "bg-gray-200 text-gray-400",
                  ].join(" ")}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={[
                    "text-[10px] mt-1 text-center leading-tight whitespace-nowrap",
                    isDone
                      ? "text-green-600 font-medium"
                      : isActive
                      ? "text-blue-600 font-medium"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>

              {/* コネクタ線 */}
              {index < PLANNER_STEPS.length - 1 && (
                <div
                  className={[
                    "h-0.5 w-3 shrink-0 mb-4 transition-all duration-300",
                    isDone ? "bg-green-400" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>

      {currentStep > 5 && (
        <p className="text-xs text-green-600 font-medium text-center mt-1">
          ✓ ヒアリング完了
        </p>
      )}
    </div>
  );
}
