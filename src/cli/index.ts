import { Command } from "commander";
import { ENGINE_VERSION } from "../version.js";
import { parseClaudeJsonlFile } from "../parser/claude-jsonl.js";

const program = new Command();

program
  .name("retryscope")
  .description(
    "Find out where your AI coding agent got stuck. Local offline analysis of session logs.",
  )
  .version(ENGINE_VERSION);

program
  .command("analyze")
  .description("Analyze a Claude Code session JSONL file (parser stage)")
  .argument("<session>", "Path to session .jsonl (explicit path only; no auto-scan)")
  .option("--out <dir>", "Output directory for future reports", "./retryscope-report")
  .action(async (session: string, opts: { out: string }) => {
    const result = await parseClaudeJsonlFile(session);
    // Foundation stage: print parse summary only (no HTML yet)
    const summary = {
      engineVersion: ENGINE_VERSION,
      session,
      out: opts.out,
      stats: result.stats,
      eventCount: result.events.length,
      warnings: result.warnings.slice(0, 20),
      eventsPreview: result.events.slice(0, 10).map((e) => ({
        id: e.id,
        toolName: e.toolName,
        status: e.status,
        sequence: e.sequence,
        inputFingerprint: e.inputFingerprint,
        sourceLine: e.source.line,
      })),
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (result.stats.linesParsed === 0 && result.stats.linesTotal > 0) {
      process.exitCode = 2;
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`retryscope: ${message}\n`);
  process.exitCode = 1;
});
