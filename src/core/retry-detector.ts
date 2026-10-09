import { createHash } from "node:crypto";
import type {
  RetryDetectorOptions,
  RetryFinding,
  ToolEvent,
} from "./types.js";

export const DEFAULT_RETRY_OPTIONS: RetryDetectorOptions = {
  windowMs: 15 * 60 * 1000,
  minCalls: 3,
  minFailures: 2,
};

function parseTs(ts?: string): number | undefined {
  if (!ts) return undefined;
  const n = Date.parse(ts);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Detect potential repeated-failure patterns.
 * Events without parseable timestamps are excluded (no invented time window).
 */
export function detectRepeatedFailures(
  events: ToolEvent[],
  options: RetryDetectorOptions = DEFAULT_RETRY_OPTIONS,
): RetryFinding[] {
  const { windowMs, minCalls, minFailures } = options;

  type Timed = ToolEvent & { t: number };
  const timed: Timed[] = [];
  for (const e of events) {
    const t = parseTs(e.timestamp);
    if (t === undefined) continue;
    if (!e.inputGroupId) continue;
    timed.push({ ...e, t });
  }
  timed.sort((a, b) => a.t - b.t || a.sequence - b.sequence);

  const groups = new Map<string, Timed[]>();
  for (const e of timed) {
    const key = `${e.toolName}\0${e.inputGroupId}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const findings: RetryFinding[] = [];
  const covered = new Set<string>(); // event ids already in a finding

  for (const [, group] of groups) {
    let i = 0;
    while (i < group.length) {
      let end = i;
      for (let k = i; k < group.length; k++) {
        if (group[k]!.t - group[i]!.t <= windowMs) end = k;
        else break;
      }
      const windowEvents = group.slice(i, end + 1);
      const callCount = windowEvents.length;
      const confirmedFailures = windowEvents.filter(
        (e) => e.status === "failure",
      ).length;

      if (callCount >= minCalls && confirmedFailures >= minFailures) {
        // Skip if this window is mostly already covered (overlap control)
        const uncovered = windowEvents.filter((e) => !covered.has(e.id));
        if (uncovered.length < minCalls) {
          i += 1;
          continue;
        }

        const successCount = windowEvents.filter(
          (e) => e.status === "success",
        ).length;
        const unknownCount = windowEvents.filter(
          (e) => e.status === "unknown",
        ).length;
        const first = windowEvents[0]!;
        const last = windowEvents[windowEvents.length - 1]!;
        const evidenceIds = windowEvents.map((e) => e.id).join(",");
        const findingId = createHash("sha256")
          .update(`${first.toolName}|${first.inputGroupId}|${evidenceIds}`)
          .digest("hex")
          .slice(0, 12);

        findings.push({
          id: `finding_${findingId}`,
          ruleId: "REPEATED_FAILED_TOOL_CALL",
          toolName: first.toolName,
          inputGroupId: first.inputGroupId!,
          callCount,
          confirmedFailures,
          successCount,
          unknownCount,
          firstTimestamp: first.timestamp,
          lastTimestamp: last.timestamp,
          evidence: windowEvents.map((e) => ({
            eventId: e.id,
            sourceLine: e.source.line,
            status: e.status,
            timestamp: e.timestamp,
          })),
          explanation:
            "Potential repeated-failure pattern detected: same tool and equivalent input were invoked multiple times with confirmed tool_result failures inside the configured time window. This does not prove the agent was stuck or wasted tokens.",
          limitations: [
            "success means the tool reported no error, not that the user task was solved",
            "unknown results are not counted as confirmedFailures",
            "code edits between attempts are not modeled in P0",
            "requires parseable timestamps; events without timestamps are excluded",
          ],
        });

        for (const e of windowEvents) covered.add(e.id);
        i = end + 1;
        continue;
      }

      i += 1;
    }
  }

  findings.sort((a, b) => {
    const ae = a.evidence[0]?.sourceLine ?? 0;
    const be = b.evidence[0]?.sourceLine ?? 0;
    return ae - be;
  });

  return findings;
}
