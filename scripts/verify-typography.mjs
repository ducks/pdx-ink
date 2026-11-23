import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const output = new URL("../evidence/typography/", import.meta.url);
await fs.mkdir(output, { recursive: true });
const report = [];
try {
  for (const width of [1440, 390]) {
    for (const colorScheme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme });
      for (const route of ["/directory", "/latest"]) {
        await page.goto((process.env.PDX_BASE_URL || "http://localhost:3000") + route, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.locator(route === "/directory" ? ".directory-card" : ".pdx-wordmark").first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (route === "/directory") {
          assert.equal(await page.locator(".directory-hero__eyebrow").count(), 0);
          assert.equal(await page.locator(".directory-hero h1:visible").count(), 1);
        }
        const fonts = await page.evaluate(() => {
          const selectors = [".pdx-utility", ".pdx-footer strong", ".pdx-footer p", ".pdx-footer nav", ".directory-hero__title", ".directory-card__title", ".directory-filters button", ".pdx-wordmark__city", ".pdx-editorial h1"];
          const values = selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(el => ({ selector, family: getComputedStyle(el).fontFamily })));
          const logo = document.querySelector(".no-ember .d-header .title a");
          if (logo) values.push({ selector: "header wordmark", family: getComputedStyle(logo, "::before").fontFamily });
          return { values, loaded: document.fonts.check("600 16px Barlow"), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert.ok(fonts.loaded);
        assert.equal(fonts.overflow, false);
        for (const font of fonts.values) assert.match(font.family, /^Barlow(?:,|$)/, font.selector);
        report.push({ width, colorScheme, route, ...fonts });
        await page.screenshot({ path: new URL(`${width}-${colorScheme}-${route.slice(1)}.png`, output).pathname });
      }
      await page.close();
    }
  }
  console.log("Typography and overflow checks passed on directory/community, desktop/mobile, light/dark.");
} finally {
  await fs.writeFile(new URL("checks.json", output), JSON.stringify(report, null, 2));
  await browser.close();
}
