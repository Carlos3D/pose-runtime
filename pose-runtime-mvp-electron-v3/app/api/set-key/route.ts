import { NextResponse } from "next/server";
import { saveApiKey } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = body?.key as string | undefined;

  if (!key || key.length < 20) {
    return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 400 });
  }

  saveApiKey(key);
  return NextResponse.json({ ok: true });
}
