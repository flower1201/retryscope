import type { ReportDocument } from "./types.js";

export function renderFindingsJson(doc: ReportDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
