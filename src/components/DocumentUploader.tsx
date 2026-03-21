"use client";

import { useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

interface DocumentUploaderProps {
  onUploadSuccess: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024;

export default function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setState("error");
      setErrorMessage("PDFファイルのみアップロードできます");
      return;
    }
    if (file.size > MAX_SIZE) {
      setState("error");
      setErrorMessage("ファイルサイズは10MB以下にしてください");
      return;
    }

    setState("uploading");
    setProgress(0);

    // XHR でプログレス取得
    const formData = new FormData();
    formData.append("file", file);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/documents/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error ?? "アップロードに失敗しました"));
          } catch {
            reject(new Error("アップロードに失敗しました"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("ネットワークエラーが発生しました"));
      xhr.send(formData);
    })
      .then(() => {
        setState("success");
        setProgress(100);
        onUploadSuccess();
        setTimeout(() => setState("idle"), 2500);
      })
      .catch((e: Error) => {
        setState("error");
        setErrorMessage(e.message);
      })
      .finally(() => {
        if (inputRef.current) inputRef.current.value = "";
      });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  const isUploading = state === "uploading";

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isUploading
            ? "cursor-default border-blue-300 bg-blue-50"
            : isDragOver
            ? "cursor-copy border-blue-400 bg-blue-50"
            : state === "success"
            ? "cursor-default border-green-400 bg-green-50"
            : state === "error"
            ? "cursor-pointer border-red-300 bg-red-50 hover:border-red-400"
            : "cursor-pointer border-gray-300 hover:border-blue-400 hover:bg-blue-50",
        ].join(" ")}
      >
        {/* アイコン */}
        {state === "success" ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isUploading ? (
          <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        ) : (
          <div
            className={[
              "w-10 h-10 rounded-full flex items-center justify-center",
              isDragOver ? "bg-blue-100" : "bg-gray-100",
            ].join(" ")}
          >
            <svg
              className={`w-5 h-5 ${isDragOver ? "text-blue-500" : "text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
              />
            </svg>
          </div>
        )}

        {/* ラベル */}
        <p
          className={`text-sm font-medium ${
            state === "success"
              ? "text-green-700"
              : isUploading
              ? "text-blue-600"
              : isDragOver
              ? "text-blue-600"
              : "text-gray-600"
          }`}
        >
          {state === "success"
            ? "アップロード完了"
            : isUploading
            ? "アップロード中..."
            : isDragOver
            ? "ここにドロップ"
            : "PDFをドロップ、またはクリックして選択"}
        </p>
        <p className="text-xs text-gray-400">PDF のみ · 最大 10 MB</p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />
      </div>

      {/* プログレスバー */}
      {isUploading && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-400">{progress}%</p>
        </div>
      )}

      {/* エラー */}
      {state === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <p className="text-xs text-red-600">{errorMessage}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
            className="ml-auto text-red-400 hover:text-red-600"
            aria-label="閉じる"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
