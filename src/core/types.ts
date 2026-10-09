export type ToolStatus = "success" | "failure" | "unknown";

export interface EventSource {
  file: string;
  line: number;
}

/** Normalized tool invocation + optional result, linked by toolUseId. */
export interface ToolEvent {
  id: string;
  sequence: number;
  timestamp?: string;
  toolName: string;
  /**
   * Opaque equality group id (hash of toolName + canonical original input).
   * Raw input is never stored on the event.
   */
  inputGroupId?: string;
  status: ToolStatus;
  /** Why status was chosen (for findings / debugging). */
  statusReason: string;
  source: EventSource;
  resultSource?: EventSource;
}

export interface ParseWarning {
  line: number;
  code: string;
  message: string;
}

export interface ParseResult {
  events: ToolEvent[];
  warnings: ParseWarning[];
  stats: {
    linesTotal: number;
    linesParsed: number;
    linesSkipped: number;
    toolUses: number;
    toolResults: number;
    unmatchedResults: number;
    duplicateToolUseIds: number;
  };
}

export interface RetryDetectorOptions {
  windowMs: number;
  minCalls: number;
  minFailures: number;
}

export interface FindingEvidence {
  eventId: string;
  sourceLine: number;
  status: ToolStatus;
  timestamp?: string;
}

export interface RetryFinding {
  id: string;
  ruleId: "REPEATED_FAILED_TOOL_CALL";
  toolName: string;
  inputGroupId: string;
  callCount: number;
  confirmedFailures: number;
  successCount: number;
  unknownCount: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
  evidence: FindingEvidence[];
  explanation: string;
  limitations: string[];
}
