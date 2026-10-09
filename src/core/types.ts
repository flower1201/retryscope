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
  /** Stable hash of toolName + redacted input shape; never raw secrets. */
  inputFingerprint?: string;
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
  };
}
