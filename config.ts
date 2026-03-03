export const workflowStepSchema = {
  name: "workflow_step",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      stage: { type: "string" },
      status: { type: "string", enum: ["DONE", "WAITING", "FAIL"] },
      next_required_user_command: { type: "string" },
      image_required: { type: "boolean" },
      image_prompt: { type: "string" },
      notes_for_runtime: { type: "string" }
    },
    required: ["stage", "status", "next_required_user_command", "image_required"]
  }
} as const;
