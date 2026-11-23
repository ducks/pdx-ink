import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PDX_BASE_URL || "http://localhost:4300";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const report = [];
try {
  for (const device of ["desktop", "mobile"]) {
    const context = await browser.newContext({ viewport: { width: device === "desktop" ? 1440 : 390, height: 900 }, isMobile: device === "mobile", colorScheme: "light" });
    const page = await context.newPage();
    for (const [mode, expected] of [["dark", "#151f1e"], ["light", "#f5f0e4"], ["auto", "#f5f0e4"]]) {
      await page.goto(base + "/latest");
      const selector = page.locator(".header-color-scheme-toggle button");
      await selector.focus();
      await page.keyboard.press("Enter");
      await page.locator(`.interface-color-selector__${mode}-option`).click();
      await page.waitForFunction(expected => getComputedStyle(document.documentElement).getPropertyValue("--secondary").trim().toLowerCase() === expected, expected);
      await page.goto(base + "/directory");
      await page.locator(".directory-grid").waitFor();
      const palette = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--secondary").trim().toLowerCase());
      assert.equal(palette, expected, `${device}: ${mode} persists to the server-rendered directory`);
      report.push({ device, mode, palette, persisted: true });
    }
    await context.close();
  }
  await fs.writeFile(path.join(root, "evidence/tests/color-modes.json"), JSON.stringify(report, null, 2));
  console.log("Native Light, Dark, and Auto selections persist to directory pages on desktop and mobile.");
} finally { await browser.close(); }
