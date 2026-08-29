import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import { generateEmbedding, searchSimilarChunks } from "@/lib/embedding";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  getCurrentStep,
  buildPlannerPrompt,
  extractPlanningAnswers,
  generateFullPlan,
  getMessageText,
} from "@/lib/plannerAgent";

const SIMILARITY_THRESHOLD = 0.5; // プランナーは柔軟に参照

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId, messages } = body as {
    conversationId?: string;
    messages: UIMessage[];
  };

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // conversationsテーブルに行が無いとmessages/plansの外部キー制約に違反するため、
  // 初回リクエスト時に行が無ければ作成しておく
  if (conversationId) {
    const client = createServerSupabaseClient();
    await client
      .from("conversations")
      .upsert({ id: conversationId, mode: "planner" }, { onConflict: "id", ignoreDuplicates: true });
  }

  const userText = getMessageText(
    [...messages].reverse().find((m) => m.role === "user") ?? messages[0]
  );

  // ステップ判定（アシスタントメッセージ数から）
  const step = getCurrentStep(messages);

  // RAG検索（__init__ トリガーはスキップ）
  let ragContext = "";
  if (userText && userText !== "__init__") {
    try {
      const queryEmbedding = await generateEmbedding(userText);
      const allChunks = await searchSimilarChunks(queryEmbedding, 3);
      const chunks = allChunks.filter((c) => c.similarity >= SIMILARITY_THRESHOLD);
      if (chunks.length > 0) {
        ragContext = chunks
          .map((c) => `【${c.document_name}】\n${c.content}`)
          .join("\n\n");
      }
    } catch {
      // RAG失敗は無視して続行
    }
  }

  const systemPrompt = buildPlannerPrompt(step, messages, ragContext);
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google("gemini-3.5-flash-lite"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      // ステップ5完了（6になった）= 全ヒアリング完了 → 企画書生成
      if (step === 6 && conversationId) {
        try {
          const answers = extractPlanningAnswers(messages);
          const planMarkdown = await generateFullPlan(answers, ragContext);

          const client = createServerSupabaseClient();
          const { error } = await client.from("plans").insert({
            conversation_id: conversationId,
            content: planMarkdown,
          });
          if (error) {
            throw new Error(error.message);
          }
        } catch (e) {
          console.error("Plan generation failed:", e);
        }
      }

      // 会話履歴保存
      if (conversationId) {
        try {
          const client = createServerSupabaseClient();
          await client.from("messages").insert([
            {
              conversation_id: conversationId,
              role: "assistant",
              content: text,
            },
          ]);
        } catch {
          // ignore
        }
      }
    },
  });

  const response = result.toUIMessageStreamResponse();
  const headers = new Headers(response.headers);
  headers.set("X-Current-Step", String(step));

  return new Response(response.body, { status: response.status, headers });
}
