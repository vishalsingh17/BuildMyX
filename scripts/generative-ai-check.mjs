import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect } from "@playwright/test";

export async function checkGenerativeAi(
  browser,
  base,
  { watch, checkContrast, artifacts, record },
) {
  const curriculum = JSON.parse(
    await readFile("learning/generative-ai-curriculum.json", "utf8"),
  );
  const root = `${base}/learn/generative-ai/`;
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await watch(page);
  try {
    await page.goto(`${base}/learn/`);
    await expect(page.locator(".learning-card")).toHaveCount(5);
    await page.locator('.learning-card[href="generative-ai/"]').click();
    await expect(page).toHaveURL(root);
    await expect(page.locator(".md-typeset table tbody tr")).toHaveCount(32);
    await page.screenshot({
      path: resolve(artifacts, "generative-ai-overview.png"),
    });
    await page
      .getByRole("link", {
        name: "Start learning Generative AI →",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(`${root}getting-started/`);
    await page
      .locator(".md-typeset")
      .getByRole("link", {
        name: "02 · The math behind a prediction",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(`${root}math-and-learning/`);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${root}attention/`);
      const lab = page.locator("[data-genai-attention]");
      await lab.scrollIntoViewIfNeeded();
      await expect(lab.locator("[data-attention-weight]").nth(2)).toHaveText(
        "0.000",
      );
      await page
        .getByLabel("Query position", { exact: true })
        .selectOption("0");
      await expect(lab.locator("[data-attention-output]")).toContainText(
        "Output [1.000, 0.000]",
      );
      await page.getByRole("checkbox", { name: "Use a causal mask" }).uncheck();
      const unmasked = (
        await lab.locator("[data-attention-weight]").allTextContents()
      ).map(Number);
      assert.ok(unmasked.every((value) => value > 0));
      assert.ok(Math.abs(unmasked.reduce((a, b) => a + b, 0) - 1) < 0.002);
      const slider = page.getByLabel("Toy score temperature", { exact: true });
      await slider.focus();
      await page.keyboard.press("ArrowRight");
      await expect(lab.locator("[data-attention-output]")).toContainText(
        "toy temperature 1.25",
      );
      await page.getByRole("checkbox", { name: "Use a causal mask" }).check();
      await expect(lab.locator("[data-attention-weight]").first()).toHaveText(
        "1.000",
      );
      await checkContrast(page);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: resolve(artifacts, `generative-ai-attention-${width}.png`),
      });
      if (width === 390) {
        const menu = page.locator("[data-learning-drawer]");
        await menu.focus();
        await page.keyboard.press("Enter");
        await page
          .locator("#lesson-navigation")
          .getByRole("link", {
            name: "31 · Connect perception, prediction and action",
            exact: true,
          })
          .click();
        await expect(page).toHaveURL(`${root}physical-ai/`);
      }
      await page
        .locator(
          width === 390 ? "[data-learning-search]" : ".md-search__button",
        )
        .click();
      await page
        .getByRole("combobox", { name: "Search", exact: true })
        .fill("three meanings of recursion");
      await page
        .getByRole("option", {
          name: "Separate three meanings of recursion",
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        /\/learn\/generative-ai\/recursive-transformers\/(?:\?[^#]*)?(#.*)?$/,
      );
      await expect(page.locator("main h1")).toHaveText(
        /^Understand recursive computation¶?$/,
      );
    }
    await page.goto(`${root}sources/`);
    for (const source of curriculum.sources)
      await expect(
        page
          .locator(".md-typeset")
          .getByRole("link", { name: source.title, exact: true }),
      ).toHaveAttribute("href", source.url);
    const response = await fetch(`${root}assets/generative-ai-labs.zip`, {
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200);
    const actual = Buffer.from(await response.arrayBuffer());
    const source = await readFile(
      "learning/content/generative-ai/assets/generative-ai-labs.zip",
    );
    assert.ok(
      actual.equals(source),
      "Published lab download must match the checked source bundle.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${root}capstone/`);
    await page.locator(".learning-cta .md-button").click();
    await expect(page.locator("#interest")).toHaveValue("learning");
    await page.locator("#name").fill("Generative AI Visitor");
    const popupPromise = page.waitForEvent("popup");
    await page
      .locator("#learn")
      .getByRole("link", {
        name: "Learn Generative AI step by step (opens in a new tab)",
        exact: true,
      })
      .click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup).toHaveURL(root);
    await expect(page.locator("#name")).toHaveValue("Generative AI Visitor");
    await popup.close();
    record(
      "PASS Generative AI: five-course library, 32-chapter sequence entry, interactive attention masks/normalization/keyboard controls on desktop/mobile, mobile chapter 31, native topic search, all 16 source links, exact lab ZIP download, learning enquiry CTA and draft-preserving landing entry.",
    );
  } finally {
    await page.close();
  }
}
