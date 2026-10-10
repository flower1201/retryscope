import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { chromium } from "playwright";

const cli = join(process.cwd(), "dist", "cli", "index.js");
const synthetic = resolve("examples/synthetic-session.jsonl");

describe("file:// report E2E", () => {
  it("loads synthetic report over file:// with timeline interaction and no network", async () => {
    const out = mkdtempSync(join(tmpdir(), "rs-file-demo-"));
    const packed = spawnSync(
      process.execPath,
      [cli, "analyze", synthetic, "--out", out],
      { encoding: "utf8" },
    );
    expect(packed.status).toBe(0);

    const reportUrl = pathToFileURL(resolve(out, "index.html")).href;
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(String(err)));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      const requests: string[] = [];
      page.on("request", (req) => {
        const u = req.url();
        if (u.startsWith("http://") || u.startsWith("https://")) requests.push(u);
      });

      await page.goto(reportUrl);
      expect(await page.locator("h1").textContent()).toBe("RETRYSCOPE");
      const cards = await page.locator(".card .n").allTextContents();
      expect(cards[0]).toBe("6");
      const heading = await page.locator(".finding h2").textContent();
      expect(heading).toContain("RF-001");
      expect(await page.locator(".ev").count()).toBe(4);

      const before = await page.locator(".detail.open").innerText();
      expect(before).toContain("toolu_synth_001");

      await page.locator(".ev").nth(3).click();
      const after = await page.locator(".detail.open").innerText();
      expect(after).toContain("toolu_synth_005");
      expect(after).toContain("success");
      expect(after).not.toBe(before);

      expect(errors).toEqual([]);
      expect(requests).toEqual([]);
    } finally {
      await browser.close();
    }
  });

  it("renders empty / incomplete states over file://", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rs-file-empty-"));
    mkdirSync(dir, { recursive: true });
    const okPath = join(dir, "ok.jsonl");
    writeFileSync(
      okPath,
      `${JSON.stringify({
        type: "assistant",
        timestamp: "2026-10-09T14:00:00.000Z",
        message: {
          content: [
            { type: "tool_use", id: "t1", name: "Read", input: { file_path: "/a" } },
          ],
        },
      })}\n${JSON.stringify({
        type: "user",
        timestamp: "2026-10-09T14:00:01.000Z",
        message: {
          content: [
            { type: "tool_result", tool_use_id: "t1", is_error: false, content: "ok" },
          ],
        },
      })}\n`,
    );
    const outOk = join(dir, "out-ok");
    expect(
      spawnSync(process.execPath, [cli, "analyze", okPath, "--out", outOk], {
        encoding: "utf8",
      }).status,
    ).toBe(0);

    const badPath = join(dir, "bad.jsonl");
    writeFileSync(badPath, "garbage\n");
    const outBad = join(dir, "out-bad");
    expect(
      spawnSync(process.execPath, [cli, "analyze", badPath, "--out", outBad], {
        encoding: "utf8",
      }).status,
    ).toBe(2);

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(resolve(outOk, "index.html")).href);
      const okText = await page.locator("main").innerText();
      expect(okText).toContain(
        "No repeated-failure patterns detected under the current rule.",
      );

      await page.goto(pathToFileURL(resolve(outBad, "index.html")).href);
      const badText = await page.locator("main").innerText();
      expect(badText).toContain("Analysis incomplete");
    } finally {
      await browser.close();
    }
  });
});
