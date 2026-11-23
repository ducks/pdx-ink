import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.addInitScript(() => localStorage.setItem("discourse__dev_tools", "false"));
const { token } = JSON.parse(await fs.readFile("tmp/pdx-ink/demo/session.json"));
await context.addCookies([{ name: "_t", value: token, url: "http://localhost:4300", httpOnly: true }]);
const page = await context.newPage();
for (const route of ["/t/5", "/latest", "/u/system/summary"]) {
 await page.goto("http://localhost:4300" + route, { waitUntil: "domcontentloaded" });
 await page.locator("#current-user").waitFor();
 await page.waitForTimeout(500);
 console.log(route, await page.locator("button,a").evaluateAll(elements => elements.filter(e => e.getBoundingClientRect().width && !e.textContent.trim() && !e.getAttribute("aria-label") && !e.getAttribute("title")).map(e => e.outerHTML.slice(0,1200))));
}
await browser.close();
