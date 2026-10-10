import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeSession } from "../src/core/analyze.js";
import { projectReportDocument } from "../src/report/project.js";
import { renderFindingsJson } from "../src/report/json.js";
import { renderSummaryMarkdown } from "../src/report/markdown.js";
import { renderHtmlReport } from "../src/report/html.js";
import { displayToolName } from "../src/report/sanitize.js";

describe("privacy hardening", () => {
  it("maps unknown tool names to Custom tool", () => {
    expect(displayToolName("Bash")).toBe("Bash");
    expect(displayToolName("mcp__private_crm__lookup")).toBe("Custom tool");
  });

  it("does not leak secrets, paths, or payloads in any report surface", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-priv-"));
    const path = join(dir, "hostile.jsonl");
    const secret = "SYNTHETIC_SECRET_TOKEN_DO_NOT_LEAK";
    const winPath = "C:\\\\Users\\\\Private\\\\secret-project";
    const unixPath = "/home/private/.env";
    const xss = "</script><script>alert(1)</script>";
    const input = {
      cmd: `cat ${unixPath}`,
      token: secret,
      path: winPath,
      note: xss,
    };
    const lines: string[] = [];
    for (let i = 1; i <= 3; i += 1) {
      const id = `t${i}`;
      const ts = `2026-10-09T14:2${i}:05.000Z`;
      lines.push(
        JSON.stringify({
          type: "assistant",
          timestamp: ts,
          message: {
            content: [
              {
                type: "tool_use",
                id,
                name: "mcp__internal_billing__charge",
                input,
              },
            ],
          },
        }),
        JSON.stringify({
          type: "user",
          timestamp: ts,
          message: {
            content: [
              {
                type: "tool_result",
                tool_use_id: id,
                is_error: true,
                content: `failed ${secret} ${xss}`,
              },
            ],
          },
        }),
      );
    }
    lines.push("not-json {" + secret);
    lines.push(
      JSON.stringify({
        type: "assistant",
        timestamp: "not-a-date<" + xss,
        message: { content: [] },
      }),
    );
    writeFileSync(path, `${lines.join("\n")}\n`);

    const analysis = await analyzeSession(path, join(dir, "out"));
    const doc = projectReportDocument(analysis, {
      demoNote: `Synthetic only ${xss}`,
    });
    expect(doc.findings.length).toBeGreaterThanOrEqual(1);
    expect(doc.findings[0]?.toolName).toBe("Custom tool");
    expect(displayToolName("mcp__internal_billing__charge")).toBe("Custom tool");

    const html = renderHtmlReport(doc);
    const blob =
      renderFindingsJson(doc) +
      renderSummaryMarkdown(doc) +
      html +
      JSON.stringify(doc);
    expect(blob).not.toContain(secret);
    expect(blob).not.toContain("secret-project");
    expect(blob).not.toContain("/home/private");
    expect(blob).not.toContain("inputGroupId");
    expect(blob).not.toContain("mcp__internal_billing");
    expect(html).not.toContain("</script><script>alert");
    expect(html).toContain("\\u003c");

    for (const w of doc.warnings) {
      expect(w.message).not.toContain(secret);
      expect(w.message).not.toContain(xss);
      expect(w.message).not.toMatch(/[A-Za-z]:\\/);
      expect(w.message).not.toContain("/home/");
    }
  });
});
