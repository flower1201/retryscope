import type { ReportDocument } from "./types.js";

export interface InvariantViolation {
  code: string;
  message: string;
}

/** Validate ReportDocument count / id contracts (D-014). */
export function checkReportInvariants(doc: ReportDocument): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const { summary, findings, warnings } = doc;

  if (summary.findingsCount !== findings.length) {
    violations.push({
      code: "FINDINGS_COUNT_MISMATCH",
      message: `summary.findingsCount=${summary.findingsCount} !== findings.length=${findings.length}`,
    });
  }
  if (summary.warningsCount !== warnings.length) {
    violations.push({
      code: "WARNINGS_COUNT_MISMATCH",
      message: `summary.warningsCount=${summary.warningsCount} !== warnings.length=${warnings.length}`,
    });
  }

  const statusSum =
    summary.successCount + summary.confirmedFailures + summary.unknownCount;
  if (statusSum !== summary.totalToolCalls) {
    violations.push({
      code: "STATUS_SUM_MISMATCH",
      message: `success+failure+unknown=${statusSum} !== totalToolCalls=${summary.totalToolCalls}`,
    });
  }

  const ids = new Set<string>();
  for (const f of findings) {
    if (ids.has(f.id)) {
      violations.push({
        code: "DUPLICATE_FINDING_ID",
        message: `Duplicate finding id ${f.id}`,
      });
    }
    ids.add(f.id);

    const callSum = f.successCount + f.confirmedFailures + f.unknownCount;
    if (callSum !== f.callCount) {
      violations.push({
        code: "FINDING_STATUS_SUM",
        message: `${f.id}: status sum ${callSum} !== callCount ${f.callCount}`,
      });
    }

    if (f.evidence.length !== f.callCount) {
      violations.push({
        code: "EVIDENCE_LEN",
        message: `${f.id}: evidence.length ${f.evidence.length} !== callCount ${f.callCount}`,
      });
    }

    for (let i = 1; i < f.evidence.length; i += 1) {
      const prev = f.evidence[i - 1]?.timestamp;
      const cur = f.evidence[i]?.timestamp;
      if (prev && cur && Date.parse(prev) > Date.parse(cur)) {
        violations.push({
          code: "EVIDENCE_ORDER",
          message: `${f.id}: evidence timestamps not non-decreasing`,
        });
        break;
      }
    }
  }

  return violations;
}
