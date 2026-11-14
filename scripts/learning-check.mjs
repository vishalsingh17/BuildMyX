import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { resolve } from "node:path";
import { learningPaths } from "../lib/learning.ts";

export async function checkLearning(
  browser,
  url,
  { watch, checkContrast, artifacts, record },
) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await watch(page);
  const root = await page.goto(url);
  assert.equal(root.status(), 200);
  const rootNoindex =
    (
      await page.locator('meta[name="robots"]').getAttribute("content")
    )?.includes("noindex") ?? false;
  const canonicalOrigin = new URL(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
  ).origin;
  const internalLinks = new Set();
  for (const path of learningPaths) {
    const widths = /^\/learn\/(python|pandas|pytorch|generative-ai)\/.+/.test(path)
      ? [320, 1440]
      : [320, 390, 768, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`${url}${path}`);
      assert.equal(response.status(), 200, path);
      await page.evaluate(() => document.fonts.ready);
      if (width === 1440) {
        await expect(page.locator("[data-learning-drawer]")).not.toBeVisible();
        await expect(page.locator("[data-learning-search]")).not.toBeVisible();
        await expect(page.locator(".md-search__button")).toBeVisible();
      } else {
        await expect(page.locator("[data-learning-drawer]")).toBeVisible();
        await expect(page.locator("[data-learning-search]")).toBeVisible();
        await expect(page.locator(".md-search__button")).not.toBeVisible();
      }
      assert.equal(await page.locator("main h1").count(), 1, path);
      await expect(page).toHaveTitle(/BuildMyX Learn/);
      await expect(page.locator('meta[name="generator"]')).toHaveAttribute(
        "content",
        /zensical/i,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${canonicalOrigin}${path}`,
      );
      assert.equal(
        (await page.locator('meta[name="robots"]').count()) > 0,
        rootNoindex,
        `${path}: indexing must match the website environment`,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path}: overflow at ${width}px`,
      );
      await checkContrast(page);
      for (const href of await page
        .locator("a[href]")
        .evaluateAll((es) => es.map((e) => e.href))) {
        if (href.startsWith(url)) internalLinks.add(href);
      }
    }
    record(
      `PASS ${path}: Zensical HTML, canonical/indexing policy, readable contrast and no overflow at ${widths.join("/")}px.`,
    );
  }
  for (const href of internalLinks) {
    const response = await fetch(href, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `Broken learning link: ${href}`);
    const hash = new URL(href).hash;
    if (hash) {
      const html = await response.text();
      assert.ok(
        await page.evaluate(
          ({ html, id }) =>
            !!new DOMParser()
              .parseFromString(html, "text/html")
              .getElementById(id),
          { html, id: decodeURIComponent(hash.slice(1)) },
        ),
        `Broken learning anchor: ${href}`,
      );
    }
  }
  const article = `${url}/learn/fundamentals/what-is-system-design-interview/`;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(article);
  await page.screenshot({
    path: resolve(artifacts, "learning-desktop.png"),
    fullPage: true,
  });
  await expect(
    page.locator('.md-nav--primary a[aria-current="page"]').first(),
  ).toHaveText("What is a system design interview?");
  const question = page.getByText(
    "1. The prompt is ‘design a booking platform’. What should you do first?",
    { exact: true },
  );
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question.locator("..")).toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(question.locator("..")).not.toHaveAttribute("open", "");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(article);
    if (width === 390) {
      const menu = page.locator("[data-learning-drawer]");
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.locator("#lesson-navigation .md-nav__list a").first(),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(menu).toBeFocused();
      await menu.click();
      await page
        .locator("#lesson-navigation")
        .getByRole("link", { name: "Start with requirements", exact: true })
        .click();
      await expect(page).toHaveURL(`${url}/learn/fundamentals/requirements/`);
      await page.goto(article);
      await page.screenshot({
        path: resolve(artifacts, "learning-mobile.png"),
        fullPage: true,
      });
    }
    await page
      .locator(width === 390 ? "[data-learning-search]" : ".md-search__button")
      .click();
    const search = page.getByRole("combobox", { name: "Search", exact: true });
    await expect(search).toBeVisible();
    await search.fill("idempotency");
    // Search options live in Zensical's shadow DOM. Exercise the real index,
    // keyboard dismissal and generated lesson/section destinations.
    await expect(
      page.getByRole("option", {
        name: "Make retries predictable",
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(search).not.toBeVisible();
    await page
      .locator(width === 390 ? "[data-learning-search]" : ".md-search__button")
      .click();
    await search.fill("idempotency");
    await page
      .getByRole("option", { name: "Make retries predictable", exact: true })
      .click();
    await expect(page).toHaveURL(
      /\/learn\/fundamentals\/api-design\/(?:\?[^#]*)?(#.*)?$/,
    );
    await expect(page.locator("main h1")).toHaveText(/^Design an API¶?$/);
    await page
      .locator(width === 390 ? "[data-learning-search]" : ".md-search__button")
      .click();
    await page
      .getByRole("combobox", { name: "Search", exact: true })
      .fill("nonlocal");
    await page
      .getByRole("option", {
        name: "Rebind enclosing state with nonlocal",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(
      /\/learn\/python\/scope-and-closures\/(?:\?[^#]*)?(#.*)?$/,
    );
    await expect(page.locator("main h1")).toHaveText(
      /^Scope, nested functions and closures¶?$/,
    );
    await page
      .locator(width === 390 ? "[data-learning-search]" : ".md-search__button")
      .click();
    await page
      .getByRole("combobox", { name: "Search", exact: true })
      .fill("chained assignment");
    await page
      .getByRole("option", {
        name: "SettingWithCopyWarning and chained assignment",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(
      /\/learn\/pandas\/reliable-workflows\/(?:\?[^#]*)?(#.*)?$/,
    );
    await expect(page.locator("main h1")).toHaveText(
      /^Write reliable pandas¶?$/,
    );
    await page
      .locator(width === 390 ? "[data-learning-search]" : ".md-search__button")
      .click();
    await page
      .getByRole("combobox", { name: "Search", exact: true })
      .fill("padding-aware loss");
    await page
      .getByRole("option", {
        name: "Write a custom padding-aware loss",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(
      /\/learn\/pytorch\/networks\/(?:\?[^#]*)?(#.*)?$/,
    );
    await expect(page.locator("main h1")).toHaveText(
      /^CNNs, LSTMs and a masked token loss¶?$/,
    );
  }
  await page.goto(`${url}/learn/pandas/`);
  await page
    .getByRole("link", { name: "Start learning pandas →", exact: true })
    .click();
  await expect(page).toHaveURL(`${url}/learn/pandas/getting-started/`);
  const csvResponse = await fetch(
    `${url}/learn/pandas/data/workshop-enrolments.csv`,
  );
  assert.equal(csvResponse.status, 200);
  const csv = await csvResponse.text();
  assert.equal(csv.trim().split("\n").length, 9);
  assert.ok(
    csv.startsWith("booking_id,workshop,city,seats,fee,booked_at,rating,tags"),
  );
  await page.goto(`${url}/learn/pandas/plotting/`);
  const figure = page.getByRole("img", { name: /^Grouped bar chart:/ });
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toBeVisible();
  assert.ok(
    await figure.evaluate((image) => image.complete && image.naturalWidth > 0),
  );
  await page.goto(`${url}/learn/pandas/coverage/`);
  const coverageTable = page.locator(".md-typeset table").filter({
    has: page.locator('a[href^="https://aman.ai/primers/pandas/#"]'),
  });
  assert.equal(await coverageTable.locator("tbody tr").count(), 117);
  await page.screenshot({
    path: resolve(artifacts, "pandas-coverage.png"),
    fullPage: true,
  });
  await page.goto(`${url}/learn/pytorch/`);
  await page
    .getByRole("link", { name: "Start learning PyTorch →", exact: true })
    .click();
  await expect(page).toHaveURL(`${url}/learn/pytorch/getting-started/`);
  const bundleResponse = await fetch(
    `${url}/learn/pytorch/assets/pytorch-projects.zip`,
  );
  assert.equal(bundleResponse.status, 200);
  const bundle = new Uint8Array(await bundleResponse.arrayBuffer());
  assert.deepEqual([...bundle.slice(0, 4)], [80, 75, 3, 4]);
  assert.ok(bundle.length > 5000);
  await page.goto(`${url}/learn/pytorch/experiments/`);
  const pytorchFigure = page.getByRole("img", {
    name: /^Four learning-rate and width configurations/,
  });
  await pytorchFigure.scrollIntoViewIfNeeded();
  assert.ok(
    await pytorchFigure.evaluate(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page.goto(`${url}/learn/pytorch/coverage/`);
  const pytorchCoverage = page.locator(".md-typeset table").filter({
    has: page.locator('a[href^="https://aman.ai/primers/pytorch/#"]'),
  });
  assert.equal(await pytorchCoverage.locator("tbody tr").count(), 252);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(article);
  await page.locator(".learning-cta .md-button").click();
  await expect(page.locator("#interest")).toHaveValue("learning");
  await page.locator("#name").fill("Learning Visitor");
  const opened = page.waitForEvent("popup");
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Learn (opens in a new tab)", exact: true })
    .click();
  const library = await opened;
  await library.waitForLoadState("domcontentloaded");
  await expect(library).toHaveURL(`${url}/learn/`);
  await expect(page.locator("#name")).toHaveValue("Learning Visitor");
  await library.close();
  const pandasOpened = page.waitForEvent("popup");
  await page
    .locator("#learn")
    .getByRole("link", {
      name: "Learn data analysis with pandas (opens in a new tab)",
      exact: true,
    })
    .click();
  const pandasCourse = await pandasOpened;
  await pandasCourse.waitForLoadState("domcontentloaded");
  await expect(pandasCourse).toHaveURL(`${url}/learn/pandas/`);
  await expect(page.locator("#name")).toHaveValue("Learning Visitor");
  await pandasCourse.close();
  const pytorchOpened = page.waitForEvent("popup");
  await page
    .locator("#learn")
    .getByRole("link", {
      name: "Build models with PyTorch (opens in a new tab)",
      exact: true,
    })
    .click();
  const pytorchCourse = await pytorchOpened;
  await pytorchCourse.waitForLoadState("domcontentloaded");
  await expect(pytorchCourse).toHaveURL(`${url}/learn/pytorch/`);
  await expect(page.locator("#name")).toHaveValue("Learning Visitor");
  await pytorchCourse.close();
  await page.close();
  const missing = await browser.newPage();
  assert.equal(
    (await missing.goto(`${url}/learn/missing-lesson/`)).status(),
    404,
  );
  assert.equal(
    (
      await missing.goto(`${url}/learn/fundamentals/requirements/missing/`)
    ).status(),
    404,
  );
  await missing.close();
  record(
    "PASS learning interactions: real search on desktop/mobile, keyboard lesson drawer and answer disclosures, all curriculum/contents links, learning enquiry CTA, draft-preserving new-tab entry and real missing-lesson 404s.",
  );
}
