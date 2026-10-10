import { Command } from "commander";
import { analyzeSession } from "../core/analyze.js";
import { projectReportDocument } from "../report/project.js";
import { writeReportFiles } from "../report/write-report.js";
import { ENGINE_VERSION } from "../version.js";

const program = new Command();

program
  .name("retryscope")
  .description(
    "Find out where your AI coding agent got stuck. Local offline analysis of session logs.",
  )
  .version(ENGINE_VERSION);

program
  .command("analyze")
  .description("Analyze a Claude Code session JSONL and write an offline report")
  .argument("<session>", "Path to session .jsonl (explicit path only; no auto-scan)")
  .option("--out <dir>", "Output directory", "./retryscope-report")
  .action(async (session: string, opts: { out: string }) => {
    try {
      const analysis = await analyzeSession(session, opts.out);
      const isDemo = /synthetic-session\.jsonl$/i.test(session);
      const doc = projectReportDocument(analysis, {
        demoNote: isDemo
          ? "Synthetic demonstration data. Not a real user session."
          : undefined,
      });
      const written = await writeReportFiles(opts.out, doc);

      const stdoutSummary = {
        engineVersion: ENGINE_VERSION,
        session,
        out: written.outDir,
        files: written.files,
        usable: analysis.usable,
        summary: doc.summary,
        findingsCount: doc.summary.findingsCount,
        findingIds: doc.findings.map((f) => f.id),
        warningsCount: doc.summary.warningsCount,
        warningCodes: doc.warnings.map((w) => w.code),
      };
      process.stdout.write(`${JSON.stringify(stdoutSummary, null, 2)}\n`);

      if (!analysis.usable) {
        process.stderr.write(
          "retryscope: no usable tool events parsed; report is incomplete\n",
        );
        process.exitCode = 2;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Never echo raw log body; keep short operational errors only
      const safe =
        message.length > 300 ? `${message.slice(0, 300)}…` : message;
      process.stderr.write(`retryscope: ${safe}\n`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`retryscope: ${message}\n`);
  process.exitCode = 1;
});
