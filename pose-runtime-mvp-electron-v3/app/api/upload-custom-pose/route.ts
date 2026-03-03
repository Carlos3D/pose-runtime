import { NextResponse } from "next/server";
import { STATE } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "Missing image" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const b64 = Buffer.from(arrayBuffer).toString("base64");

  STATE.customPoseB64 = b64;
  STATE.selection = { type: "custom" };

  return NextResponse.json({ ok: true, state: STATE });
}
