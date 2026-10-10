/** Known Claude Code built-in tool names safe to display as-is. */
const STANDARD_TOOL_NAMES = new Set([
  "Agent",
  "AskUserQuestion",
  "Bash",
  "Edit",
  "ExitPlanMode",
  "Glob",
  "Grep",
  "LS",
  "MultiEdit",
  "NotebookEdit",
  "Read",
  "Task",
  "TodoWrite",
  "WebFetch",
  "WebSearch",
  "Write",
]);

/** Fixed public warning messages — never echo parser payloads / paths / raw lines. */
const PUBLIC_WARNING_MESSAGES: Record<string, string> = {
  INVALID_JSON: "Line is not valid JSON; skipped",
  UNKNOWN_SHAPE: "Line failed loose schema; skipped",
  TOOL_USE_RESULT_SHAPE: "toolUseResult has unexpected type; ignored for status",
  INVALID_TIMESTAMP: "Unparseable timestamp; timestamp ignored for this line",
  DUPLICATE_TOOL_USE_CONFLICT:
    "Duplicate tool_use id with conflicting input; keeping first",
  DUPLICATE_TOOL_USE: "Duplicate tool_use id; counted once",
  DUPLICATE_TOOL_RESULT: "Extra tool_result for an already-completed tool use",
  UNMATCHED_TOOL_RESULT: "tool_result referenced an unknown tool_use id",
  LINE_TOO_LONG: "Line exceeded size limit; skipped",
  MAX_LINES_REACHED: "Input exceeded line limit; remaining lines not read",
  MAX_EVENTS_REACHED: "Input exceeded event limit; remaining tool uses ignored",
  NO_USABLE_EVENTS:
    "No usable tool events were parsed; report is incomplete, not a clean session",
  EMPTY_INPUT: "Input file contained no non-empty lines",
};

export function displayToolName(toolName: string): string {
  if (STANDARD_TOOL_NAMES.has(toolName)) return toolName;
  return "Custom tool";
}

export function publicWarningMessage(code: string): string {
  return (
    PUBLIC_WARNING_MESSAGES[code] ??
    "Non-fatal parse warning; details omitted for privacy"
  );
}
