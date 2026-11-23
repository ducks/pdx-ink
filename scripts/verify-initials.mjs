import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const expected = { "Damn Zippy": "DZ", "Dawn Davis": "DD", "Shannon Margo": "SM", "Fox Parade": "FP", "Kale": "K" };
const report = [];
try {
  const page = await browser.newPage();
  for (const width of [1440, 1024, 768, 767, 430, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    const response = await page.goto("http://localhost:4300/directory");
    assert.equal(response.status(), 200);
    await page.locator(".directory-card").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const cards = await page.locator(".directory-card").evaluateAll(elements => elements.map(card => {
      const placeholder = card.querySelector(".directory-card__placeholder");
      const range = document.createRange();
      range.selectNodeContents(placeholder);
      const text = range.getBoundingClientRect();
      const box = placeholder.getBoundingClientRect();
      return {
        name: card.querySelector(".directory-card__title").textContent.trim(),
        initials: placeholder.textContent.trim(),
        fits: text.left >= box.left && text.right <= box.right && text.bottom <= box.bottom,
        textBox: text.toJSON(),
        box: box.toJSON(),
      };
    }));
    if (width === 1440 || width === 430) {
      await page.screenshot({ path: path.join(root, "evidence/tests", `initials-${width}.png`), fullPage: true });
    }
    assert.deepEqual(Object.fromEntries(cards.map(c => [c.name, c.initials])), expected);
    assert(cards.every(c => c.fits), `Clipped initials at ${width}px: ${JSON.stringify(cards)}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    report.push({ width, cards, overflow: false });
  }
  await fs.writeFile(path.join(root, "evidence/tests/initials.json"), JSON.stringify(report, null, 2));
  console.log("Correct initials and no clipping at all seven viewport widths (320px to 1440px).");
} finally {
  await browser.close();
}
