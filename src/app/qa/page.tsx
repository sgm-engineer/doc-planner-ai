"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";

export default function QaPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleUploadSuccess() {
    setRefreshTrigger((n) => n + 1);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 左ペイン: ドキュメント管理 */}
      <aside className="w-full md:w-80 shrink-0 flex flex-col gap-4 p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
        <h2 className="text-base font-semibold text-gray-800">ドキュメント</h2>
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />
        <div className="flex-1 overflow-y-auto">
          <DocumentList refreshTrigger={refreshTrigger} />
        </div>
      </aside>

      {/* 右ペイン: チャット */}
      <main className="flex flex-1 flex-col p-4 min-h-[calc(100vh-1px)] md:min-h-screen">
        <h1 className="mb-4 text-lg font-semibold text-gray-800">QA Bot</h1>
        <div className="flex-1">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
