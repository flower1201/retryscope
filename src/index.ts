export { ENGINE_VERSION } from "./version.js";
export { parseClaudeJsonlFile } from "./parser/claude-jsonl.js";
export {
  canonicalize,
  groupIdForToolCall,
  fingerprintToolInput,
} from "./core/fingerprint.js";
export {
  detectRepeatedFailures,
  DEFAULT_RETRY_OPTIONS,
} from "./core/retry-detector.js";
export { analyzeSession } from "./core/analyze.js";
export type {
  ToolEvent,
  ToolStatus,
  ParseResult,
  ParseWarning,
  EventSource,
  RetryFinding,
  RetryDetectorOptions,
  FindingEvidence,
} from "./core/types.js";
export type { AnalyzeSummary } from "./core/analyze.js";
export { projectReportDocument } from "./report/project.js";
export { writeReportFiles } from "./report/write-report.js";
export { renderFindingsJson } from "./report/json.js";
export { renderSummaryMarkdown } from "./report/markdown.js";
export { renderHtmlReport } from "./report/html.js";
export type { ReportDocument } from "./report/types.js";
