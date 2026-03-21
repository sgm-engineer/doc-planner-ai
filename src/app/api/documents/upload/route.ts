import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, splitIntoChunks } from "@/lib/pdfParser";
import { generateEmbedding } from "@/lib/embedding";
import { createServerSupabaseClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
  }

  const fileName = file instanceof File ? file.name : "upload.pdf";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // PDFテキスト抽出
  let text: string;
  try {
    text = await extractTextFromPDF(buffer);
  } catch (e) {
    return NextResponse.json({ error: `Failed to parse PDF: ${String(e)}` }, { status: 422 });
  }

  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No text content found in PDF" }, { status: 422 });
  }

  const client = createServerSupabaseClient();

  // documentsテーブルにレコード挿入
  const { data: docData, error: docError } = await client
    .from("documents")
    .insert({ name: fileName, file_size: file.size })
    .select("id")
    .single();

  if (docError || !docData) {
    return NextResponse.json(
      { error: `Failed to save document: ${docError?.message}` },
      { status: 500 }
    );
  }

  const documentId: string = docData.id;

  // チャンクをEmbedding生成してSupabaseに保存（1件ずつ処理）
  try {
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      const { error: chunkError } = await client.from("document_chunks").insert({
        document_id: documentId,
        content: chunks[i],
        chunk_index: i,
        embedding,
      });

      if (chunkError) {
        throw new Error(chunkError.message);
      }
    }
  } catch (e) {
    // ロールバック: documentsレコードを削除（cascadeでchunksも削除される）
    await client.from("documents").delete().eq("id", documentId);
    return NextResponse.json(
      { error: `Failed to process chunks: ${String(e)}` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { documentId, chunkCount: chunks.length, name: fileName },
    { status: 201 }
  );
}
