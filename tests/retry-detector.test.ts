import { describe, expect, it } from "vitest";
import { detectRepeatedFailures } from "../src/core/retry-detector.js";
import { analyzeSession } from "../src/core/analyze.js";
import type { ToolEvent } from "../src/core/types.js";
import { join } from "node:path";

function ev(
  partial: Partial<ToolEvent> & Pick<ToolEvent, "id" | "sequence" | "toolName" | "status">,
): ToolEvent {
  return {
    statusReason: "test",
    source: { file: "t.jsonl", line: partial.sequence },
    inputGroupId: "samegroup",
    ...partial,
  };
}

describe("detectRepeatedFailures", () => {
  it("3 calls with 2 failures → finding", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:01:00.000Z",
      }),
      ev({
        id: "3",
        sequence: 3,
        toolName: "Bash",
        status: "success",
        timestamp: "2026-10-09T14:02:00.000Z",
      }),
    ];
    const findings = detectRepeatedFailures(events);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.confirmedFailures).toBe(2);
    expect(findings[0]?.successCount).toBe(1);
    expect(findings[0]?.ruleId).toBe("REPEATED_FAILED_TOOL_CALL");
  });

  it("2 failures but only 2 calls → no finding", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:01:00.000Z",
      }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });

  it("3 calls with only 1 failure → no finding", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "success",
        timestamp: "2026-10-09T14:01:00.000Z",
      }),
      ev({
        id: "3",
        sequence: 3,
        toolName: "Bash",
        status: "success",
        timestamp: "2026-10-09T14:02:00.000Z",
      }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });

  it("does not merge different input groups or tool names", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
        inputGroupId: "a",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:01:00.000Z",
        inputGroupId: "b",
      }),
      ev({
        id: "3",
        sequence: 3,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:02:00.000Z",
        inputGroupId: "a",
      }),
      ev({
        id: "4",
        sequence: 4,
        toolName: "Read",
        status: "failure",
        timestamp: "2026-10-09T14:03:00.000Z",
        inputGroupId: "a",
      }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });

  it("does not merge across >15 minute window", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:01:00.000Z",
      }),
      ev({
        id: "3",
        sequence: 3,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:20:00.000Z",
      }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });

  it("excludes events without timestamps (no invented window)", () => {
    const events = [
      ev({ id: "1", sequence: 1, toolName: "Bash", status: "failure" }),
      ev({ id: "2", sequence: 2, toolName: "Bash", status: "failure" }),
      ev({ id: "3", sequence: 3, toolName: "Bash", status: "failure" }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });

  it("does not count unknown as confirmedFailures", () => {
    const events = [
      ev({
        id: "1",
        sequence: 1,
        toolName: "Bash",
        status: "failure",
        timestamp: "2026-10-09T14:00:00.000Z",
      }),
      ev({
        id: "2",
        sequence: 2,
        toolName: "Bash",
        status: "unknown",
        timestamp: "2026-10-09T14:01:00.000Z",
      }),
      ev({
        id: "3",
        sequence: 3,
        toolName: "Bash",
        status: "unknown",
        timestamp: "2026-10-09T14:02:00.000Z",
      }),
    ];
    expect(detectRepeatedFailures(events)).toHaveLength(0);
  });
});

describe("analyzeSession privacy + demo", () => {
  it("detects finding on synthetic fixture without leaking secret token string", async () => {
    const fixture = join(process.cwd(), "examples", "synthetic-session.jsonl");
    const summary = await analyzeSession(fixture, "./retryscope-report");
    expect(summary.findingsCount).toBeGreaterThanOrEqual(1);
    const blob = JSON.stringify(summary);
    expect(blob).not.toContain("SYNTHETIC_SECRET_TOKEN_DO_NOT_LEAK");
    expect(blob).not.toContain("super-secret-api-key");
  });
});
