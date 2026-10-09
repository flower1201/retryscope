import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseClaudeJsonlFile } from "../src/parser/claude-jsonl.js";
import { fingerprintToolInput } from "../src/core/fingerprint.js";

const fixture = join(process.cwd(), "examples", "synthetic-session.jsonl");

describe("parseClaudeJsonlFile", () => {
  it("parses synthetic demo: failures, success, unknown, warnings", async () => {
    const result = await parseClaudeJsonlFile(fixture);

    expect(result.stats.toolUses).toBe(6);
    expect(result.stats.toolResults).toBe(5);
    expect(result.events).toHaveLength(6);

    const byId = Object.fromEntries(result.events.map((e) => [e.id, e]));
    expect(byId.toolu_synth_001.status).toBe("failure");
    expect(byId.toolu_synth_002.status).toBe("failure");
    expect(byId.toolu_synth_003.status).toBe("failure");
    expect(byId.toolu_synth_004.status).toBe("success");
    expect(byId.toolu_synth_005.status).toBe("success");
    expect(byId.toolu_synth_006.status).toBe("unknown");

    expect(result.warnings.some((w) => w.code === "INVALID_JSON")).toBe(true);
    // mystery line still parses as loose object but yields no tool blocks
    expect(result.stats.linesSkipped).toBeGreaterThanOrEqual(1);
  });

  it("does not invent failure when result is missing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "retryscope-"));
    const path = join(dir, "only-use.jsonl");
    writeFileSync(
      path,
      `${JSON.stringify({
        type: "assistant",
        message: {
          content: [
            { type: "tool_use", id: "toolu_x", name: "Bash", input: { command: "true" } },
          ],
        },
      })}\n`,
    );
    const result = await parseClaudeJsonlFile(path);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.status).toBe("unknown");
  });

  it("warns on unmatched tool_result", async () => {
    const dir = mkdtempSync(join(tmpdir(), "retryscope-"));
    const path = join(dir, "orphan-result.jsonl");
    writeFileSync(
      path,
      `${JSON.stringify({
        type: "user",
        message: {
          content: [
            {
              type: "tool_result",
              tool_use_id: "missing",
              content: "x",
              is_error: true,
            },
          ],
        },
      })}\n`,
    );
    const result = await parseClaudeJsonlFile(path);
    expect(result.events).toHaveLength(0);
    expect(result.stats.unmatchedResults).toBe(1);
  });
});

describe("fingerprintToolInput", () => {
  it("redacts secret-like keys and stays stable", () => {
    const a = fingerprintToolInput("Bash", {
      command: "echo hi",
      token: "super-secret",
    });
    const b = fingerprintToolInput("Bash", {
      command: "echo hi",
      token: "other-secret",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });
});
