import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeSession } from "../src/core/analyze.js";
import { projectReportDocument } from "../src/report/project.js";
import { checkReportInvariants } from "../src/report/invariants.js";
import { renderFindingsJson } from "../src/report/json.js";
import { renderSummaryMarkdown } from "../src/report/markdown.js";
import { renderHtmlReport } from "../src/report/html.js";

const fixture = join(process.cwd(), "examples", "synthetic-session.jsonl");

describe("ReportDocument invariants", () => {
  it("satisfies count contracts on synthetic session", async () => {
    const analysis = await analyzeSession(fixture, "./x");
    const doc = projectReportDocument(analysis, {
      generatedAt: "2026-10-10T00:00:00.000Z",
    });
    expect(checkReportInvariants(doc)).toEqual([]);
    expect(doc.findings.map((f) => f.id)).toEqual(["RF-001"]);
  });

  it("keeps JSON / MD / HTML on the same document", async () => {
    const analysis = await analyzeSession(fixture, "./x");
    const doc = projectReportDocument(analysis, {
      generatedAt: "2026-10-10T00:00:00.000Z",
    });
    const json = renderFindingsJson(doc);
    const md = renderSummaryMarkdown(doc);
    const html = renderHtmlReport(doc);
    expect(JSON.parse(json).summary).toEqual(doc.summary);
    expect(md).toContain(`Potential retry patterns: ${doc.summary.findingsCount}`);
    expect(html).toContain(`"findingsCount":${doc.summary.findingsCount}`);
    expect(html).toContain(`"confirmedFailures":${doc.summary.confirmedFailures}`);
  });
});
