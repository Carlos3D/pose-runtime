import { NextResponse } from "next/server";
import { STATE } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const selection = body?.selection as string | undefined;

  if (!selection) {
    return NextResponse.json({ ok: false, error: "Missing selection" }, { status: 400 });
  }

  if (selection === "custom") {
    STATE.selection = { type: "custom" };
    return NextResponse.json({ ok: true, state: STATE });
  }

  const m = selection.match(/^A[1-9]$/);
  if (!m) {
    return NextResponse.json({ ok: false, error: "Invalid selection. Use A1..A9 or custom." }, { status: 400 });
  }

  STATE.selection = { type: "grid", cell: selection as any };
  return NextResponse.json({ ok: true, state: STATE });
}
