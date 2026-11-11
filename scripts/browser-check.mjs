import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

// Exercise the exported production page through HTTP, including its real assets.
const root = resolve("out");
const artifacts = resolve(process.env.QA_OUTPUT ?? "work/browser-qa");
await mkdir(artifacts, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".json": "application/json",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}/`) && file !== root)
      throw new Error("Invalid path");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] ?? "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(await readFile(resolve(root, "404.html")).catch(() => "Not found"));
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
let executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) {
  try {
    await access("/usr/bin/chromium");
    executablePath = "/usr/bin/chromium";
  } catch {}
}
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const failures = [];
const report = [];
function watch(page) {
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
}
const activeWord = (page) => page.locator(".suffix.is-active").textContent();

async function checkContrast(page) {
  const failures = await page.evaluate(() => {
    const channels = (color) =>
      (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (rgb) =>
      rgb
        .map((n) => {
          const v = n / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((total, n, i) => total + n * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const issues = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (
        !node.textContent.trim() ||
        !element?.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        })
      )
        continue;
      const style = getComputedStyle(element);
      let parent = element;
      let background = "rgba(0, 0, 0, 0)";
      while (parent) {
        background = getComputedStyle(parent).backgroundColor;
        if (background !== "rgba(0, 0, 0, 0)" && background !== "transparent")
          break;
        parent = parent.parentElement;
      }
      const score = ratio(channels(style.color), channels(background));
      const large =
        parseFloat(style.fontSize) >= 24 ||
        (parseFloat(style.fontSize) >= 18.66 &&
          parseInt(style.fontWeight) >= 700);
      if (score < (large ? 3 : 4.5))
        issues.push({ text: node.textContent.trim().slice(0, 70), score });
    }
    const input = document.querySelector("#name");
    if (!input) return issues;
    const placeholder = getComputedStyle(input, "::placeholder");
    const placeholderRatio = ratio(
      channels(placeholder.color),
      channels(getComputedStyle(input).backgroundColor),
    );
    if (placeholderRatio < 4.5)
      issues.push({ text: "Input placeholder", score: placeholderRatio });
    const borderRatio = ratio(
      channels(getComputedStyle(input).borderColor),
      channels(getComputedStyle(input).backgroundColor),
    );
    if (borderRatio < 3)
      issues.push({ text: "Input border", score: borderRatio });
    return issues;
  });
  assert.deepEqual(
    failures,
    [],
    "Text or form boundary fails WCAG contrast thresholds",
  );
}

try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    watch(page);
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await activeWord(page), "X.");
    const stationary = await page.locator(".fixed-word").boundingBox();
    const heroBottom = await page.locator(".hero-index").boundingBox();
    for (const mode of ["AI", "Career", "Team"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      assert.equal(await activeWord(page), `${mode}.`);
      assert.equal(
        await page
          .getByRole("button", { name: mode, exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      const layout = await page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector(".suffix.is-active"));
        return {
          document: document.documentElement.scrollWidth,
          viewport: innerWidth,
          suffixRight: range.getBoundingClientRect().right,
        };
      });
      assert.ok(layout.document <= width, `${width}: horizontal overflow`);
      assert.ok(layout.suffixRight <= width - 15, `${width}: clipped ${mode}`);
      const fixed = await page.locator(".fixed-word").boundingBox();
      assert.equal(fixed.x, stationary.x);
      assert.equal(fixed.y, stationary.y);
      assert.equal(
        (await page.locator(".hero-index").boundingBox()).y,
        heroBottom.y,
        `${width}: hero layout shifts in ${mode} mode`,
      );
      assert.equal(
        await page
          .locator(".suffix.is-active")
          .evaluate((element) => getComputedStyle(element).transitionDuration),
        "0s",
      );
    }
    await page.getByRole("button", { name: "AI", exact: true }).click();
    await checkContrast(page);
    await page.screenshot({
      path: resolve(artifacts, `desktop-${width}.png`),
      fullPage: true,
    });
    await page.screenshot({
      path: resolve(artifacts, `viewport-${width}.png`),
    });
    await page.close();
    report.push(
      `PASS ${width}px: all variable names fit, BuildMy stays stationary, no horizontal overflow, reduced-motion transitions disabled.`,
    );
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  watch(page);
  await page.clock.install({ time: new Date("2026-11-11T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-11T00:00:00Z"));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await activeWord(page), "X.");
  await page.clock.runFor(4000);
  assert.equal(await activeWord(page), "AI.");
  await page.clock.runFor(4000);
  assert.equal(await activeWord(page), "Career.");
  await page.clock.runFor(4000);
  assert.equal(await activeWord(page), "Team.");
  await page.getByRole("button", { name: "Career", exact: true }).click();
  await page.mouse.move(1400, 900);
  await page.locator("#name").focus();
  await page.clock.runFor(12000);
  assert.equal(await activeWord(page), "Career.");
  assert.equal(await page.locator("#interest").inputValue(), "learning");
  await page.getByRole("button", { name: "Resume word rotation" }).click();
  await page.mouse.move(1400, 900);
  await page.locator("#name").focus();
  await page.clock.runFor(4000);
  assert.equal(await activeWord(page), "Team.");
  await page.locator(".mode-buttons").hover();
  await page.clock.runFor(8000);
  assert.equal(await activeWord(page), "Team.");
  await page.locator(".hero-pitch > a.button").hover();
  await page.clock.runFor(8000);
  assert.equal(await activeWord(page), "Team.");
  await page.mouse.move(1400, 900);
  await page.locator(".hero-pitch > a.button").focus();
  await page.clock.runFor(8000);
  assert.equal(await activeWord(page), "Team.");
  await page.mouse.move(1400, 900);
  await page.getByRole("button", { name: "AI", exact: true }).focus();
  await page.clock.runFor(8000);
  assert.equal(await activeWord(page), "Team.");
  await page.getByRole("button", { name: "Pause word rotation" }).click();
  await page.mouse.move(1400, 900);
  await page.locator("#name").focus();
  await page.clock.runFor(8000);
  assert.equal(await activeWord(page), "Team.");
  report.push(
    "PASS hero: X initial state, automatic AI/Career/Team states, persistent manual selection, pause/resume, hover and focus pauses.",
  );

  await page.locator("#name").fill("A Person");
  await page.locator("#email").fill("person@example.com");
  await page
    .locator("#description")
    .fill("We need help with a repeatable reporting workflow.");
  const ctas = [
    [
      page.locator("#ai").getByRole("link", { name: "Discuss an AI project" }),
      "ai",
    ],
    [
      page
        .locator("#career")
        .getByRole("link", { name: "Register learning interest" }),
      "learning",
    ],
    [
      page
        .locator("#team")
        .getByRole("link", { name: "Discuss developer needs" }),
      "hiring",
    ],
    [
      page.locator("#team").getByRole("link", { name: "Introduce yourself" }),
      "developer",
    ],
  ];
  for (const [cta, value] of ctas) {
    await cta.click();
    await expect(page.locator("#interest")).toHaveValue(value);
    assert.equal(await page.locator("#name").inputValue(), "A Person");
    assert.equal(
      await page.locator("#description").inputValue(),
      "We need help with a repeatable reporting workflow.",
    );
    assert.equal(new URL(page.url()).hash, "#enquire");
  }
  for (const [mode, value] of [
    ["AI", "ai"],
    ["Career", "learning"],
    ["Team", "hiring"],
  ]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await page.locator(".hero-pitch > a.button").click();
    await expect(page.locator("#interest")).toHaveValue(value);
    assert.equal(new URL(page.url()).hash, "#enquire");
    assert.equal(
      await page.locator("#email").inputValue(),
      "person@example.com",
    );
  }
  report.push(
    "PASS CTAs: every hero and service CTA selects its matching interest, reaches the enquiry section and preserves existing inputs.",
  );

  await page.locator("#email").fill("invalid");
  await page.getByRole("button", { name: "Copy enquiry", exact: true }).click();
  assert.equal(
    await page.locator("#email").getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page
      .locator("#email")
      .evaluate((node) => document.activeElement === node),
    true,
  );
  assert.equal(await page.locator("#name").inputValue(), "A Person");
  await page.locator("#email").fill("person@example.com");
  await page.getByRole("button", { name: "Copy enquiry", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "copied to your clipboard" })
    .waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /Interest: Hiring developers/);
  assert.match(copied, /reporting workflow/);
  assert.match(
    await page.locator("#prepared-message").inputValue(),
    /Name: A Person/,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Blocked")) },
    });
  });
  await page.getByRole("button", { name: "Copy enquiry", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Automatic copying wasn’t available" })
    .waitFor();
  assert.equal(
    await page
      .locator("#prepared-message")
      .evaluate(
        (node) =>
          node.selectionEnd === node.value.length && node.selectionStart === 0,
      ),
    true,
  );
  assert.equal(
    await page.locator("#description").inputValue(),
    "We need help with a repeatable reporting workflow.",
  );
  report.push(
    "PASS form: invalid email is identified and focused; values retained; actual clipboard copy confirmed; rejected clipboard shows a focused, selected manual-copy message.",
  );

  const ids = await page
    .locator("a[href^='#']")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href").slice(1)),
    );
  for (const id of ids)
    assert.equal(
      await page.locator(`[id="${id}"]`).count(),
      1,
      `Broken internal link: ${id}`,
    );
  await page.locator(".faq details").first().locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator(".faq details").first().getAttribute("open"),
    "",
  );
  await page.locator(".mode-buttons button").first().focus();
  const focus = await page
    .locator(".mode-buttons button")
    .first()
    .evaluate((node) => ({
      outline: getComputedStyle(node).outlineStyle,
      width: getComputedStyle(node).outlineWidth,
    }));
  assert.equal(focus.outline, "solid");
  assert.equal(focus.width, "2px");
  await context.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  watch(mobile);
  await mobile.goto(url);
  const menu = mobile.getByRole("button", { name: "Open navigation" });
  await menu.click();
  assert.equal(
    await mobile
      .getByRole("button", { name: "Close navigation" })
      .getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(
    await mobile
      .locator("#mobile-navigation a")
      .first()
      .evaluate((node) => document.activeElement === node),
    true,
  );
  await mobile.keyboard.press("Escape");
  assert.equal(
    await mobile
      .getByRole("button", { name: "Open navigation" })
      .getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(
    await menu.evaluate((node) => document.activeElement === node),
    true,
  );
  await menu.click();
  await mobile
    .locator("#mobile-navigation")
    .getByRole("link", { name: "BuildMyCareer" })
    .click();
  await expect(mobile).toHaveURL(`${url}/services/career/`);
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  await expect(mobile.locator("#main")).toBeFocused();
  await mobile.goto(url);
  await mobile.keyboard.press("Tab");
  assert.equal(
    await mobile
      .getByRole("link", { name: "Skip to content" })
      .evaluate((node) => document.activeElement === node),
    true,
  );
  await mobile.keyboard.press("Enter");
  assert.equal(
    await mobile
      .locator("#main")
      .evaluate((node) => document.activeElement === node),
    true,
  );
  report.push(
    "PASS accessibility: mobile menu keyboard/touch disclosure, expanded states, Escape/focus return, selected-section focus, skip link, visible keyboard focus, FAQ keyboard activation, internal links.",
  );
  report.push(
    "PASS WCAG contrast thresholds for visible text at every tested width, plus input placeholder and control boundary contrast.",
  );
  await mobile.close();

  const routes = [
    ["/services/ai/", "BuildMyAI"],
    ["/services/career/", "BuildMyCareer"],
    ["/services/team/", "BuildMyTeam"],
    ["/developers/", "Developer introductions"],
    ["/privacy/", "Privacy & enquiries"],
  ];
  const linksToAudit = new Set();
  for (const [path, title] of routes) {
    for (const width of [320, 390, 768, 1440]) {
      const routePage = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      watch(routePage);
      const response = await routePage.goto(`${url}${path}`);
      assert.equal(response.status(), 200);
      await routePage.evaluate(() => document.fonts.ready);
      await expect(routePage).toHaveTitle(`${title} — BuildMyX`);
      assert.equal(await routePage.locator("main h1").count(), 1);
      assert.equal(await routePage.locator("header.site-header").count(), 1);
      assert.equal(await routePage.locator("footer.site-footer").count(), 1);
      assert.ok(
        await routePage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} ${width}px has horizontal overflow`,
      );
      await checkContrast(routePage);
      for (const link of await routePage
        .locator("a[href]")
        .evaluateAll((elements) => elements.map((element) => element.href)))
        if (link.startsWith(url)) linksToAudit.add(link);
      if (width === 320 || width === 1440)
        await routePage.screenshot({
          path: resolve(
            artifacts,
            `${path.split("/").filter(Boolean).join("-")}-${width}.png`,
          ),
          fullPage: true,
        });
      await routePage.close();
    }
    report.push(
      `PASS ${path}: production entry, page metadata, one shared header/footer, readable contrast and no overflow at 320/390/768/1440px.`,
    );
  }

  const journey = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  watch(journey);
  await journey.goto(url);
  await journey.evaluate(() => document.fonts.ready);
  await journey.getByRole("button", { name: "Career", exact: true }).click();
  await journey.locator(".hero-detail-link").click();
  await expect(journey).toHaveURL(`${url}/services/career/`);
  await journey.locator(".site-header .brand-link").click();
  await expect(journey).toHaveURL(`${url}/`);
  await expect(journey.locator(".suffix.is-active")).toHaveText("Career.");
  await expect(
    journey.getByRole("button", { name: "Resume word rotation" }),
  ).toBeVisible();
  const draft = {
    name: "Enquiry Visitor",
    email: "visitor@example.com",
    description: "We want help with a recurring business reporting workflow.",
    company: "Example Company",
    links: "https://example.com/project",
  };
  for (const [field, value] of Object.entries(draft))
    await journey.locator(`#${field}`).fill(value);
  for (const [mode, path, value] of [
    ["AI", "/services/ai/", "ai"],
    ["Career", "/services/career/", "learning"],
    ["Team", "/services/team/", "hiring"],
  ]) {
    await journey.locator(`#${mode.toLowerCase()} .secondary-link`).click();
    await expect(journey).toHaveURL(`${url}${path}`);
    await expect(
      journey.locator(".desktop-nav a[aria-current='page']"),
    ).toHaveText(`BuildMy${mode}`);
    await journey.locator("main .detail-actions a.button").click();
    await expect(journey.locator("#interest")).toHaveValue(value);
    await expect(journey.locator("#enquire")).toBeFocused();
    assert.equal(new URL(journey.url()).hash, "#enquire");
    for (const [field, expected] of Object.entries(draft))
      await expect(journey.locator(`#${field}`)).toHaveValue(expected);
  }
  await journey
    .locator("#team .developer-route")
    .getByRole("link", { name: "How developer introductions work" })
    .click();
  await expect(journey).toHaveURL(`${url}/developers/`);
  await journey.locator("main .detail-actions a.button").click();
  await expect(journey.locator("#interest")).toHaveValue("developer");
  await journey.locator(".form-privacy a").click();
  await expect(journey).toHaveURL(`${url}/privacy/`);
  await journey.getByRole("link", { name: "Back to your enquiry" }).click();
  await expect(journey.locator("#interest")).toHaveValue("developer");
  for (const [field, expected] of Object.entries(draft))
    await expect(journey.locator(`#${field}`)).toHaveValue(expected);
  await journey
    .locator(".example-controls")
    .getByRole("button", { name: "Explain", exact: true })
    .click();
  await expect(journey.locator(".example-question")).toHaveText(
    "“What information is behind that change?”",
  );
  await expect(
    journey.locator(".example-controls button[aria-pressed='true']"),
  ).toHaveText("Explain");
  await journey
    .locator(".example-controls")
    .getByRole("button", { name: "Review", exact: true })
    .focus();
  await journey.keyboard.press("Enter");
  await expect(journey.locator(".example-question")).toHaveText(
    "“What needs a closer look?”",
  );
  assert.equal(
    await journey.locator(".example-response").getAttribute("aria-live"),
    "polite",
  );
  await journey.reload();
  await expect(journey.locator("#name")).toHaveValue("");
  assert.equal(
    await journey.evaluate(() => localStorage.length + sessionStorage.length),
    0,
  );
  for (const value of ["ai", "learning", "hiring", "developer"]) {
    await journey.goto(`${url}/?interest=${value}#enquire`);
    await expect(journey.locator("#interest")).toHaveValue(value);
  }
  await journey.goto(`${url}/?interest=learning#enquire`);
  await expect(journey.locator("#interest")).toHaveValue("learning");
  await journey
    .locator("#team")
    .getByRole("link", { name: "Discuss developer needs", exact: true })
    .click();
  await expect(journey.locator("#interest")).toHaveValue("hiring");
  await journey.goto(`${url}/?interest=unknown#enquire`);
  await expect(journey.locator("#interest")).toHaveValue("ai");
  for (const link of await journey
    .locator("a[href]")
    .evaluateAll((elements) => elements.map((element) => element.href)))
    if (link.startsWith(url)) linksToAudit.add(link);
  for (const target of linksToAudit) {
    const response = await fetch(target);
    assert.equal(response.status, 200, `Broken internal page: ${target}`);
    const hash = new URL(target).hash;
    if (hash) {
      const html = await response.text();
      assert.ok(
        await journey.evaluate(
          ({ html, id }) =>
            !!new DOMParser()
              .parseFromString(html, "text/html")
              .getElementById(id),
          { html, id: decodeURIComponent(hash.slice(1)) },
        ),
        `Broken anchor: ${target}`,
      );
    }
  }
  await journey.close();
  const notFoundPage = await browser.newPage();
  const missing = await notFoundPage.goto(`${url}/a-page-that-does-not-exist/`);
  assert.equal(missing.status(), 404);
  await expect(notFoundPage.locator("main h1")).toHaveText(
    "Let’s find yournext step.",
  );
  await notFoundPage.close();
  report.push(
    "PASS cross-page enquiry journeys: manual hero selection survives navigation; service and developer routes preselect the right interest and preserve every draft field; privacy round trip preserves the draft; refresh clears it; no browser storage; all direct enquiry URLs work.",
  );
  report.push(
    "PASS reporting example: click and keyboard selection update the clearly labelled illustrative workflow and accessible response.",
  );
  report.push(
    "PASS all internal page and anchor links, route metadata and custom 404 recovery.",
  );
  assert.deepEqual(failures, [], "Browser errors or missing assets");
  report.push(
    "PASS no browser console errors, page errors, hydration errors or missing assets.",
  );
  await writeFile(resolve(artifacts, "report.txt"), report.join("\n") + "\n");
  console.log(report.join("\n"));
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
