import { Command } from "commander";
import { analyzeSession } from "../core/analyze.js";
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
  .description("Analyze a Claude Code session JSONL for repeated tool failures")
  .argument("<session>", "Path to session .jsonl (explicit path only; no auto-scan)")
  .option("--out <dir>", "Output directory for future reports", "./retryscope-report")
  .action(async (session: string, opts: { out: string }) => {
    const summary = await analyzeSession(session, opts.out);
    // Privacy: never dump raw prompts/commands; fixture secrets must not appear
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (summary.stats.linesParsed === 0 && summary.stats.linesTotal > 0) {
      process.exitCode = 2;
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`retryscope: ${message}\n`);
  process.exitCode = 1;
});
