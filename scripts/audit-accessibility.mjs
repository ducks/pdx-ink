import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phase = process.env.PDX_PHASE || "after";
const base = process.env.PDX_BASE_URL || "http://localhost:4300";
const { token } = JSON.parse(await fs.readFile(path.join(root, "demo/session.json")));
const source = await fs.readFile(process.env.AXE_PATH || "/tmp/pdx-test-tools/node_modules/axe-core/axe.min.js", "utf8");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const report = [];
try {
  for (const device of ["desktop", "mobile"]) for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: device === "desktop" ? 1440 : 390, height: device === "desktop" ? 1100 : 844 }, isMobile: device === "mobile", hasTouch: device === "mobile", colorScheme, reducedMotion: "reduce" });
    await context.addCookies([{ name: "_t", value: token, url: base, httpOnly: true }, { name: "__profilin", value: "p%3Df", url: base }]);
    await context.addInitScript(() => localStorage.setItem("discourse__dev_tools", "false"));
    const page = await context.newPage();
    for (const [name, route, selector] of [["homepage", "/directory", ".directory-grid"], ["topic", "/t/5", ".topic-body .cooked"], ["community", "/latest", ".topic-list"], ["search", "/search?q=welcome", ".fps-result"], ["profile", "/u/system/summary", ".user-main"]]) {
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.locator(selector).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(source);
      const result = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
        return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })), incomplete: r.incomplete.map(v => v.id), palette: { foreground: getComputedStyle(document.body).color, background: getComputedStyle(document.body).backgroundColor } };
      });
      report.push({ device, colorScheme, name, ...result });
      console.log(device, colorScheme, name, result.violations.map(v => v.id).join(",") || "PASS");
    }
    await context.close();
  }
} finally {
  await browser.close();
  await fs.mkdir(path.join(root, "evidence", phase), { recursive: true });
  await fs.writeFile(path.join(root, "evidence", phase, "accessibility.json"), JSON.stringify(report, null, 2));
}
