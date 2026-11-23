import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PDX_BASE_URL || "http://localhost:4300";
const state = JSON.parse(await fs.readFile(path.join(root, "demo/state.json")));
const session = JSON.parse(await fs.readFile(path.join(root, "demo/session.json")));
const axeSource = await fs.readFile(process.env.AXE_PATH || "/tmp/pdx-test-tools/node_modules/axe-core/axe.min.js", "utf8");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const report = { checks: [], accessibility: [], errors: [] };
const check = (name, detail = true) => { report.checks.push({ name, detail }); console.log(name, JSON.stringify(detail)); };
await fs.mkdir(path.join(root, "evidence/tests"), { recursive: true });

try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 1100 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, isMobile: device === "mobile", hasTouch: device === "mobile", deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("discourse__dev_tools", "false"));
    await context.addCookies([{ name: "_t", value: session.token, url: base, httpOnly: true, sameSite: "Lax" }, { name: "__profilin", value: "p%3Df", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.on("pageerror", e => report.errors.push({ device, message: e.message }));
    const goto = async (route, selector) => {
      const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200, route);
      await page.locator(selector).first().waitFor({ state: "visible" });
    };
    await goto("/directory", ".directory-grid");
    assert.deepEqual((await page.locator(".directory-card__title").allTextContents()).map(t => t.trim()).sort(), ["Damn Zippy", "Dawn Davis", "Fox Parade", "Kale", "Shannon Margo"].sort());
    check(`${device}: production listings match`);
    await page.locator("#directory-search").fill("Dawn");
    await page.locator("#directory-search").press("Enter");
    await page.waitForURL(/q=Dawn/);
    assert.equal(await page.locator(".directory-card__title").count(), 1);
    assert.equal((await page.locator(".directory-card__title").innerText()).trim(), "Dawn Davis");
    check(`${device}: directory search by keyboard`);
    await goto("/directory?specialization=cartoon", ".directory-grid");
    assert.equal(await page.locator(".directory-card").count(), 2);
    await goto("/directory?q=nonexistent-result-123", ".directory-empty");
    assert.equal(await page.locator(".directory-card").count(), 0);
    check(`${device}: specialization filter and empty results`);
    await goto("/directory?view=map", ".leaflet-marker-icon");
    await page.locator(".leaflet-marker-icon").click();
    await page.locator(".leaflet-popup").waitFor();
    await page.locator(".leaflet-popup").getByText("Heart Eyes Tattoo", { exact: true }).waitFor({ state: "visible" });
    assert.match(await page.locator(".leaflet-popup").innerText(), /Heart Eyes Tattoo/);
    check(`${device}: production map pin and popup`);
    await goto("/directory/people/1/damn-zippy", ".directory-record__title");
    assert.equal(await page.getByRole("link", { name: "Instagram", exact: true }).getAttribute("href"), "https://instagram.com/damn_zippy");
    check(`${device}: profile source and Instagram link`);

    for (const [name, route, selector] of [["homepage", "/directory", ".directory-grid"], ["topic", `/t/${state.topics[0].id}`, ".topic-body .cooked"], ["community", "/latest", ".pdx-editorial"], ["search", "/search?q=welcome", ".search-container"], ["profile", "/u/system/summary", ".user-main"]]) {
      await goto(route, selector);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${device} ${name} overflow`);
      await page.evaluate(axeSource);
      const result = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
        return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: r.incomplete.map(v => v.id) };
      });
      report.accessibility.push({ device, name, ...result });
      check(`${device}: ${name} renders and accessibility checked`, { violations: result.violations.length });
    }
    await goto("/search?q=welcome", ".search-container");
    assert.ok(await page.locator(`a[href*="/t/"]`).filter({ hasText: "Welcome to PDX" }).count());
    check(`${device}: native full-page search returns production topic`);
    await goto(`/t/${state.topics[0].id}`, ".topic-body .cooked");
    assert.ok(await page.locator("#current-user").count(), "Test account authenticated");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineStyle }));
    assert.notEqual(focused.tag, "BODY");
    check(`${device}: keyboard focus enters controls`, focused);

    // Select actual post text, then use Discourse's quote toolbar and native composer.
    const paragraph = page.locator(".topic-body .cooked p").first();
    await paragraph.scrollIntoViewIfNeeded();
    const box = await paragraph.boundingBox();
    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + Math.min(box.width - 2, 260), box.y + box.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.locator(".insert-quote").waitFor({ state: "visible" });
    await page.locator(".insert-quote").click();
    await page.locator("#reply-control.open").waitFor();
    const textarea = page.locator("textarea.d-editor-input");
    if (await textarea.count()) {
      assert.match(await textarea.inputValue(), /\[quote=/);
      await textarea.fill((await textarea.inputValue()) + "\n\nStaging verification draft. This draft is discarded after testing.");
    } else {
      const editor = page.locator(".ProseMirror[contenteditable=true]");
      await editor.press("Control+End");
      await editor.press("Enter");
      await editor.pressSequentially("Staging verification draft. This draft is discarded after testing.");
      assert.match(await page.locator("#reply-control").innerText(), /glad|joined|quote/i);
    }
    await page.screenshot({ path: path.join(root, "evidence/tests", `${device}-quote-composer.png`), fullPage: false });
    check(`${device}: native quote and composer draft`);
    const cancel = page.locator("#reply-control .discard-button").first();
    await cancel.click();
    const discard = page.getByRole("button", { name: /discard/i }).first();
    if (await discard.isVisible({ timeout: 2000 }).catch(() => false)) await discard.click();
    await page.locator("#reply-control.open").waitFor({ state: "hidden" });
    check(`${device}: draft discarded`);
    await page.emulateMedia({ colorScheme: "dark" });
    await goto("/directory", ".directory-grid");
    await page.screenshot({ path: path.join(root, "evidence/tests", `${device}-dark-homepage.png`), fullPage: true });
    check(`${device}: dark palette`, await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, foreground: getComputedStyle(document.body).color })));
    await context.close();
  }
} catch (error) {
  report.failure = error.stack;
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(root, "evidence/tests/verification.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
