import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { UIMessage } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// ────────────────────────────────────────────
// ステップ定義
// ────────────────────────────────────────────
export const PLANNER_STEPS = [
  {
    label: "テーマ・概要",
    question: "どんな企画をお考えですか？テーマや概要を教えてください。",
  },
  {
    label: "背景・課題",
    question: "その企画でどんな課題や背景を解決したいですか？",
  },
  {
    label: "ターゲット",
    question: "誰向けの企画ですか？ターゲットや想定ユーザーを教えてください。",
  },
  {
    label: "施策・手段",
    question: "具体的な内容や実現手段はどのようなものを考えていますか？",
  },
  {
    label: "KPI・指標",
    question: "成功の指標（KPI）は何ですか？どうなれば成功と言えますか？",
  },
] as const;

// ────────────────────────────────────────────
// ユーティリティ
// ────────────────────────────────────────────
export function getMessageText(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === "text") return part.text;
  }
  return "";
}

/**
 * アシスタントメッセージ数からステップを返す（1〜5、完了は6）
 */
export function getCurrentStep(messages: UIMessage[]): number {
  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  return Math.min(assistantCount + 1, 6);
}

/**
 * ユーザー回答を順番に返す（__init__ トリガーを除く）
 */
export function extractPlanningAnswers(messages: UIMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user")
    .map(getMessageText)
    .filter((t) => t !== "__init__");
}

// ────────────────────────────────────────────
// プロンプト構築
// ────────────────────────────────────────────
export function buildPlannerPrompt(
  step: number,
  messages: UIMessage[],
  ragContext: string
): string {
  const hasRag = ragContext.trim().length > 0;
  const ragSection = hasRag
    ? `\n\n【参考資料（RAG）】\n${ragContext}\n過去の資料に関連情報がある場合は「過去の○○資料では〜という事例がありました」という形で根拠を示してください。`
    : "";

  const baseRule = [
    "あなたは企画書作成を支援するプロのコンサルタントです。",
    "ユーザーへのヒアリングを1問ずつ行い、企画書に必要な情報を収集します。",
    "一度に複数の質問をせず、必ず1つだけ質問してください。",
    "ユーザーの回答を短く認識・要約してから次の質問に進んでください。",
    ragSection,
  ]
    .filter(Boolean)
    .join("\n");

  if (step === 1) {
    return [
      baseRule,
      "",
      "これがヒアリングの最初のステップです。",
      `次の質問をしてください: 「${PLANNER_STEPS[0].question}」`,
    ].join("\n");
  }

  if (step >= 2 && step <= 5) {
    const answers = extractPlanningAnswers(messages);
    const summary = answers
      .map((a, i) => `${PLANNER_STEPS[i].label}: ${a}`)
      .join("\n");

    return [
      baseRule,
      "",
      "【これまでのヒアリング内容】",
      summary,
      "",
      `現在はステップ${step}です。`,
      `ユーザーの直前の回答を1〜2文で受け止め、次の質問をしてください: 「${PLANNER_STEPS[step - 1].question}」`,
    ].join("\n");
  }

  // step === 6: 全ステップ完了
  const answers = extractPlanningAnswers(messages);
  const summary = answers
    .map((a, i) => `${PLANNER_STEPS[i]?.label ?? ""}: ${a}`)
    .join("\n");

  return [
    baseRule,
    "",
    "【ヒアリング完了内容】",
    summary,
    "",
    "全ステップのヒアリングが完了しました。",
    "ユーザーへの最後の回答を1〜2文で受け止め、",
    "「ヒアリングが完了しました。企画書を生成します。少々お待ちください。」と伝えてください。",
    "それ以外の文章は追加しないでください。",
  ].join("\n");
}

// ────────────────────────────────────────────
// 企画書セクション生成
// ────────────────────────────────────────────
const SECTION_PROMPTS: Record<string, string> = {
  "背景・課題":
    "企画の背景と解決すべき課題を、具体的かつ説得力ある文章で記述してください。",
  "目的・ゴール":
    "この企画で達成したい目的・ゴールを明確に記述してください。",
  "ターゲット・ペルソナ":
    "ターゲットユーザーのペルソナを具体的に記述してください。",
  "施策・解決策":
    "具体的な施策・解決策を箇条書きと説明文で記述してください。",
  "期待効果・KPI":
    "期待される効果と定量的なKPIを記述してください。",
};

export async function generateSection(
  sectionName: string,
  answers: string[],
  ragContext: string
): Promise<string> {
  const answerContext = answers
    .map((a, i) => `${PLANNER_STEPS[i]?.label ?? `回答${i + 1}`}: ${a}`)
    .join("\n");

  const ragPart =
    ragContext.trim().length > 0
      ? `\n\n【参考資料】\n${ragContext}\n参考資料に関連情報があれば根拠として活用してください。`
      : "";

  const instruction = SECTION_PROMPTS[sectionName] ?? "内容を記述してください。";

  const { text } = await generateText({
    model: google("gemini-2.0-flash-lite"),
    prompt: [
      "以下のヒアリング情報をもとに、企画書の「" + sectionName + "」セクションを日本語で記述してください。",
      instruction,
      "200〜400文字程度でまとめてください。Markdownの見出し（#）は含めないでください。",
      "",
      "【ヒアリング情報】",
      answerContext,
      ragPart,
    ].join("\n"),
  });

  return text.trim();
}

export async function generateFullPlan(
  answers: string[],
  ragContext: string
): Promise<string> {
  const title = answers[0] ? answers[0].slice(0, 40) : "企画書";

  const sections = [
    "背景・課題",
    "目的・ゴール",
    "ターゲット・ペルソナ",
    "施策・解決策",
    "期待効果・KPI",
  ];

  const sectionContents = await Promise.all(
    sections.map((s) => generateSection(s, answers, ragContext))
  );

  const parts = [`# ${title}`, ""];
  for (let i = 0; i < sections.length; i++) {
    parts.push(`## ${sections[i]}`);
    parts.push(sectionContents[i]);
    parts.push("");
  }

  return parts.join("\n");
}
