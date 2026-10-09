import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeSession } from "../src/core/analyze.js";
import { projectReportDocument } from "../src/report/project.js";
import { renderFindingsJson } from "../src/report/json.js";
import { renderSummaryMarkdown } from "../src/report/markdown.js";
import { renderHtmlReport } from "../src/report/html.js";
import { writeReportFiles } from "../src/report/write-report.js";

const fixture = join(process.cwd(), "examples", "synthetic-session.jsonl");

describe("report engine", () => {
  it("projects privacy-safe document without group ids or secrets", async () => {
    const analysis = await analyzeSession(fixture, "./x");
    const doc = projectReportDocument(analysis, {
      demoNote: "Synthetic demonstration data. Not a real user session.",
      generatedAt: "2026-10-10T00:00:00.000Z",
    });
    expect(doc.schemaVersion).toBe("1.0");
    expect(doc.findings.length).toBeGreaterThanOrEqual(1);
    expect(doc.findings[0]?.id).toBe("RF-001");
    const json = renderFindingsJson(doc);
    const html = renderHtmlReport(doc);
    const md = renderSummaryMarkdown(doc);
    const blob = json + html + md;
    expect(blob).not.toContain("inputGroupId");
    expect(blob).not.toContain("SYNTHETIC_SECRET_TOKEN_DO_NOT_LEAK");
    expect(blob).not.toContain("super-secret-api-key");
    expect(md).toContain("## Potential Repeated Failures");
    expect(html).toContain("const DATA = ");
    expect(html).not.toContain("</script><script>");
  });

  it("keeps JSON/MD/HTML stats consistent and writes files", async () => {
    const analysis = await analyzeSession(fixture, "./x");
    const doc = projectReportDocument(analysis, {
      generatedAt: "2026-10-10T00:00:00.000Z",
    });
    const dir = mkdtempSync(join(tmpdir(), "retryscope-out-"));
    // unrelated file must survive
    const keep = join(dir, "unrelated.txt");
    writeFileSync(keep, "keep-me\n");
    const written = await writeReportFiles(dir, doc);
    expect(existsSync(written.files.html)).toBe(true);
    expect(existsSync(written.files.json)).toBe(true);
    expect(existsSync(written.files.markdown)).toBe(true);
    expect(readFileSync(keep, "utf8")).toContain("keep-me");

    const fromDisk = JSON.parse(readFileSync(written.files.json, "utf8"));
    expect(fromDisk.summary.findingsCount).toBe(doc.summary.findingsCount);
    expect(fromDisk.summary.confirmedFailures).toBe(doc.summary.confirmedFailures);
    const md = readFileSync(written.files.markdown, "utf8");
    expect(md).toContain(`Potential retry patterns: ${doc.summary.findingsCount}`);
    const html = readFileSync(written.files.html, "utf8");
    expect(html).toContain(`"findingsCount":${doc.summary.findingsCount}`);
  });

  it("escapes script-breaking payloads in HTML embed", async () => {
    const analysis = await analyzeSession(fixture, "./x");
    // inject hostile warning message through projection path by mutating warnings
    analysis.warnings.push({
      line: 1,
      code: "XSS_TEST",
      message: '</script><script>alert(1)</script>',
    });
    const doc = projectReportDocument(analysis);
    const html = renderHtmlReport(doc);
    expect(html).not.toContain("</script><script>alert");
    expect(html).toContain("\\u003c/script\\u003e");
  });

  it("renders empty findings honestly", async () => {
    const dir = mkdtempSync(join(tmpdir(), "retryscope-empty-"));
    const path = join(dir, "ok.jsonl");
    writeFileSync(
      path,
      `${JSON.stringify({
        type: "assistant",
        timestamp: "2026-10-09T14:00:00.000Z",
        message: {
          content: [
            { type: "tool_use", id: "t1", name: "Read", input: { file_path: "/a" } },
          ],
        },
      })}\n${JSON.stringify({
        type: "user",
        timestamp: "2026-10-09T14:00:01.000Z",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "t1", is_error: false, content: "ok" },
          ],
        },
      })}\n`,
    );
    const analysis = await analyzeSession(path, join(dir, "out"));
    const doc = projectReportDocument(analysis);
    expect(doc.findings).toHaveLength(0);
    const md = renderSummaryMarkdown(doc);
    expect(md).toContain(
      "No repeated-failure patterns detected under the current rule.",
    );
    expect(md).not.toContain("working perfectly");
  });
});
