export type Stage =
  | "STAGE_0"
  | "STAGE_1"
  | "STAGE_1_25"
  | "STAGE_1_5"
  | "STAGE_2"
  | "STAGE_3"
  | "STAGE_4";

export type PoseSelection =
  | { type: "grid"; cell: "A1"|"A2"|"A3"|"A4"|"A5"|"A6"|"A7"|"A8"|"A9" }
  | { type: "custom" };

export type RuntimeState = {
  vectorStoreId?: string;
  pdfFileId?: string;
  imageAFileId?: string;

  currentStage: Stage;

  stage125ImageB64?: string;
  stage2GridImageB64?: string;

  selection?: PoseSelection;
  customPoseB64?: string;

  lockedPoseConfirmed?: boolean;
};

export const STATE: RuntimeState = {
  currentStage: "STAGE_0",
};

export function allowedCommandsFor(stage: Stage): string[] {
  const map: Record<Stage, string[]> = {
    STAGE_0: ["Proceed to STAGE 1 — EXTRACT POSE (IMAGE A)"],
    STAGE_1: ["Proceed to STAGE 1.25 — POSE EXTRACTION VISUALIZATION"],
    STAGE_1_25: ["Proceed to STAGE 1.5 — POSE VALIDATION GATE"],
    STAGE_1_5: ["Proceed to STAGE 2 — POSE VARIATION GRID (A1–A9)"],
    STAGE_2: ["Proceed to STAGE 3 — POSE SELECTION GATE"],
    STAGE_3: ["Proceed to STAGE 4 — POSE ISOLATION (SINGLE OUTPUT)"],
    STAGE_4: []
  };
  return map[stage] ?? [];
}

export function assertCanProceed(command: string, state: RuntimeState) {
  const allowed = allowedCommandsFor(state.currentStage);
  if (!allowed.includes(command)) {
    throw new Error(
      `Command not allowed from ${state.currentStage}. Allowed: ${allowed.join(" | ")}`
    );
  }
  if (state.currentStage === "STAGE_0" && !state.imageAFileId) {
    throw new Error("Missing Image A. Upload Image A first.");
  }
  if ((state.currentStage === "STAGE_1_25" || state.currentStage === "STAGE_2") && !state.vectorStoreId) {
    throw new Error("Missing PDF vector store. Upload PDF first.");
  }
  if (state.currentStage === "STAGE_3" && !state.stage2GridImageB64) {
    throw new Error("Missing Stage 2 grid image. Run STAGE 2 first.");
  }
  if (state.currentStage === "STAGE_3" && !state.selection) {
    throw new Error("No pose selected. Use the Stage 3 selection buttons first.");
  }
}

export function advanceStage(state: RuntimeState) {
  const order: Stage[] = ["STAGE_0","STAGE_1","STAGE_1_25","STAGE_1_5","STAGE_2","STAGE_3","STAGE_4"];
  const idx = order.indexOf(state.currentStage);
  if (idx >= 0 && idx < order.length - 1) state.currentStage = order[idx + 1];
}
