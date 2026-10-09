import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseClaudeJsonlFile } from "../src/parser/claude-jsonl.js";
import { groupIdForToolCall } from "../src/core/fingerprint.js";

const fixture = join(process.cwd(), "examples", "synthetic-session.jsonl");

function writeJsonl(lines: unknown[]): string {
  const dir = mkdtempSync(join(tmpdir(), "retryscope-"));
  const path = join(dir, "session.jsonl");
  writeFileSync(path, `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`);
  return path;
}

describe("parseClaudeJsonlFile", () => {
  it("parses synthetic demo: failures, success, unknown, warnings", async () => {
    const result = await parseClaudeJsonlFile(fixture);
    expect(result.events).toHaveLength(6);
    const byId = Object.fromEntries(result.events.map((e) => [e.id, e]));
    expect(byId.toolu_synth_001.status).toBe("failure");
    expect(byId.toolu_synth_005.status).toBe("success");
    expect(byId.toolu_synth_006.status).toBe("unknown");
    expect(result.warnings.some((w) => w.code === "INVALID_JSON")).toBe(true);
  });

  it("dedupes duplicate tool_use.id", async () => {
    const path = writeJsonl([
      {
        type: "assistant",
        timestamp: "2026-10-09T14:00:00.000Z",
        message: {
          content: [
            { type: "tool_use", id: "toolu_dup", name: "Bash", input: { command: "a" } },
          ],
        },
      },
      {
        type: "assistant",
        timestamp: "2026-10-09T14:00:01.000Z",
        message: {
          content: [
            { type: "tool_use", id: "toolu_dup", name: "Bash", input: { command: "a" } },
          ],
        },
      },
      {
        type: "user",
        timestamp: "2026-10-09T14:00:02.000Z",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "toolu_dup", is_error: true, content: "x" },
          ],
        },
      },
    ]);
    const result = await parseClaudeJsonlFile(path);
    expect(result.events).toHaveLength(1);
    expect(result.stats.duplicateToolUseIds).toBe(1);
  });

  it("handles multiple tool_use and non-adjacent results", async () => {
    const path = writeJsonl([
      {
        type: "assistant",
        timestamp: "2026-10-09T14:00:00.000Z",
        message: {
          content: [
            { type: "tool_use", id: "t1", name: "Read", input: { file_path: "/a" } },
            { type: "tool_use", id: "t2", name: "Read", input: { file_path: "/b" } },
          ],
        },
      },
      {
        type: "user",
        timestamp: "2026-10-09T14:00:05.000Z",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "t2", is_error: false, content: "b" },
            { type: "tool_result", tool_use_id: "t1", is_error: true, content: "a" },
          ],
        },
      },
    ]);
    const result = await parseClaudeJsonlFile(path);
    expect(result.events).toHaveLength(2);
    const byId = Object.fromEntries(result.events.map((e) => [e.id, e]));
    expect(byId.t1.status).toBe("failure");
    expect(byId.t2.status).toBe("success");
  });

  it("does not invent failure when result is missing", async () => {
    const path = writeJsonl([
      {
        type: "assistant",
        message: {
          content: [
            { type: "tool_use", id: "toolu_x", name: "Bash", input: { command: "true" } },
          ],
        },
      },
    ]);
    const result = await parseClaudeJsonlFile(path);
    expect(result.events[0]?.status).toBe("unknown");
  });

  it("warns on unmatched tool_result", async () => {
    const path = writeJsonl([
      {
        type: "user",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "missing", content: "x", is_error: true },
          ],
        },
      },
    ]);
    const result = await parseClaudeJsonlFile(path);
    expect(result.stats.unmatchedResults).toBe(1);
  });

  it("warns on invalid timestamp but still parses tools", async () => {
    const path = writeJsonl([
      {
        type: "assistant",
        timestamp: "not-a-date",
        message: {
          content: [{ type: "tool_use", id: "t", name: "Bash", input: { command: "x" } }],
        },
      },
    ]);
    const result = await parseClaudeJsonlFile(path);
    expect(result.warnings.some((w) => w.code === "INVALID_TIMESTAMP")).toBe(true);
    expect(result.events[0]?.timestamp).toBeUndefined();
  });
});

describe("groupIdForToolCall", () => {
  it("gives different ids for different secrets (no redact-before-hash merge)", () => {
    const a = groupIdForToolCall("Bash", { command: "deploy", token: "abc" });
    const b = groupIdForToolCall("Bash", { command: "deploy", token: "xyz" });
    expect(a).not.toBe(b);
  });

  it("treats key-order differences as equal", () => {
    const a = groupIdForToolCall("Bash", { b: 1, a: 2 });
    const b = groupIdForToolCall("Bash", { a: 2, b: 1 });
    expect(a).toBe(b);
  });
});
