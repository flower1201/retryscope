import { z } from "zod";

/** Loose Claude Code transcript line — format is unstable across versions. */
export const TranscriptLineSchema = z
  .object({
    type: z.string().optional(),
    uuid: z.string().optional(),
    timestamp: z.string().optional(),
    sessionId: z.string().optional(),
    message: z
      .object({
        role: z.string().optional(),
        content: z.union([z.string(), z.array(z.unknown())]).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const ToolUseBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string().min(1),
  name: z.string().min(1),
  input: z.unknown().optional(),
});

export const ToolResultBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string().min(1),
  content: z.unknown().optional(),
  is_error: z.boolean().optional(),
});

export type ToolUseBlock = z.infer<typeof ToolUseBlockSchema>;
export type ToolResultBlock = z.infer<typeof ToolResultBlockSchema>;
