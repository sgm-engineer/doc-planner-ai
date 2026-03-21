"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type SectionState = "pending" | "loading" | "generated";

interface MarkdownPreviewProps {
  markdown: string | null;
  isLoading: boolean;
}

const SECTIONS = [
  "背景・課題",
  "目的・ゴール",
  "ターゲット・ペルソナ",
  "施策・解決策",
  "期待効果・KPI",
];

function parseSections(markdown: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = markdown.split("\n");
  let currentSection = "";
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) result[currentSection] = buffer.join("\n").trim();
      currentSection = line.replace("## ", "").trim();
      buffer = [];
    } else if (!line.startsWith("# ")) {
      buffer.push(line);
    }
  }
  if (currentSection) result[currentSection] = buffer.join("\n").trim();

  return result;
}

function SkeletonBlock() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="h-3 bg-gray-200 rounded w-4/6" />
    </div>
  );
}

export default function MarkdownPreview({ markdown, isLoading }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false);

  const sectionState: SectionState = isLoading
    ? "loading"
    : markdown
    ? "generated"
    : "pending";

  const sectionData = markdown ? parseSections(markdown) : {};
  const title = markdown
    ? markdown.split("\n").find((l) => l.startsWith("# "))?.replace("# ", "") ?? "企画書"
    : "企画書";

  async function handleCopy() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">企画書プレビュー</h2>
        {markdown && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                コピー済み
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                テキストをコピー
              </>
            )}
          </button>
        )}
      </div>

      {/* 本文 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* タイトル */}
        <div>
          {sectionState === "pending" ? (
            <div className="h-6 bg-gray-100 rounded w-1/2" />
          ) : sectionState === "loading" ? (
            <div className="h-6 bg-blue-100 rounded w-1/2 animate-pulse" />
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          )}
        </div>

        {/* セクション */}
        {SECTIONS.map((section) => (
          <div key={section} className="space-y-1.5">
            {/* セクション見出し */}
            <div
              className={[
                "text-sm font-semibold",
                sectionState === "generated" ? "text-gray-800" : "text-gray-300",
              ].join(" ")}
            >
              {section}
            </div>

            {/* セクション本文 */}
            {sectionState === "pending" && (
              <div className="h-3 bg-gray-100 rounded w-full" />
            )}
            {sectionState === "loading" && <SkeletonBlock />}
            {sectionState === "generated" && (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{sectionData[section] ?? ""}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {sectionState === "pending" && (
          <p className="text-center text-xs text-gray-400 pt-4">
            ヒアリングが完了すると企画書が生成されます
          </p>
        )}
      </div>
    </div>
  );
}
