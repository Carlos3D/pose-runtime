import { NextResponse } from "next/server";
import { STATE } from "@/lib/runtime";
import { loadApiKey } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, state: STATE, hasKey: !!(process.env.OPENAI_API_KEY || loadApiKey()) });
}
