import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.PDX_BASE_URL || "http://localhost:3000";
const output = new URL("../evidence/refresh/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const report = [];
try {
  for (const width of [1440, 390]) {
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const [name, route, selector] of [
        ["homepage", "/", ".directory-grid"],
        ["directory", "/directory", ".directory-grid"],
        ["shops", "/directory?kind=shops", ".directory-grid"],
        ["artist", "/directory/people/1/damn-zippy", ".directory-record__title"],
        ["community", "/latest", ".topic-list"],
      ]) {
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });
        assert.equal(response.status(), 200);
        if (route === "/") assert.equal(new URL(page.url()).pathname, "/");
        await page.locator(selector).first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: new URL(`${width}-${colorScheme}-${name}.png`, output).pathname, fullPage: true });
        const styles = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, background: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color }));
        assert.equal(styles.overflow, false, `${width} ${colorScheme} ${name} overflow`);
        report.push({ width, colorScheme, name, ...styles });
      }
      await page.goto(base + "/directory");
      await page.locator("#directory-search").fill("Dawn");
      await page.locator("#directory-search").press("Enter");
      await page.waitForURL(/q=Dawn/);
      assert.equal(await page.locator(".directory-card").count(), 1);
      assert.equal((await page.locator(".directory-card__title").innerText()).trim(), "Dawn Davis");
      await page.goto(base + "/directory?specialization=cartoon");
      assert.equal(await page.locator(".directory-card").count(), 2);
      await page.goto(base + "/directory?view=map");
      await page.locator(".leaflet-marker-icon").first().click();
      await page.locator(".leaflet-popup").getByText("Heart Eyes Tattoo", { exact: true }).waitFor();
      assert.deepEqual(errors, [], "Browser errors");
      console.log(`${width} ${colorScheme}: pages, search, filters, map passed`);
      await context.close();
    }
  }
  for (const width of [1440, 390]) {
    const light = report.find(r => r.width === width && r.colorScheme === "light");
    const dark = report.find(r => r.width === width && r.colorScheme === "dark");
    assert.notEqual(light.background, dark.background, "Dark mode must change page background");
  }
} finally {
  await fs.writeFile(new URL("checks.json", output), JSON.stringify(report, null, 2));
  await browser.close();
}
