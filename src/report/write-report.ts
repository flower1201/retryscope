import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { ReportDocument } from "./types.js";
import { renderFindingsJson } from "./json.js";
import { renderSummaryMarkdown } from "./markdown.js";
import { renderHtmlReport } from "./html.js";

export interface WriteReportResult {
  outDir: string;
  files: {
    html: string;
    json: string;
    markdown: string;
  };
}

export async function writeReportFiles(
  outDir: string,
  doc: ReportDocument,
): Promise<WriteReportResult> {
  await mkdir(outDir, { recursive: true });

  // Ensure directory is writable without deleting unrelated files
  const probe = join(outDir, ".retryscope-write-probe");
  try {
    await writeFile(probe, "ok\n", "utf8");
    await access(outDir, constants.W_OK);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot write report to ${outDir}: ${message}`);
  } finally {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(probe);
    } catch {
      // ignore
    }
  }

  const htmlPath = join(outDir, "index.html");
  const jsonPath = join(outDir, "findings.json");
  const mdPath = join(outDir, "summary.md");

  await writeFile(htmlPath, renderHtmlReport(doc), "utf8");
  await writeFile(jsonPath, renderFindingsJson(doc), "utf8");
  await writeFile(mdPath, renderSummaryMarkdown(doc), "utf8");

  return {
    outDir,
    files: { html: htmlPath, json: jsonPath, markdown: mdPath },
  };
}
