import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { STATE } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });

  const openai = getOpenAIClient();

  const uploaded = await openai.files.create({
    file,
    purpose: "assistants",
  });

  const vs = await openai.vectorStores.create({
    name: "pose-pdf-store",
    file_ids: [uploaded.id],
  });

  STATE.pdfFileId = uploaded.id;
  STATE.vectorStoreId = vs.id;

  return NextResponse.json({ ok: true, vectorStoreId: vs.id, pdfFileId: uploaded.id, state: STATE });
}
