import { NextResponse } from "next/server";

interface HealthStatus {
  status: "ok" | "error";
  gemini: { connected: boolean; error?: string };
  supabase: { connected: boolean; error?: string };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const result: HealthStatus = {
    status: "ok",
    gemini: { connected: false },
    supabase: { connected: false },
  };

  // Gemini 接続確認
  try {
    const { getGeminiModel } = await import("@/lib/gemini");
    const model = getGeminiModel();
    await model.generateContent("ping");
    result.gemini = { connected: true };
  } catch (e) {
    result.gemini = { connected: false, error: String(e) };
    result.status = "error";
  }

  // Supabase 接続確認
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase");
    const client = createServerSupabaseClient();
    const { error } = await client.from("_health_check_dummy").select("*").limit(1);
    // テーブルが存在しないエラー(42P01)は接続成功として扱う
    if (error && error.code !== "42P01") {
      throw new Error(error.message);
    }
    result.supabase = { connected: true };
  } catch (e) {
    result.supabase = { connected: false, error: String(e) };
    result.status = "error";
  }

  const httpStatus = result.status === "ok" ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
