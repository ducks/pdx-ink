import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://pdx.tattooer.directory";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage();
const snapshot = { source: origin, captured_at: new Date().toISOString(), people: [], shops: [], categories: [], topics: [], settings: {} };
const parse = async (pathname, kind) => {
  const response = await fetch(origin + pathname);
  if (!response.ok) throw new Error(`${pathname}: ${response.status}`);
  await page.setContent(await response.text(), { waitUntil: "domcontentloaded" });
  return page.evaluate(({ pathname, kind }) => {
    const text = (selector) => document.querySelector(selector)?.textContent.trim() || "";
    if (kind === "index") return {
      paths: [...document.querySelectorAll(".directory-card__link")].map(a => a.getAttribute("href")),
      next: document.querySelector(".directory-pagination a:last-child")?.getAttribute("href"),
      title: text(".directory-hero__title"), description: text(".directory-hero__description"),
      neighborhoods: [...document.querySelectorAll("#directory-neighborhood option[value]:not([value=''])")].map(o => ({ slug: o.value, name: o.textContent.trim() })),
      specializations: [...document.querySelectorAll("#directory-specialization option[value]:not([value=''])")].map(o => ({ slug: o.value, name: o.textContent.trim() })),
    };
    const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || "{}");
    const links = [...document.querySelectorAll(".directory-record__actions a")].map(a => ({ href: a.getAttribute("href"), label: a.textContent.trim() }));
    const bio = document.querySelector(".directory-record__content");
    return {
      id: Number(pathname.split("/")[3]), slug: pathname.split("/")[4], name: text(".directory-record__title"), path: pathname,
      bio_cooked: bio?.innerHTML.trim() || "", bio_text: bio?.innerText.trim() || "",
      labels: [...document.querySelectorAll(".directory-record__header .directory-tags__item")].map(li => li.textContent.trim()),
      related: [...document.querySelectorAll(".directory-related-card a")].map(a => ({ path: a.getAttribute("href"), name: a.textContent.trim() })),
      image: document.querySelector(".directory-record__image")?.getAttribute("src") || null,
      address: text(".directory-record__address"), links, json_ld: ld,
      map: document.querySelector("[data-directory-map]")?.outerHTML || null,
    };
  }, { pathname, kind });
};
try {
  const index = await parse("/directory", "index");
  snapshot.settings = { title: "PDX Tattooer Directory", discourse_directory_title: index.title, discourse_directory_description: index.description, discourse_directory_entry_singular: "tattooer", discourse_directory_entry_plural: "tattooers" };
  snapshot.neighborhoods = index.neighborhoods;
  snapshot.specializations = index.specializations;
  for (const [kind, initial] of [["people", index], ["shops", await parse("/directory?kind=shops", "index")]]) {
    let listing = initial;
    const seen = new Set();
    while (listing) {
      for (const pathname of listing.paths) if (!seen.has(pathname)) {
        seen.add(pathname);
        snapshot[kind].push(await parse(pathname, "record"));
      }
      const next = listing.next;
      listing = next && !seen.has(next) ? (seen.add(next), await parse(next, "index")) : null;
    }
  }
  const categoryResponse = await fetch(origin + "/categories.json");
  snapshot.categories = (await categoryResponse.json()).category_list.categories;
  let latestPath = "/latest.json";
  const seenTopics = new Set();
  while (latestPath) {
    const response = await fetch(origin + latestPath);
    if (!response.ok) throw new Error(`Topic list: ${response.status}`);
    const latest = await response.json();
    for (const topic of latest.topic_list.topics) if (!seenTopics.has(topic.id)) {
      seenTopics.add(topic.id);
      const response = await fetch(`${origin}/t/${topic.id}.json`);
      if (!response.ok) throw new Error(`Topic ${topic.id}: ${response.status}`);
      const data = await response.json();
      if (data.post_stream.stream.length !== data.post_stream.posts.length) throw new Error("Large topic needs explicit additional post retrieval");
      snapshot.topics.push(data);
    }
    latestPath = latest.topic_list.more_topics_url || null;
    if (latestPath && !latestPath.includes(".json")) latestPath = latestPath.replace("?", ".json?");
  }
  await fs.mkdir(path.join(root, "demo/production"), { recursive: true });
  await fs.writeFile(path.join(root, "demo/production/snapshot.json"), JSON.stringify(snapshot, null, 2));
  console.log(JSON.stringify({ people: snapshot.people.map(p => p.name), shops: snapshot.shops.map(p => p.name), topics: snapshot.topics.map(t => t.title) }));
} finally {
  await browser.close();
}
