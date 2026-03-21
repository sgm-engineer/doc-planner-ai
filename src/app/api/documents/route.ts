import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Document } from "@/types/index";

export async function GET() {
  const client = createServerSupabaseClient();
  const { data, error } = await client
    .from("documents")
    .select("id, name, file_size, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch documents: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ documents: (data ?? []) as Document[] });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Document id is required" }, { status: 400 });
  }

  const client = createServerSupabaseClient();
  const { error } = await client.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: `Failed to delete document: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
