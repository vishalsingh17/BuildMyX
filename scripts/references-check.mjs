import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect } from "@playwright/test";

/** Deterministic UI journeys; the sync command separately audits the real CDN. */
export async function checkReferences(
  browser,
  base,
  { artifacts, checkContrast, record },
) {
  const snapshot = JSON.parse(
    await readFile("data/references/catalog.json", "utf8"),
  );
  const primary = snapshot.families.find((family) => family.id === "pandas")
    .collections[0];
  const root = `${base}/learn/references/`;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [],
    invalidRequests = [],
    pageCounts = new Map();
  const entries = [
    {
      name: "pandas.DataFrame.groupby",
      path: "reference/api/pandas.dataframe.groupby#parameters",
      type: "GroupBy",
    },
    {
      name: "pandas.DataFrame.sum",
      path: "reference/api/pandas.dataframe.sum",
      type: "Aggregation",
    },
    {
      name: "Encoded reference",
      path: "classes/class_%40gdscript",
      type: "General",
    },
    { name: "Slow source", path: "slow-source", type: "General" },
    { name: "Retry source", path: "retry-source", type: "General" },
    ...Array.from({ length: 121 }, (_, i) => ({
      name: `Topic ${String(i).padStart(3, "0")}`,
      path: `topic-${i}`,
      type: "General",
    })),
  ];
  const doc = (title) => ({
    title,
    sourceUrl:
      "https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html",
    sourceIsPage: true,
    outline: [
      { id: "ref-parameters", title: "Parameters", level: 2 },
      { id: "ref-examples", title: "Examples", level: 2 },
    ],
    html: `<h2 id="ref-parameters">Parameters</h2><p>Choose a grouping key and an aggregation.</p><h2 id="ref-examples">Examples</h2><pre><code>frame.groupby("city")["seats"].sum()</code></pre><pre><code>${"long_example = ".repeat(30)}</code></pre><table><tr><th>city</th><th>seats</th><th>amount</th><th>count</th></tr><tr><td>Pune</td><td>12</td><td>6000</td><td>2</td></tr></table><p><a href="/learn/references/pandas/reference/api/pandas.dataframe.sum">Sum reference</a></p><div class="_attribution">Copyright pandas contributors. BSD 3-clause. <a href="https://pandas.pydata.org/" target="_blank" rel="noopener noreferrer">Original documentation</a></div>`,
  });
  await context.route("**/*.posthog.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await context.route("**/api/references/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("v") !== String(primary.mtime))
      invalidRequests.push(url.pathname);
    if (url.pathname.endsWith("/index/"))
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entries, types: [] }),
      });
    if (
      url.searchParams.get("path")?.startsWith("classes/") &&
      url.searchParams.get("path") !== "classes/class_%40gdscript"
    )
      invalidRequests.push("Incorrectly decoded page path");
    const path = url.searchParams.get("path"),
      count = (pageCounts.get(path) || 0) + 1;
    pageCounts.set(path, count);
    if (path === "retry-source" && count === 1)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"Temporarily unavailable"}',
      });
    if (path === "missing-source")
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: '{"error":"Missing"}',
      });
    if (path === "updated-source")
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: '{"error":"Updated"}',
      });
    if (path === "slow-source")
      await new Promise((done) => setTimeout(done, 900));
    const title =
      path === "slow-source"
        ? "Slow source"
        : path === "retry-source"
          ? "Recovered reference"
          : path?.endsWith("sum")
            ? "DataFrame.sum"
            : "DataFrame.groupby";
    try {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(doc(title)),
      });
    } catch {
      /* The stale request may have been cancelled by navigation. */
    }
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !/server responded with a status of (404|409|503)/.test(message.text())
    )
      errors.push(message.text());
  });
  try {
    await page.goto(root);
    await expect(page.locator(".reference-family-card")).toHaveCount(
      snapshot.families.length,
    );
    const hrefs = await page
      .locator(".reference-family-card a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    assert.equal(
      new Set(hrefs).size,
      snapshot.families.flatMap((family) => family.collections).length,
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Reference directory overflow at ${width}`,
      );
    }
    await checkContrast(page);
    await page.screenshot({
      path: resolve(artifacts, "references-directory.png"),
    });
    await page
      .getByLabel("Find documentation", { exact: true })
      .fill("PyTorch");
    await page.getByLabel("Browse by field").selectOption("Data & AI");
    await expect(page.locator(".reference-family-card")).toHaveCount(1);
    await expect(page.locator(".reference-family-card h3")).toHaveText(
      "PyTorch",
    );
    await page
      .getByLabel("Find documentation", { exact: true })
      .fill("not-a-real-documentation-family");
    await expect(
      page.getByRole("heading", { name: "No matching documentation" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Show all documentation" }).click();
    await expect(page.locator(".reference-family-card")).toHaveCount(
      snapshot.families.length,
    );
    await page.getByLabel("Find documentation", { exact: true }).fill("pandas");
    await page.locator(".reference-family-card h3 a").click();
    await expect(page).toHaveURL(`${root}pandas/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "pandas reference",
    );
    await expect(page.locator(".reference-topic-list li")).toHaveCount(80);
    await page.getByRole("button", { name: "Show 80 more topics" }).click();
    await expect(page.locator(".reference-topic-list li")).toHaveCount(
      entries.length,
    );
    await page.getByLabel("Search pandas topics").fill("groupby");
    await expect(page.locator(".reference-topic-list li")).toHaveCount(1);
    await page.locator(".reference-topic-list a").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataFrame.groupby",
    );
    await expect(page.locator(".reference-content code").first()).toHaveText(
      'frame.groupby("city")["seats"].sum()',
    );
    await expect(page.getByLabel("Search pandas topics")).toBeVisible();
    await expect(page.locator("._attribution")).toContainText(
      "Copyright pandas contributors. BSD 3-clause.",
    );
    await expect(
      page.getByRole("link", { name: /^Original source page/ }),
    ).toHaveAttribute("target", "_blank");
    await page
      .getByRole("link", { name: "Sum reference", exact: true })
      .click();
    await expect(page).toHaveURL(
      `${root}pandas/reference/api/pandas.dataframe.sum`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataFrame.sum",
    );
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataFrame.groupby",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow",
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${root}pandas/reference/api/pandas.dataframe.groupby/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "DataFrame.groupby",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Reference reader overflow at ${width}`,
      );
      if (width <= 768) {
        const summary = page.locator(".reference-topic-disclosure > summary");
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByLabel("Search pandas topics")).toBeVisible();
        await page.getByLabel("Search pandas topics").fill("groupby");
        await expect(page.locator(".reference-topic-list li")).toHaveCount(1);
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByLabel("Search pandas topics")).not.toBeVisible();
      }
      await checkContrast(page);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: resolve(artifacts, `references-reader-${width}.png`),
        });
    }
    await page.goto(`${root}pandas/`);
    await page.getByLabel("Search pandas topics").fill("Encoded reference");
    await page.locator(".reference-topic-list a").click();
    await expect(page.locator(".reference-content")).toBeVisible();
    await page.goto(`${root}pandas/classes/class_~2540gdscript/`);
    await expect(page.locator(".reference-content")).toBeVisible();
    await page.goto(`${root}pandas/retry-source/`);
    await expect(
      page.getByRole("heading", { name: "We couldn’t load this page." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Recovered reference",
    );
    assert.equal(pageCounts.get("retry-source"), 2);
    await page.goto(`${root}pandas/missing-source/`);
    await expect(
      page.getByRole("heading", {
        name: "This source page could not be found.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^View on DevDocs/ }),
    ).toBeVisible();
    await page.goto(`${root}pandas/updated-source/`);
    await expect(
      page.getByRole("button", { name: "Reload reference" }),
    ).toBeVisible();
    await page.goto(`${root}pandas/slow-source/`);
    await page.getByLabel("Search pandas topics").fill("sum");
    await page.locator(".reference-topic-list a").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataFrame.sum",
    );
    await page.waitForTimeout(1100);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "DataFrame.sum",
    );
    assert.equal(
      (await page.goto(`${root}not-a-real-collection/`)).status(),
      404,
    );
    assert.deepEqual(
      invalidRequests,
      [],
      "Every request must select the reviewed source revision.",
    );
    assert.deepEqual(
      errors,
      [],
      "Reference pages must have no script or hydration errors.",
    );
    record(
      `PASS reference library: ${snapshot.families.length} families and all ${snapshot.families.flatMap((f) => f.collections).length} reader addresses, filters, empty results, pagination, name search, source attribution, internal links/back navigation, mobile keyboard drawer, 320/390/768/1440px layouts, readable contrast, retry/missing/updated states and stale-response cancellation. UI data mocked; real collection audit uses sync:references --verify-pages.`,
    );
  } finally {
    await context.close();
  }
}
