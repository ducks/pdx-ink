import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
try {
  const response = await page.goto("http://localhost:4300/pdx-ink-review/evidence/index.html");
  assert.equal(response.status(), 200);
  for (const scheme of ["light", "dark"]) for (const device of ["desktop", "mobile"]) for (const surface of ["homepage", "topic", "community", "artist", "shop", "search", "categories"]) {
    await page.locator("#scheme").selectOption(scheme);
    await page.locator("#device").selectOption(device);
    await page.locator("#surface").selectOption(surface);
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  }
  await page.locator("#scheme").selectOption("light");
  await page.locator("#device").selectOption("desktop");
  await page.locator("#surface").selectOption("homepage");
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  await page.screenshot({ path: "tmp/pdx-ink/evidence/comparison-viewer.png", fullPage: true });
  console.log("Comparison viewer: all 28 light/dark paired viewport choices load correctly.");
} finally { await browser.close(); }
