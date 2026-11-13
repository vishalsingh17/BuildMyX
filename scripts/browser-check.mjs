import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { checkStateMachines } from "./state-machine-check.mjs";

// Exercise the actual production Next.js server, including server endpoints.
const artifacts = resolve(process.env.QA_OUTPUT ?? "work/browser-qa");
await mkdir(artifacts, { recursive: true });
const reservation = createServer();
await new Promise((done) => reservation.listen(0, "127.0.0.1", done));
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
const url = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      ENQUIRY_ENABLED: "false",
      RESEND_API_KEY: "",
      ENQUIRY_FROM: "",
      ENQUIRY_TO: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    serverLog = (serverLog + chunk.toString()).slice(-8000);
  });
let ready = false;
for (let attempt = 0; attempt < 100; attempt++) {
  if (server.exitCode !== null) throw new Error(serverLog);
  try {
    if ((await fetchWithinTimeout(url)).ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((done) => setTimeout(done, 200));
}
if (!ready) {
  server.kill();
  throw new Error(`Production server did not start: ${serverLog}`);
}
let executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
if (!executablePath && !process.env.PLAYWRIGHT_CHANNEL) {
  try {
    await access("/usr/bin/chromium");
    executablePath = "/usr/bin/chromium";
  } catch {}
}
const browser = await chromium.launch({
  executablePath,
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const failures = [];
const expectedPosthog =
  process.env.POSTHOG_EXPECT_ENABLED ??
  (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false" ||
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
    ? "0"
    : "1");
const report = [];
const record = (...messages) => {
  report.push(...messages);
  for (const message of messages) console.log(message);
};
function fetchWithinTimeout(target, init = {}) {
  return fetch(target, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
}

function decodePosthog(body) {
  if (!body) return [];
  const text = body.toString("utf8");
  const encoded = new URLSearchParams(text).get("data");
  for (const candidate of [
    text,
    encoded,
    encoded && Buffer.from(encoded, "base64").toString("utf8"),
  ]) {
    if (!candidate) continue;
    try {
      const value = JSON.parse(candidate);
      return Array.isArray(value) ? value : (value.batch ?? [value]);
    } catch {}
  }
  throw new Error("Unrecognised PostHog request body");
}
async function watch(page) {
  const captured = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const destination = new URL(request.url());
    if (
      destination.hostname === "posthog.com" ||
      destination.hostname.endsWith(".posthog.com")
    ) {
      if (request.method() === "POST") {
        try {
          captured.push(...decodePosthog(request.postDataBuffer()));
        } catch (error) {
          failures.push(error.message);
        }
      }
      return route.fulfill({
        status: request.method() === "OPTIONS" ? 204 : 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "*",
          "content-type": "application/json",
        },
        body:
          request.method() === "OPTIONS"
            ? ""
            : JSON.stringify({
                status: 1,
                featureFlags: {},
                errorsWhileComputingFlags: false,
              }),
      });
    }
    if (request.method() === "POST" && destination.origin !== url)
      return route.abort("blockedbyclient");
    return route.continue();
  });
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  return captured;
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
    await watch(page);
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
    record(
      `PASS ${width}px: all variable names fit, BuildMy stays stationary, no horizontal overflow, reduced-motion transitions disabled.`,
    );
  }

  console.log("Checking timed hero behavior, CTAs and enquiry fields...");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await watch(page);
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
  record(
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
  record(
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
  record(
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
  await watch(mobile);
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
  record(
    "PASS accessibility: mobile menu keyboard/touch disclosure, expanded states, Escape/focus return, selected-section focus, skip link, visible keyboard focus, FAQ keyboard activation, internal links.",
  );
  record(
    "PASS WCAG contrast thresholds for visible text at every tested width, plus input placeholder and control boundary contrast.",
  );
  await mobile.close();

  const routes = [
    ["/services/ai/", "Reporting automation & AI development | BuildMyAI"],
    [
      "/services/career/",
      "Practical data learning & career support | BuildMyCareer",
    ],
    [
      "/services/team/",
      "Developer sourcing & technical screening | BuildMyTeam",
    ],
    ["/developers/", "Developer introductions"],
    ["/privacy/", "Privacy & enquiries"],
    ["/projects/", "Working examples of reporting automation"],
    ["/projects/reporting-pipeline/", "Try a checked reporting workflow"],
    ["/resources/hiring-brief/", "Prepare a developer hiring brief"],
    ["/resources/reporting-readiness/", "Reporting automation readiness brief"],
  ];
  const linksToAudit = new Set();
  for (const [path, title] of routes) {
    for (const width of [320, 390, 768, 1440]) {
      const routePage = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await watch(routePage);
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
    record(
      `PASS ${path}: production entry, page metadata, one shared header/footer, readable contrast and no overflow at 320/390/768/1440px.`,
    );
  }

  const journey = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await watch(journey);
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
    await journey.locator("main .detail-actions a.button").first().click();
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
  await journey.locator("main .detail-actions a.button").first().click();
  await expect(journey.locator("#interest")).toHaveValue("developer");
  await journey.locator(".form-privacy a").click();
  await expect(journey).toHaveURL(`${url}/privacy/`);
  await journey.getByRole("link", { name: "Back to your enquiry" }).click();
  await expect(journey.locator("#interest")).toHaveValue("developer");
  for (const [field, expected] of Object.entries(draft))
    await expect(journey.locator(`#${field}`)).toHaveValue(expected);
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
    const response = await fetchWithinTimeout(target);
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
  console.log(
    "Checking report calculations, downloads and walkthrough playback...",
  );
  const demo = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await watch(demo);
  await demo.goto(`${url}/projects/reporting-pipeline/`);
  await demo.evaluate(() => {
    window.__events = [];
    window.addEventListener("buildmyx:analytics", (event) =>
      window.__events.push(event.detail),
    );
  });
  await demo.getByRole("button", { name: "Run checks & report" }).click();
  await expect(demo.locator(".report-totals")).toContainText("£4,200.00");
  await expect(demo.locator(".report-totals")).toContainText("£5,000.00");
  await expect(demo.locator(".computed-answer")).toContainText("19.0%");
  await demo
    .getByRole("button", { name: "View 5 source rows" })
    .first()
    .click();
  await expect(demo.locator("#source-0")).toBeFocused();
  assert.equal(await demo.locator(".source-highlight").count(), 5);
  await demo.getByRole("button", { name: "Review issues" }).click();
  await expect(demo.locator(".computed-answer")).toContainText(
    "Duplicate record ID",
  );
  await demo.getByRole("button", { name: "Row 13 / R007" }).click();
  await expect(demo.locator("#source-12")).toBeFocused();
  await demo
    .getByRole("textbox", { name: "Amount for row 1, R001", exact: true })
    .fill("1500.00");
  await expect(
    demo.getByRole("button", { name: "Download checked report" }),
  ).toBeDisabled();
  await expect(demo.locator(".demo-warning")).toContainText("Inputs changed");
  await demo.getByRole("button", { name: "Run checks & report" }).click();
  await expect(demo.locator(".report-totals")).toContainText("£4,500.00");
  await demo.setViewportSize({ width: 320, height: 900 });
  assert.ok(
    await demo.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await demo.screenshot({
    path: resolve(artifacts, "reporting-results-320.png"),
    fullPage: true,
  });
  await demo.setViewportSize({ width: 1440, height: 1000 });
  await demo.screenshot({
    path: resolve(artifacts, "reporting-results-1440.png"),
    fullPage: true,
  });
  const downloadEvent = demo.waitForEvent("download");
  await demo.getByRole("button", { name: "Download checked report" }).click();
  const download = await downloadEvent;
  assert.match(await readFile(await download.path(), "utf8"), /4500.00/);
  assert.ok(
    (await demo.evaluate(() => window.__events)).some(
      (event) => event.event === "example_run",
    ),
  );
  assert.ok(
    (await demo.evaluate(() => window.__events)).every(
      (event) => !JSON.stringify(event).includes("1500.00"),
    ),
  );
  await demo.getByRole("button", { name: "Reset sample" }).click();
  await expect(demo.locator(".demo-empty")).toBeVisible();
  assert.equal((await demo.request.get(`${url}/api/enquiry`)).status(), 200);
  assert.equal(
    (await (await demo.request.get(`${url}/api/enquiry`)).json()).enabled,
    false,
  );
  assert.equal(
    (await demo.request.post(`${url}/api/enquiry`, { data: {} })).status(),
    503,
  );
  const walkthrough = demo.locator("video");
  await walkthrough.scrollIntoViewIfNeeded();
  await walkthrough.evaluate(async (video) => {
    video.muted = true;
    await Promise.race([
      video.play(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Walkthrough playback did not start within 10 seconds (readyState=${video.readyState}, networkState=${video.networkState}, mediaError=${video.error?.message ?? "none"}).`,
              ),
            ),
          10000,
        ),
      ),
    ]);
  });
  await expect
    .poll(() => walkthrough.evaluate((video) => video.currentTime))
    .toBeGreaterThan(0.25);
  assert.equal(await walkthrough.evaluate((video) => video.videoWidth), 1280);
  await walkthrough.evaluate((video) => video.pause());
  await demo.close();
  const sending = await browser.newPage();
  await watch(sending);
  await sending.route("**/api/enquiry", async (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? { enabled: true }
          : {
              delivered: true,
              reference: "test-reference",
              confirmationSent: false,
            },
    }),
  );
  await sending.goto(`${url}/?interest=hiring#enquire`);
  await sending.locator("#name").fill("Example Visitor");
  await sending.locator("#email").fill("visitor@example.com");
  await sending
    .locator("#description")
    .fill("We need a developer for a reporting workflow.");
  await sending
    .getByRole("button", { name: "Send enquiry", exact: true })
    .click();
  await expect(sending.locator(".form-status")).toContainText(
    "submitted to BuildMyX",
  );
  await expect(sending.locator(".form-status")).toContainText(
    "don’t need to submit again",
  );
  await sending.close();
  record(
    "PASS working demo: real validation, editable calculations, stale-result protection, source navigation, CSV download, walkthrough playback and privacy-safe event hooks. PASS unconfigured API and mocked live confirmation flow; no real emails sent.",
  );
  assert.equal(
    (await fetchWithinTimeout(`${url}/opengraph-image`)).headers.get(
      "content-type",
    ),
    "image/png",
  );
  assert.equal((await fetchWithinTimeout(`${url}/sitemap.xml`)).status, 200);
  assert.equal((await fetchWithinTimeout(`${url}/robots.txt`)).status, 200);
  const humanUserAgent =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";
  const simulateHumanVisitor = () => {
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get: () => false,
    });
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      get: () => undefined,
    });
  };
  if (expectedPosthog === "1") {
    // PostHog intentionally filters HeadlessChrome; exercise a normal visitor.
    const analyticsPage = await browser.newPage({
      userAgent: humanUserAgent,
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await analyticsPage.addInitScript(simulateHumanVisitor);
    const captured = await watch(analyticsPage);
    await analyticsPage.goto(`${url}/?email=private@example.com#enquire`);
    await expect
      .poll(
        () => captured.filter((event) => event.event === "$pageview").length,
      )
      .toBeGreaterThan(0);
    const initial = captured.find((event) => event.event === "$pageview");
    assert.ok(initial.properties.token.startsWith("phc_"));
    assert.match(initial.properties.distinct_id, /^[a-f0-9-]{32,40}$/i);
    await analyticsPage.locator("#name").fill("Private Visitor");
    await analyticsPage.locator("#email").fill("private@example.com");
    await analyticsPage
      .locator("#description")
      .fill("Private project information that must never reach analytics.");
    await analyticsPage
      .locator(".desktop-nav")
      .getByRole("link", { name: "BuildMyAI", exact: true })
      .click();
    await expect
      .poll(
        () => captured.filter((event) => event.event === "service_view").length,
      )
      .toBeGreaterThan(0);
    await analyticsPage
      .locator("main .detail-actions a.button")
      .first()
      .click();
    await expect(analyticsPage.locator("#email")).toHaveValue(
      "private@example.com",
    );
    await expect
      .poll(
        () => captured.filter((event) => event.event === "cta_click").length,
      )
      .toBeGreaterThan(0);
    assert.ok(
      captured.every(
        (event) =>
          event.properties.distinct_id === initial.properties.distinct_id,
      ),
    );
    assert.doesNotMatch(
      JSON.stringify(captured),
      /Private Visitor|private@example|Private project|\$initial_current_url|\$referrer|\$set_once/,
    );
    assert.equal(
      await analyticsPage.evaluate(
        () => localStorage.length + sessionStorage.length,
      ),
      0,
    );
    assert.deepEqual(await analyticsPage.context().cookies(), []);
    captured.length = 0;
    await analyticsPage.reload();
    await expect
      .poll(
        () => captured.filter((event) => event.event === "$pageview").length,
      )
      .toBeGreaterThan(0);
    assert.notEqual(
      captured.find((event) => event.event === "$pageview").properties
        .distinct_id,
      initial.properties.distinct_id,
    );
    await analyticsPage.close();
    for (const preference of ["doNotTrack", "globalPrivacyControl"]) {
      const privatePage = await browser.newPage({ userAgent: humanUserAgent });
      await privatePage.addInitScript(simulateHumanVisitor);
      const privateEvents = await watch(privatePage);
      await privatePage.addInitScript(
        (name) =>
          Object.defineProperty(navigator, name, {
            configurable: true,
            get: () => (name === "doNotTrack" ? "1" : true),
          }),
        preference,
      );
      await privatePage.goto(`${url}/services/ai/`);
      await privatePage.waitForLoadState("networkidle");
      assert.deepEqual(
        privateEvents,
        [],
        `${preference} must prevent PostHog collection`,
      );
      await privatePage.close();
    }
    record(
      "PASS configured PostHog SDK: standard page views, required ingestion token, service/CTA funnel correlation, anonymous refresh reset, no form/query/referrer leakage, no cookies or browser storage, and both DNT/GPC opt-outs. All PostHog requests mocked; no test events sent remotely.",
    );
  }
  if (expectedPosthog === "0") {
    const unconfigured = await browser.newPage({ userAgent: humanUserAgent });
    await unconfigured.addInitScript(simulateHumanVisitor);
    const captured = await watch(unconfigured);
    await unconfigured.goto(`${url}/services/ai/`);
    await unconfigured.waitForLoadState("networkidle");
    assert.deepEqual(
      captured,
      [],
      "Unconfigured analytics must send no PostHog events",
    );
    assert.equal(
      await unconfigured.evaluate(
        () => localStorage.length + sessionStorage.length,
      ),
      0,
    );
    await unconfigured.close();
    record(
      "PASS unconfigured PostHog: no ingestion requests or browser storage for a normal visitor.",
    );
  }
  console.log("Checking delayed responses, retries and state transitions...");
  await checkStateMachines(browser, url, { push: record });
  const notFoundPage = await browser.newPage();
  const missing = await notFoundPage.goto(`${url}/a-page-that-does-not-exist/`);
  assert.equal(missing.status(), 404);
  await expect(notFoundPage.locator("main h1")).toHaveText(
    "Let’s find yournext step.",
  );
  await notFoundPage.close();
  record(
    "PASS cross-page enquiry journeys: manual hero selection survives navigation; service and developer routes preselect the right interest and preserve every draft field; privacy round trip preserves the draft; refresh clears it; no browser storage; all direct enquiry URLs work.",
  );
  record(
    "PASS homepage proof links connect to the working sample-data reporting workflow.",
  );
  record(
    "PASS all internal page and anchor links, route metadata and custom 404 recovery.",
  );
  assert.deepEqual(failures, [], "Browser errors or missing assets");
  record(
    "PASS no browser console errors, page errors, hydration errors or missing assets.",
  );
  await writeFile(resolve(artifacts, "report.txt"), report.join("\n") + "\n");
  console.log("Browser validation complete.");
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
