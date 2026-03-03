import { NextResponse } from "next/server";
import sharp from "sharp";
import { getOpenAIClient } from "@/lib/openai";
import { STATE, assertCanProceed, advanceStage } from "@/lib/runtime";
import { workflowStepSchema } from "@/lib/schema";

export const runtime = "nodejs";

function stageQuery(stage: string) {
  switch(stage) {
    case "STAGE_1_25": return "STAGE 1.25 — POSE EXTRACTION VISUALIZATION rules";
    case "STAGE_2": return "STAGE 2 — POSE VARIATION GRID (A1–A9) rules";
    case "STAGE_1": return "STAGE 1 — EXTRACT POSE (IMAGE A) rules";
    case "STAGE_1_5": return "STAGE 1.5 — POSE VALIDATION GATE rules";
    case "STAGE_3": return "STAGE 3 — POSE SELECTION GATE rules";
    case "STAGE_4": return "STAGE 4 — POSE ISOLATION (SINGLE OUTPUT) rules";
    default: return "STAGE 0 — INPUT VALIDATION GATE rules";
  }
}

function cropGridCellB64(gridB64: string, cell: string) {
  const idx = parseInt(cell.substring(1), 10) - 1; // A1=>0
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  const buf = Buffer.from(gridB64, "base64");
  const W = 1024, H = 1024; // matches image generation size in this MVP
  const cw = Math.floor(W / 3);
  const ch = Math.floor(H / 3);
  const left = col * cw;
  const top = row * ch;
  // deterministic literal extraction (includes labels if present)
  return sharp(buf)
    .extract({ left, top, width: cw, height: ch })
    .png()
    .toBuffer()
    .then(out => out.toString("base64"));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const command = body?.command as string | undefined;
  if (!command) return NextResponse.json({ ok: false, error: "Missing command" }, { status: 400 });

  try {
    const openai = getOpenAIClient();
    assertCanProceed(command, STATE);

    // Auto-confirm lock at Stage 1.5 in MVP
    if (STATE.currentStage === "STAGE_1_5") STATE.lockedPoseConfirmed = true;

    // STAGE 4: Deterministic isolation (NO re-render) from grid OR custom upload
    if (STATE.currentStage === "STAGE_3") {
      // user is proceeding to STAGE 4
      const sel = STATE.selection!;
      let isolatedB64: string | undefined;

      if (sel.type === "custom") {
        if (!STATE.customPoseB64) throw new Error("Custom pose not uploaded.");
        isolatedB64 = STATE.customPoseB64;
      } else {
        if (!STATE.stage2GridImageB64) throw new Error("Missing Stage 2 grid.");
        isolatedB64 = await cropGridCellB64(STATE.stage2GridImageB64, sel.cell);
      }

      const step = {
        stage: "STAGE 4 — POSE ISOLATION (SINGLE OUTPUT)",
        status: "DONE",
        next_required_user_command: "Abort Workflow OR Restart Pipeline",
        image_required: true,
        image_prompt: "",
        notes_for_runtime: sel.type === "custom"
          ? "Isolated from custom upload (no reinterpretation)."
          : `Isolated by literal crop from Stage 2 grid cell ${sel.cell} (deterministic).`
      };

      // advance to STAGE_4
      advanceStage(STATE);

      return NextResponse.json({
        ok: true,
        step,
        imageDataUrl: `data:image/png;base64,${isolatedB64}`,
        state: STATE
      });
    }

    // Default: use PDF RAG + GPT-5 to decide step metadata, then force images if required
    const tools: any[] = [];
    if (STATE.vectorStoreId) {
      tools.push({ type: "file_search", vector_store_ids: [STATE.vectorStoreId] });
    }

    const r = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content:
            "You are a strict workflow executor. Return ONLY JSON that matches the provided schema. No extra keys. No markdown."
        },
        {
          role: "user",
          content:
            `We are running a stage-gated pose workflow described in the attached PDF.\n` +
            `Current stage: ${STATE.currentStage}.\n` +
            `User command: ${command}.\n\n` +
            `Use file_search to retrieve ONLY the rules for the current stage: "${stageQuery(STATE.currentStage)}".\n` +
            `Decide whether this stage requires image generation. If yes, output an image_prompt that is feasible with image tools.\n` +
            `Output must comply with schema exactly.`
        }
      ],
      tools,
      text: {
        format: {
          type: "json_schema",
          name: workflowStepSchema.name,
          schema: workflowStepSchema.schema,
          strict: true
        }
      }
    });

    const step = JSON.parse(r.output_text);

    let imageDataUrl: string | undefined;

    if (step.image_required) {
      const imgPrompt =
        (step.image_prompt as string | undefined) ??
        "Neutral gray mannequin on white background matching Image A pose and camera.";

      const imgRes = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imgPrompt,
        size: "1024x1024"
      });

      const b64 = imgRes.data?.[0]?.b64_json;
      if (b64) {
        imageDataUrl = `data:image/png;base64,${b64}`;
        if (STATE.currentStage === "STAGE_1_25") STATE.stage125ImageB64 = b64;
        if (STATE.currentStage === "STAGE_2") STATE.stage2GridImageB64 = b64;
      }
    }

    advanceStage(STATE);

    return NextResponse.json({ ok: true, step, imageDataUrl, state: STATE });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, state: STATE }, { status: 400 });
  }
}
