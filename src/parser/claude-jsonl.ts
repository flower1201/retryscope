import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { fingerprintToolInput } from "../core/fingerprint.js";
import type { ParseResult, ParseWarning, ToolEvent, ToolStatus } from "../core/types.js";
import {
  ToolResultBlockSchema,
  ToolUseBlockSchema,
  TranscriptLineSchema,
} from "./schemas.js";

interface PendingUse {
  id: string;
  toolName: string;
  inputFingerprint?: string;
  timestamp?: string;
  source: { file: string; line: number };
  sequence: number;
}

function contentBlocks(content: unknown): unknown[] {
  if (Array.isArray(content)) return content;
  return [];
}

function statusFromResult(isError: boolean | undefined): {
  status: ToolStatus;
  statusReason: string;
} {
  if (isError === true) {
    return { status: "failure", statusReason: "tool_result.is_error === true" };
  }
  if (isError === false) {
    return { status: "success", statusReason: "tool_result.is_error === false" };
  }
  // Present result without is_error: treat as success (Claude Code common case)
  return {
    status: "success",
    statusReason: "tool_result present without is_error; treated as success",
  };
}

export async function parseClaudeJsonlFile(
  filePath: string,
): Promise<ParseResult> {
  const warnings: ParseWarning[] = [];
  const pending = new Map<string, PendingUse>();
  const completed: ToolEvent[] = [];
  let sequence = 0;
  let linesTotal = 0;
  let linesParsed = 0;
  let linesSkipped = 0;
  let toolUses = 0;
  let toolResults = 0;
  let unmatchedResults = 0;

  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const raw of rl) {
    linesTotal += 1;
    const lineNo = linesTotal;
    const trimmed = raw.trim();
    if (!trimmed) {
      linesSkipped += 1;
      continue;
    }

    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      linesSkipped += 1;
      warnings.push({
        line: lineNo,
        code: "INVALID_JSON",
        message: "Line is not valid JSON; skipped",
      });
      continue;
    }

    const parsed = TranscriptLineSchema.safeParse(json);
    if (!parsed.success) {
      linesSkipped += 1;
      warnings.push({
        line: lineNo,
        code: "UNKNOWN_SHAPE",
        message: "Line failed loose schema; skipped",
      });
      continue;
    }

    linesParsed += 1;
    const row = parsed.data;
    const blocks = contentBlocks(row.message?.content);

    for (const block of blocks) {
      const use = ToolUseBlockSchema.safeParse(block);
      if (use.success) {
        toolUses += 1;
        sequence += 1;
        pending.set(use.data.id, {
          id: use.data.id,
          toolName: use.data.name,
          inputFingerprint: fingerprintToolInput(use.data.name, use.data.input),
          timestamp: row.timestamp,
          source: { file: filePath, line: lineNo },
          sequence,
        });
        continue;
      }

      const result = ToolResultBlockSchema.safeParse(block);
      if (result.success) {
        toolResults += 1;
        const prior = pending.get(result.data.tool_use_id);
        if (!prior) {
          unmatchedResults += 1;
          warnings.push({
            line: lineNo,
            code: "UNMATCHED_TOOL_RESULT",
            message: `tool_result for unknown tool_use_id=${result.data.tool_use_id}`,
          });
          continue;
        }
        pending.delete(result.data.tool_use_id);
        const { status, statusReason } = statusFromResult(result.data.is_error);
        completed.push({
          id: prior.id,
          sequence: prior.sequence,
          timestamp: prior.timestamp ?? row.timestamp,
          toolName: prior.toolName,
          inputFingerprint: prior.inputFingerprint,
          status,
          statusReason,
          source: prior.source,
          resultSource: { file: filePath, line: lineNo },
        });
      }
    }
  }

  // Remaining uses without results → unknown (never invent failure)
  for (const prior of pending.values()) {
    completed.push({
      id: prior.id,
      sequence: prior.sequence,
      timestamp: prior.timestamp,
      toolName: prior.toolName,
      inputFingerprint: prior.inputFingerprint,
      status: "unknown",
      statusReason: "no matching tool_result found before EOF",
      source: prior.source,
    });
  }

  completed.sort((a, b) => a.sequence - b.sequence);

  return {
    events: completed,
    warnings,
    stats: {
      linesTotal,
      linesParsed,
      linesSkipped,
      toolUses,
      toolResults,
      unmatchedResults,
    },
  };
}
