import type { ReportDocument } from "./types.js";

export function renderSummaryMarkdown(doc: ReportDocument): string {
  const lines: string[] = [];
  lines.push("# RetryScope Analysis");
  lines.push("");
  if (doc.demoNote) {
    lines.push(`> ${doc.demoNote}`);
    lines.push("");
  }
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Engine: ${doc.engineVersion}`);
  lines.push(`- Schema: ${doc.schemaVersion}`);
  lines.push(`- Total tool calls: ${doc.summary.totalToolCalls}`);
  lines.push(`- Confirmed failures: ${doc.summary.confirmedFailures}`);
  lines.push(`- Successful tool results: ${doc.summary.successCount}`);
  lines.push(`- Unknown results: ${doc.summary.unknownCount}`);
  lines.push(`- Potential retry patterns: ${doc.summary.findingsCount}`);
  lines.push(`- Warnings: ${doc.summary.warningsCount}`);
  lines.push("");
  lines.push("## Potential Repeated Failures");
  lines.push("");
  if (doc.findings.length === 0) {
    const incomplete = doc.warnings.some(
      (w) => w.code === "NO_USABLE_EVENTS" || w.code === "EMPTY_INPUT",
    );
    lines.push(
      incomplete
        ? "Analysis incomplete: no usable tool events were parsed. This is not a clean session with zero retries."
        : "No repeated-failure patterns detected under the current rule.",
    );
    lines.push("");
  } else {
    for (const f of doc.findings) {
      lines.push(`### ${f.id} — ${f.toolName}`);
      lines.push("");
      lines.push(`- Rule: ${f.ruleId}`);
      lines.push(`- Calls: ${f.callCount}`);
      lines.push(`- Confirmed failures: ${f.confirmedFailures}`);
      lines.push(`- Successes in window: ${f.successCount}`);
      lines.push(`- Unknown in window: ${f.unknownCount}`);
      if (f.firstTimestamp || f.lastTimestamp) {
        lines.push(
          `- Window: ${f.firstTimestamp ?? "?"} → ${f.lastTimestamp ?? "?"}`,
        );
      }
      lines.push("");
    }
  }
  lines.push("## Evidence");
  lines.push("");
  if (doc.findings.length === 0) {
    lines.push("No evidence rows (no findings).");
    lines.push("");
  } else {
    for (const f of doc.findings) {
      lines.push(`### ${f.id}`);
      lines.push("");
      for (const e of f.evidence) {
        lines.push(
          `- ${e.timestamp ?? "no-ts"} | line ${e.sourceLine} | ${e.status} | ${e.eventId}`,
        );
      }
      lines.push("");
    }
  }
  lines.push("## Interpretation");
  lines.push("");
  if (doc.findings.length === 0) {
    lines.push(
      "No potential repeated-failure patterns were observed with the current detector settings.",
    );
  } else {
    for (const f of doc.findings) {
      lines.push(`- **${f.id}:** ${f.explanation}`);
    }
  }
  lines.push("");
  lines.push("## Limitations");
  lines.push("");
  for (const lim of doc.limitations) {
    lines.push(`- ${lim}`);
  }
  lines.push("");
  if (doc.warnings.length > 0) {
    lines.push("## Warnings");
    lines.push("");
    for (const w of doc.warnings) {
      lines.push(
        `- ${w.code}${w.line !== undefined ? ` (line ${w.line})` : ""}: ${w.message}`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}
