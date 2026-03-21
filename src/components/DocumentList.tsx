"use client";

import { useEffect, useState, useCallback } from "react";
import type { Document } from "@/types/index";

interface DocumentListProps {
  refreshTrigger: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonRow() {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 animate-pulse">
      <div className="w-7 h-7 rounded bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
      </div>
    </li>
  );
}

export default function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmId(null);
    try {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </ul>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">資料がありません</p>
        <p className="text-xs">PDFをアップロードしてください</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => {
        const isDeleting = deletingId === doc.id;
        const isConfirming = confirmId === doc.id;

        return (
          <li
            key={doc.id}
            className={[
              "rounded-lg border px-3 py-2.5 text-sm transition-colors",
              isConfirming
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white hover:border-gray-300",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              {/* PDF アイコン */}
              <div className="w-7 h-7 shrink-0 rounded bg-red-100 flex items-center justify-center">
                <span className="text-[9px] font-bold text-red-600">PDF</span>
              </div>

              {/* ファイル情報 */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-800 leading-tight">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatBytes(doc.file_size)} · {formatDate(doc.created_at)}
                </p>
              </div>

              {/* 削除ボタン / 確認ボタン */}
              {isDeleting ? (
                <span className="text-xs text-gray-400 shrink-0">削除中...</span>
              ) : isConfirming ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="rounded px-2 py-0.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(doc.id)}
                  className="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                  aria-label="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* 削除確認メッセージ */}
            {isConfirming && (
              <p className="mt-1.5 text-xs text-red-600 pl-10">
                この資料を削除しますか？関連チャンクも削除されます。
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
