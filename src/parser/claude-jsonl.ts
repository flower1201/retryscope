import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { canonicalize, groupIdForToolCall } from "../core/fingerprint.js";
import type { ParseResult, ParseWarning, ToolEvent, ToolStatus } from "../core/types.js";
import {
  ToolResultBlockSchema,
  ToolUseBlockSchema,
  TranscriptLineSchema,
} from "./schemas.js";

interface PendingUse {
  id: string;
  toolName: string;
  inputGroupId?: string;
  inputCanon?: string;
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
    return {
      status: "success",
      statusReason: "tool_result.is_error === false (tool reported no error; not task success)",
    };
  }
  return {
    status: "success",
    statusReason:
      "tool_result present without is_error; treated as success (tool did not report error)",
  };
}

export async function parseClaudeJsonlFile(
  filePath: string,
): Promise<ParseResult> {
  const warnings: ParseWarning[] = [];
  const pending = new Map<string, PendingUse>();
  const completed = new Map<string, ToolEvent>();
  let sequence = 0;
  let linesTotal = 0;
  let linesParsed = 0;
  let linesSkipped = 0;
  let toolUses = 0;
  let toolResults = 0;
  let unmatchedResults = 0;
  let duplicateToolUseIds = 0;

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

    // Optional top-level toolUseResult presence is noted but not required for status
    if ("toolUseResult" in (json as object)) {
      const tur = (json as { toolUseResult?: unknown }).toolUseResult;
      if (tur !== undefined && tur !== null && typeof tur !== "object" && typeof tur !== "string") {
        warnings.push({
          line: lineNo,
          code: "TOOL_USE_RESULT_SHAPE",
          message: "toolUseResult has unexpected primitive type; ignored for status",
        });
      }
    }

    if (row.timestamp !== undefined) {
      const t = Date.parse(row.timestamp);
      if (Number.isNaN(t)) {
        warnings.push({
          line: lineNo,
          code: "INVALID_TIMESTAMP",
          message: `Unparseable timestamp: ${row.timestamp}`,
        });
      }
    }

    for (const block of blocks) {
      const use = ToolUseBlockSchema.safeParse(block);
      if (use.success) {
        toolUses += 1;
        const inputCanon = canonicalize({
          toolName: use.data.name,
          input: use.data.input ?? {},
        });
        const inputGroupId = groupIdForToolCall(use.data.name, use.data.input);

        if (completed.has(use.data.id) || pending.has(use.data.id)) {
          duplicateToolUseIds += 1;
          const prior =
            pending.get(use.data.id) ??
            (() => {
              const ev = completed.get(use.data.id)!;
              return {
                inputCanon: undefined as string | undefined,
                toolName: ev.toolName,
                inputGroupId: ev.inputGroupId,
              };
            })();
          if (prior.inputCanon && prior.inputCanon !== inputCanon) {
            warnings.push({
              line: lineNo,
              code: "DUPLICATE_TOOL_USE_CONFLICT",
              message: `Duplicate tool_use.id=${use.data.id} with conflicting input; keeping first`,
            });
          } else {
            warnings.push({
              line: lineNo,
              code: "DUPLICATE_TOOL_USE",
              message: `Duplicate tool_use.id=${use.data.id}; counted once`,
            });
          }
          continue;
        }

        sequence += 1;
        pending.set(use.data.id, {
          id: use.data.id,
          toolName: use.data.name,
          inputGroupId,
          inputCanon,
          timestamp: row.timestamp && !Number.isNaN(Date.parse(row.timestamp))
            ? row.timestamp
            : undefined,
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
          if (completed.has(result.data.tool_use_id)) {
            warnings.push({
              line: lineNo,
              code: "DUPLICATE_TOOL_RESULT",
              message: `Extra tool_result for already-completed id=${result.data.tool_use_id}`,
            });
            continue;
          }
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
        completed.set(prior.id, {
          id: prior.id,
          sequence: prior.sequence,
          timestamp: prior.timestamp,
          toolName: prior.toolName,
          inputGroupId: prior.inputGroupId,
          status,
          statusReason,
          source: prior.source,
          resultSource: { file: filePath, line: lineNo },
        });
      }
    }
  }

  for (const prior of pending.values()) {
    completed.set(prior.id, {
      id: prior.id,
      sequence: prior.sequence,
      timestamp: prior.timestamp,
      toolName: prior.toolName,
      inputGroupId: prior.inputGroupId,
      status: "unknown",
      statusReason: "no matching tool_result found before EOF",
      source: prior.source,
    });
  }

  const events = [...completed.values()].sort((a, b) => a.sequence - b.sequence);

  return {
    events,
    warnings,
    stats: {
      linesTotal,
      linesParsed,
      linesSkipped,
      toolUses,
      toolResults,
      unmatchedResults,
      duplicateToolUseIds,
    },
  };
}
