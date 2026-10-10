import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { Buffer } from "node:buffer";
import { canonicalize, groupIdForToolCall } from "../core/fingerprint.js";
import type { ParseResult, ParseWarning, ToolEvent, ToolStatus } from "../core/types.js";
import {
  ToolResultBlockSchema,
  ToolUseBlockSchema,
  TranscriptLineSchema,
} from "./schemas.js";
import { PARSE_LIMITS } from "./limits.js";

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

function pushWarning(
  warnings: ParseWarning[],
  line: number,
  code: string,
  message: string,
): void {
  if (warnings.length >= 200) return;
  warnings.push({ line, code, message });
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
  let stoppedEarly = false;

  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const raw of rl) {
    linesTotal += 1;
    const lineNo = linesTotal;

    if (linesTotal > PARSE_LIMITS.maxLines) {
      pushWarning(
        warnings,
        lineNo,
        "MAX_LINES_REACHED",
        "Input exceeded line limit; remaining lines not read",
      );
      stoppedEarly = true;
      rl.close();
      stream.destroy();
      break;
    }

    if (Buffer.byteLength(raw, "utf8") > PARSE_LIMITS.maxLineBytes) {
      linesSkipped += 1;
      pushWarning(
        warnings,
        lineNo,
        "LINE_TOO_LONG",
        "Line exceeded size limit; skipped",
      );
      continue;
    }

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
      pushWarning(warnings, lineNo, "INVALID_JSON", "Line is not valid JSON; skipped");
      continue;
    }

    const parsed = TranscriptLineSchema.safeParse(json);
    if (!parsed.success) {
      linesSkipped += 1;
      pushWarning(
        warnings,
        lineNo,
        "UNKNOWN_SHAPE",
        "Line failed loose schema; skipped",
      );
      continue;
    }

    linesParsed += 1;
    const row = parsed.data;
    const blocks = contentBlocks(row.message?.content);

    if ("toolUseResult" in (json as object)) {
      const tur = (json as { toolUseResult?: unknown }).toolUseResult;
      if (
        tur !== undefined &&
        tur !== null &&
        typeof tur !== "object" &&
        typeof tur !== "string"
      ) {
        pushWarning(
          warnings,
          lineNo,
          "TOOL_USE_RESULT_SHAPE",
          "toolUseResult has unexpected primitive type; ignored for status",
        );
      }
    }

    if (row.timestamp !== undefined) {
      const t = Date.parse(row.timestamp);
      if (Number.isNaN(t)) {
        pushWarning(
          warnings,
          lineNo,
          "INVALID_TIMESTAMP",
          "Unparseable timestamp; timestamp ignored for this line",
        );
      }
    }

    for (const block of blocks) {
      const use = ToolUseBlockSchema.safeParse(block);
      if (use.success) {
        if (completed.size + pending.size >= PARSE_LIMITS.maxEvents) {
          pushWarning(
            warnings,
            lineNo,
            "MAX_EVENTS_REACHED",
            "Input exceeded event limit; remaining tool uses ignored",
          );
          stoppedEarly = true;
          rl.close();
          stream.destroy();
          break;
        }

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
            pushWarning(
              warnings,
              lineNo,
              "DUPLICATE_TOOL_USE_CONFLICT",
              "Duplicate tool_use id with conflicting input; keeping first",
            );
          } else {
            pushWarning(
              warnings,
              lineNo,
              "DUPLICATE_TOOL_USE",
              "Duplicate tool_use id; counted once",
            );
          }
          continue;
        }

        sequence += 1;
        pending.set(use.data.id, {
          id: use.data.id,
          toolName: use.data.name,
          inputGroupId,
          inputCanon,
          timestamp:
            row.timestamp && !Number.isNaN(Date.parse(row.timestamp))
              ? row.timestamp
              : undefined,
          // Store basename-only path marker internally; reports never emit file path
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
            pushWarning(
              warnings,
              lineNo,
              "DUPLICATE_TOOL_RESULT",
              "Extra tool_result for an already-completed tool use",
            );
            continue;
          }
          unmatchedResults += 1;
          pushWarning(
            warnings,
            lineNo,
            "UNMATCHED_TOOL_RESULT",
            "tool_result referenced an unknown tool_use id",
          );
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

    if (stoppedEarly) break;
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

  if (linesTotal === 0) {
    pushWarning(warnings, 0, "EMPTY_INPUT", "Input file contained no non-empty lines");
  } else if (events.length === 0) {
    pushWarning(
      warnings,
      0,
      "NO_USABLE_EVENTS",
      "No usable tool events were parsed; report is incomplete, not a clean session",
    );
  }

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
