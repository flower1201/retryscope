import { mkdtempSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const cli = join(process.cwd(), "dist", "cli", "index.js");

function run(args: string[], cwd?: string) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    cwd,
    env: { ...process.env, NO_COLOR: "1" },
  });
}

describe("CLI edge cases", () => {
  it("fails clearly when session file is missing", () => {
    const r = run(["analyze", join(tmpdir(), "no-such-retryscope.jsonl")]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/not readable|ENOENT|Session file/i);
    expect(r.stderr).not.toContain("SYNTHETIC_SECRET");
  });

  it("exit 2 when input is all corrupt (not silent zero-findings success)", () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-bad-"));
    const path = join(dir, "bad.jsonl");
    writeFileSync(path, "not json\nalso bad\n");
    const out = join(dir, "out with spaces");
    const r = run(["analyze", path, "--out", out]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/no usable tool events/i);
    expect(existsSync(join(out, "index.html"))).toBe(true);
    expect(r.stdout).toContain("NO_USABLE_EVENTS");
    expect(r.stdout).not.toContain("working perfectly");
  });

  it("preserves unrelated files in --out and supports unicode path", () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-uni-测试-"));
    const keep = join(dir, "keep-me.txt");
    writeFileSync(keep, "stay\n");
    const session = join(process.cwd(), "examples", "synthetic-session.jsonl");
    const r = run(["analyze", session, "--out", dir]);
    expect(r.status).toBe(0);
    expect(existsSync(join(dir, "index.html"))).toBe(true);
    expect(existsSync(keep)).toBe(true);
  });

  it("skips oversized lines without crashing", () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-big-"));
    const path = join(dir, "big.jsonl");
    const huge = "x".repeat(300 * 1024);
    writeFileSync(
      path,
      `${JSON.stringify({
        type: "assistant",
        timestamp: "2026-10-09T14:00:00.000Z",
        message: {
          content: [
            { type: "tool_use", id: "ok1", name: "Read", input: { file_path: "/a" } },
          ],
        },
      })}\n${huge}\n${JSON.stringify({
        type: "user",
        timestamp: "2026-10-09T14:00:01.000Z",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "ok1", is_error: false, content: "ok" },
          ],
        },
      })}\n`,
    );
    const r = run(["analyze", path, "--out", join(dir, "out")]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("LINE_TOO_LONG");
  });
});

// chmod probe only on posix
describe.runIf(process.platform !== "win32")("CLI permissions", () => {
  it("reports unreadable session", () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-perm-"));
    const path = join(dir, "locked.jsonl");
    writeFileSync(path, "{}\n");
    chmodSync(path, 0);
    const r = run(["analyze", path, "--out", join(dir, "out")]);
    chmodSync(path, 0o644);
    expect(r.status).toBe(1);
  });
});
