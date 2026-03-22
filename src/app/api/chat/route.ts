import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import { generateEmbedding, searchSimilarChunks } from "@/lib/embedding";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { ChunkResult } from "@/types/index";

const SIMILARITY_THRESHOLD = 0.7;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

function buildSystemPrompt(chunks: ChunkResult[]): string {
  if (chunks.length === 0) {
    return [
      "あなたは社内ドキュメントに精通したアシスタントです。",
      "以下の参考資料を元に、質問に対して正確に回答してください。",
      "参考資料にない情報については「資料には記載がありません」と答えてください。",
      "",
      "【参考資料】",
      "（関連する資料が見つかりませんでした）",
    ].join("\n");
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.document_name}\n${c.content}`)
    .join("\n\n");

  return [
    "あなたは社内ドキュメントに精通したアシスタントです。",
    "以下の参考資料を元に、質問に対して正確に回答してください。",
    "参考資料にない情報については「資料には記載がありません」と答えてください。",
    "",
    "【参考資料】",
    context,
  ].join("\n");
}

function extractLatestUserText(messages: UIMessage[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const latest = userMessages[userMessages.length - 1];
  if (!latest) return "";
  for (const part of latest.parts) {
    if (part.type === "text") return part.text;
  }
  return "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id: conversationId, messages } = body as {
    id?: string;
    messages: UIMessage[];
  };

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userText = extractLatestUserText(messages);
  if (!userText) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 最新ユーザーメッセージをEmbeddingして類似チャンク検索
  const queryEmbedding = await generateEmbedding(userText);
  const allChunks = await searchSimilarChunks(queryEmbedding, 5);
  const chunks = allChunks.filter((c) => c.similarity >= SIMILARITY_THRESHOLD);

  const sourceNames = [...new Set(chunks.map((c) => c.document_name))];
  const systemPrompt = buildSystemPrompt(chunks);

  // 会話履歴保存（ユーザーメッセージ）
  if (conversationId) {
    const client = createServerSupabaseClient();
    await client.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: userText,
    });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google("gemini-2.0-flash-lite"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      if (!conversationId) return;
      const client = createServerSupabaseClient();
      const assistantContent =
        sourceNames.length > 0
          ? `${text}\n\n参照: ${sourceNames.join("、")}`
          : text;
      await client.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantContent,
      });
    },
  });

  // UIMessageStreamResponseとして返す（DefaultChatTransportが期待する形式）
  const response = result.toUIMessageStreamResponse();
  const headers = new Headers(response.headers);
  if (sourceNames.length > 0) {
    headers.set("X-Source-Documents", JSON.stringify(sourceNames));
  }

  return new Response(response.body, { status: response.status, headers });
}
