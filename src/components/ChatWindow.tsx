"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface ChatWindowProps {
  api?: string;
  conversationId?: string;
  placeholder?: string;
  emptyStateText?: string;
  /** マウント時に自動送信するテキスト（例: "__init__" でプランナーを起動） */
  initialMessage?: string;
  /** アシスタントメッセージ数が変化したときに呼ばれる */
  onAssistantCount?: (count: number) => void;
}

function getMessageText(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === "text") return part.text;
  }
  return "";
}

export default function ChatWindow({
  api = "/api/chat",
  conversationId,
  placeholder = "質問を入力してください...",
  emptyStateText = "ドキュメントについて質問してください",
  initialMessage,
  onAssistantCount,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [sourceMap, setSourceMap] = useState<Record<string, string[]>>({});
  const initSentRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        body: conversationId ? { conversationId } : undefined,
        prepareSendMessagesRequest: async ({ api: a, id, messages, body, headers }) => ({
          api: a,
          headers: { ...headers, "Content-Type": "application/json" },
          body: { ...body, id, messages },
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, conversationId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }) => {
      setSourceMap((prev) => {
        const pending = prev.__pending__;
        if (!pending) return prev;
        const { __pending__: _, ...rest } = prev;
        return { ...rest, [message.id]: pending };
      });
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // 初回自動送信
  useEffect(() => {
    if (initialMessage && !initSentRef.current && messages.length === 0) {
      initSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // アシスタントメッセージ数を親に通知
  useEffect(() => {
    if (!onAssistantCount) return;
    const count = messages.filter((m) => m.role === "assistant").length;
    onAssistantCount(count);
  }, [messages, onAssistantCount]);

  // 末尾スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  // __init__ メッセージは非表示
  const visibleMessages = messages.filter(
    (m) => !(m.role === "user" && getMessageText(m) === "__init__")
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 && !isLoading && (
          <p className="text-center text-gray-400 text-sm mt-8">{emptyStateText}</p>
        )}

        {visibleMessages.map((msg) => {
          const isUser = msg.role === "user";
          const text = getMessageText(msg);
          const sources = sourceMap[msg.id];
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none prose-p:my-1">
                    <ReactMarkdown>{text}</ReactMarkdown>
                    {sources && sources.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                        参照: {sources.join("、")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
}
