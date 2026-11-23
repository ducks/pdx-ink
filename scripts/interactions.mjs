import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PDX_BASE_URL || "http://localhost:4300";
const session = JSON.parse(await fs.readFile(path.join(root, "demo/session.json")));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [];
try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 1100 }], ["mobile", { width: 390, height: 844 }]]) {
    execFileSync("bin/rails", ["runner", path.join(root, "demo/prepare-tests.rb")], { env: { ...process.env, PDX_DEMO: "1" }, stdio: "pipe" });
    const state = JSON.parse(await fs.readFile(path.join(root, "demo/state.json")));
    const context = await browser.newContext({ viewport, isMobile: device === "mobile", hasTouch: device === "mobile", colorScheme: "light", reducedMotion: "reduce" });
    await context.addCookies([{ name: "_t", value: session.token, url: base, httpOnly: true, sameSite: "Lax" }, { name: "__profilin", value: "p%3Df", url: base }]);
    await context.addInitScript(() => localStorage.setItem("discourse__dev_tools", "false"));
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(base + "/latest", { waitUntil: "domcontentloaded" });
    const row = page.locator(`[data-topic-id="${state.test_topic_id}"]`).first();
    await row.waitFor();
    const badge = row.locator(".badge-notification.unread-posts");
    await badge.waitFor({ state: "visible" });
    assert.ok(Number(await badge.innerText()) >= 1);
    const unread = await badge.evaluate(e => ({ label: e.getAttribute("aria-label") || e.title || e.innerText, color: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor }));
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(root, "evidence/tests", `${device}-unread.png`) });
    await page.goto(`${base}/t/${state.test_topic_id}`, { waitUntil: "domcontentloaded" });
    await page.locator(".topic-body .cooked").first().waitFor();
    const reply = page.locator(".topic-footer-main-buttons .create").first();
    if (!(await page.locator("#reply-control.open").isVisible())) await reply.click();
    await page.locator("#reply-control.open").waitFor();
    const content = `Staging ${device} browser verification: this reply confirms that the native composer saves a real post. The test topic is removed after verification.`;
    const textarea = page.locator("textarea.d-editor-input");
    if (await textarea.count()) await textarea.fill(content);
    else await page.locator(".ProseMirror[contenteditable=true]").fill(content);
    await page.locator("#reply-control .create").first().click();
    await page.locator("#reply-control.open").waitFor({ state: "hidden" });
    await page.getByText(content, { exact: true }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByText(content, { exact: true }).waitFor();
    results.push({ device, unread, published_and_reloaded: true });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
} catch (error) {
  results.push({ failure: error.stack });
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
  await fs.writeFile(path.join(root, "evidence/tests/interactions.json"), JSON.stringify(results, null, 2));
  execFileSync("bin/rails", ["runner", path.join(root, "demo/cleanup-tests.rb")], { env: { ...process.env, PDX_DEMO: "1" }, stdio: "pipe" });
}
