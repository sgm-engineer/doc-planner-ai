"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import AppHeader from "@/components/AppHeader";

export default function QaPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleUploadSuccess() {
    setRefreshTrigger((n) => n + 1);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <AppHeader title="QA Bot" />
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* 左ペイン: ドキュメント管理 */}
        <aside className="w-full md:w-80 shrink-0 flex flex-col min-h-0 gap-4 p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
          <h2 className="text-base font-semibold text-gray-800 shrink-0">ドキュメント</h2>
          <div className="shrink-0">
            <DocumentUploader onUploadSuccess={handleUploadSuccess} />
          </div>
          <div className="flex-1 min-h-[150px] md:min-h-0 overflow-y-auto">
            <DocumentList refreshTrigger={refreshTrigger} />
          </div>
        </aside>

        {/* 右ペイン: チャット */}
        <main className="flex flex-1 min-h-0 flex-col p-4">
          <div className="flex-1 min-h-0">
            <ChatWindow />
          </div>
        </main>
      </div>
    </div>
  );
}
