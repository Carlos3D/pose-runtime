import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { STATE } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "Missing image" }, { status: 400 });

  const openai = getOpenAIClient();

  const uploaded = await openai.files.create({
    file,
    purpose: "vision",
  });

  STATE.imageAFileId = uploaded.id;
  STATE.currentStage = "STAGE_0";

  return NextResponse.json({ ok: true, imageAFileId: uploaded.id, state: STATE });
}
