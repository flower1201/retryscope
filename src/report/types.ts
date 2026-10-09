export type ReportStatus = "success" | "failure" | "unknown";

export interface ReportDocument {
  schemaVersion: "1.0";
  engineVersion: string;
  generatedAt: string;
  demoNote?: string;
  summary: {
    totalToolCalls: number;
    confirmedFailures: number;
    successCount: number;
    unknownCount: number;
    findingsCount: number;
    warningsCount: number;
  };
  findings: Array<{
    id: string;
    ruleId: "REPEATED_FAILED_TOOL_CALL";
    toolName: string;
    callCount: number;
    confirmedFailures: number;
    successCount: number;
    unknownCount: number;
    firstTimestamp?: string;
    lastTimestamp?: string;
    evidence: Array<{
      eventId: string;
      sourceLine: number;
      timestamp?: string;
      status: ReportStatus;
    }>;
    explanation: string;
    limitations: string[];
  }>;
  warnings: Array<{
    code: string;
    line?: number;
    message: string;
  }>;
  limitations: string[];
}
