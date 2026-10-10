import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { parseClaudeJsonlFile } from "../parser/claude-jsonl.js";
import { ENGINE_VERSION } from "../version.js";
import {
  DEFAULT_RETRY_OPTIONS,
  detectRepeatedFailures,
} from "./retry-detector.js";
import type { ParseResult, RetryFinding, RetryDetectorOptions } from "./types.js";

export interface AnalyzeSummary {
  engineVersion: string;
  session: string;
  out: string;
  usable: boolean;
  stats: ParseResult["stats"] & {
    confirmedFailures: number;
    unknownResults: number;
    successResults: number;
  };
  findingsCount: number;
  findings: Array<{
    id: string;
    ruleId: RetryFinding["ruleId"];
    toolName: string;
    callCount: number;
    confirmedFailures: number;
    successCount: number;
    unknownCount: number;
    firstTimestamp?: string;
    lastTimestamp?: string;
    evidence: RetryFinding["evidence"];
    explanation: string;
    limitations: string[];
    inputGroupId: string;
  }>;
  warnings: ParseResult["warnings"];
}

export async function analyzeSession(
  sessionPath: string,
  outDir: string,
  options: RetryDetectorOptions = DEFAULT_RETRY_OPTIONS,
): Promise<AnalyzeSummary> {
  try {
    await access(sessionPath, constants.R_OK);
  } catch {
    throw new Error(`Session file not readable: ${sessionPath}`);
  }

  const parsed = await parseClaudeJsonlFile(sessionPath);
  const findings = detectRepeatedFailures(parsed.events, options);
  const usable = parsed.events.length > 0;

  return {
    engineVersion: ENGINE_VERSION,
    session: sessionPath,
    out: outDir,
    usable,
    stats: {
      ...parsed.stats,
      confirmedFailures: parsed.events.filter((e) => e.status === "failure")
        .length,
      unknownResults: parsed.events.filter((e) => e.status === "unknown").length,
      successResults: parsed.events.filter((e) => e.status === "success").length,
    },
    findingsCount: findings.length,
    findings: findings.map((f) => ({
      id: f.id,
      ruleId: f.ruleId,
      toolName: f.toolName,
      inputGroupId: f.inputGroupId,
      callCount: f.callCount,
      confirmedFailures: f.confirmedFailures,
      successCount: f.successCount,
      unknownCount: f.unknownCount,
      firstTimestamp: f.firstTimestamp,
      lastTimestamp: f.lastTimestamp,
      evidence: f.evidence,
      explanation: f.explanation,
      limitations: f.limitations,
    })),
    warnings: parsed.warnings.slice(0, 50),
  };
}
