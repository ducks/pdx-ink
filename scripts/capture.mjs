import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = JSON.parse(await fs.readFile(path.join(root, "demo/state.json")));
const phase = process.env.PDX_PHASE || "before";
const colorScheme = process.env.PDX_COLOR_SCHEME || "light";
const directory = colorScheme === "dark" ? `${phase}-dark` : phase;
const base = process.env.PDX_BASE_URL || "http://localhost:4300";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const pages = [
  ["homepage", "/directory", ".directory-grid"],
  ["topic", `/t/${state.topics[0].id}`, ".topic-body .cooked"],
  ["community", "/latest", ".topic-list"],
  ["artist", "/directory/people/1/damn-zippy", ".directory-record__title"],
  ["shop", "/directory/shops/1/heart-eyes-tattoo", ".directory-record__title"],
  ["search", "/search?q=welcome", ".search-container"],
  ["categories", "/categories", ".category-list, .category-boxes"],
];
const report = [];
await fs.mkdir(path.join(root, "evidence", directory), { recursive: true });
try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 1100 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, isMobile: device === "mobile", hasTouch: device === "mobile", deviceScaleFactor: 1, colorScheme, reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("discourse__dev_tools", "false"));
    await context.addCookies([{ name: "__profilin", value: "p%3Df", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    for (const [name, route, selector] of pages) {
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on("pageerror", onError);
      const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.locator(selector).first().waitFor({ state: "visible" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(root, "evidence", directory, `${device}-${name}.png`), fullPage: true });
      await page.screenshot({ path: path.join(root, "evidence", directory, `${device}-${name}-viewport.png`), fullPage: false });
      const info = await page.evaluate(() => ({ title: document.title, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, theme: document.querySelector("html")?.dataset.themeId, brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src), text: document.body.innerText.slice(0, 160) }));
      report.push({ device, colorScheme, name, route, status: response.status(), ...info, errors });
      console.log(JSON.stringify(report.at(-1)));
      page.off("pageerror", onError);
    }
    await context.close();
  }
} finally {
  await fs.writeFile(path.join(root, "evidence", directory, "capture.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
