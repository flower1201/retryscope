import type { AnalyzeSummary } from "../core/analyze.js";
import type { ReportDocument } from "./types.js";
import { displayToolName, publicWarningMessage } from "./sanitize.js";

const GLOBAL_LIMITATIONS = [
  "Detection identifies potential repeated-failure patterns, not confirmed wasted loops.",
  "Tool success means the tool reported no error, not that the user task was solved.",
  "Root causes are not inferred; review code changes between attempts manually.",
  "Incomplete logs may omit failures.",
  "Claude Code JSONL format may change across versions.",
  "Raw prompts, commands, tool inputs/outputs, tokens, and absolute paths are omitted by default.",
  "Custom / MCP tool names are shown as a generic label to avoid leaking private service identifiers.",
];

/** Project analyzer output into a privacy-safe report document (whitelist). */
export function projectReportDocument(
  analysis: AnalyzeSummary,
  options?: { demoNote?: string; generatedAt?: string },
): ReportDocument {
  const warnings = analysis.warnings.map((w) => ({
    code: w.code,
    line: w.line,
    message: publicWarningMessage(w.code),
  }));

  return {
    schemaVersion: "1.0",
    engineVersion: analysis.engineVersion,
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    demoNote: options?.demoNote,
    summary: {
      // Unique kept tool events (duplicates discarded), not raw tool_use sightings
      totalToolCalls:
        analysis.stats.successResults +
        analysis.stats.confirmedFailures +
        analysis.stats.unknownResults,
      confirmedFailures: analysis.stats.confirmedFailures,
      successCount: analysis.stats.successResults,
      unknownCount: analysis.stats.unknownResults,
      findingsCount: analysis.findings.length,
      warningsCount: warnings.length,
    },
    findings: analysis.findings.map((f, index) => ({
      id: `RF-${String(index + 1).padStart(3, "0")}`,
      ruleId: f.ruleId,
      toolName: displayToolName(f.toolName),
      callCount: f.callCount,
      confirmedFailures: f.confirmedFailures,
      successCount: f.successCount,
      unknownCount: f.unknownCount,
      firstTimestamp: f.firstTimestamp,
      lastTimestamp: f.lastTimestamp,
      evidence: f.evidence.map((e) => ({
        eventId: e.eventId,
        sourceLine: e.sourceLine,
        timestamp: e.timestamp,
        status: e.status,
      })),
      explanation: f.explanation,
      limitations: f.limitations,
    })),
    warnings,
    limitations: GLOBAL_LIMITATIONS,
  };
}
