import assert from "node:assert/strict";
import { expect } from "@playwright/test";

const gate = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
async function until(predicate) {
  const deadline = Date.now() + 6000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error("Expected state transition did not occur");
    await new Promise((done) => setTimeout(done, 20));
  }
}

/** Controlled fault cases supplement the normal production-browser journeys. */
export async function checkStateMachines(browser, base, report) {
  const origin = new URL(base).origin;
  async function setup({
    enabled = true,
    get,
    post,
    clipboard = "success",
    clock = false,
  } = {}) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      ({ clipboard }) => {
        window.__stateEvents = [];
        window.addEventListener("buildmyx:analytics", (event) =>
          window.__stateEvents.push(event.detail),
        );
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: (text) => {
              window.__copiedMessage = text;
              if (clipboard === "pending")
                return new Promise((resolve, reject) => {
                  window.__rejectCopy = () =>
                    reject(new Error("Controlled clipboard denial"));
                });
              return Promise.resolve();
            },
          },
        });
      },
      { clipboard },
    );
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) {
        if (url.hostname.endsWith(".posthog.com"))
          return route.fulfill({
            status: 200,
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-headers": "*",
            },
            json: { status: 1, featureFlags: {} },
          });
        return route.abort();
      }
      if (url.pathname.replace(/\/$/, "") === "/api/enquiry") {
        if (route.request().method() === "GET")
          return get
            ? get(route)
            : route.fulfill({ status: 200, json: { enabled } });
        return post
          ? post(route)
          : route.fulfill({ status: 200, json: { delivered: false } });
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (clock) await page.clock.install();
    await page.goto(base);
    await page.locator("#name").waitFor();
    return { context, page, errors };
  }
  async function fill(page) {
    await page.locator("#name").fill("Example Visitor");
    await page.locator("#email").fill("visitor@example.test");
    await page
      .locator("#description")
      .fill("Please help automate our weekly reporting workflow.");
  }
  const send = (page) =>
    page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  const settled = (page) =>
    expect(page.locator("form.enquiry-form")).toHaveAttribute(
      "aria-busy",
      "false",
    );

  {
    const keys = [];
    const { context, page, errors } = await setup({
      post: (route) => {
        keys.push(route.request().headers()["idempotency-key"]);
        return route.fulfill({ json: { delivered: false } });
      },
    });
    try {
      await fill(page);
      await send(page);
      await expect(page.locator(".status-error")).toBeVisible();
      await send(page);
      await until(() => keys.length === 2);
      await settled(page);
      await page
        .getByRole("link", { name: "How your enquiry details are handled" })
        .click();
      await page.getByRole("link", { name: "Back to your enquiry" }).click();
      assert.equal(await page.locator("#name").inputValue(), "Example Visitor");
      await send(page);
      await until(() => keys.length === 3);
      await settled(page);
      assert.equal(new Set(keys).size, 1);
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: unchanged retries retain one ID across a privacy-page round trip.",
      );
    } finally {
      await context.close();
    }
  }
  {
    const response = gate();
    let payload;
    const { context, page, errors } = await setup({
      post: async (route) => {
        payload = route.request().postDataJSON();
        await response.promise;
        return route.fulfill({
          json: { delivered: true, confirmationSent: true },
        });
      },
    });
    try {
      await fill(page);
      await send(page);
      await until(() => payload);
      await page
        .locator("#description")
        .fill("New details that were not included in the outstanding request.");
      response.resolve();
      await settled(page);
      await expect(page.locator(".form-status")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Send enquiry", exact: true }),
      ).toBeEnabled();
      assert.notEqual(
        payload.description,
        await page.locator("#description").inputValue(),
      );
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: an older response cannot mark an edited draft submitted.",
      );
    } finally {
      response.resolve();
      await context.close();
    }
  }
  {
    const response = gate();
    let requests = 0;
    const { context, page, errors } = await setup({
      post: async (route) => {
        requests++;
        await response.promise;
        return route.fulfill({
          json: {
            delivered: true,
            confirmationSent: false,
            reference: "persisted-attempt",
          },
        });
      },
    });
    try {
      await fill(page);
      await send(page);
      await until(() => requests === 1);
      await page
        .getByRole("link", { name: "How your enquiry details are handled" })
        .click();
      await page.getByRole("link", { name: "Back to your enquiry" }).click();
      await expect(page.locator("form.enquiry-form")).toHaveAttribute(
        "aria-busy",
        "true",
      );
      response.resolve();
      await settled(page);
      await expect(page.locator(".form-status")).toContainText(
        "persisted-attempt",
      );
      await expect(
        page.getByRole("button", { name: "Enquiry submitted", exact: true }),
      ).toBeDisabled();
      assert.equal(requests, 1);
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: a pending send survives form remount, and receipt uncertainty stays successful.",
      );
    } finally {
      response.resolve();
      await context.close();
    }
  }
  {
    const { context, page, errors } = await setup({
      enabled: false,
      clipboard: "pending",
    });
    try {
      await fill(page);
      await page
        .getByRole("button", { name: "Copy enquiry", exact: true })
        .click();
      await page.waitForFunction(
        () => typeof window.__rejectCopy === "function",
      );
      await page
        .locator("#description")
        .fill(
          "Edited details while the clipboard permission request is pending.",
        );
      await page.evaluate(() => window.__rejectCopy());
      await settled(page);
      await expect(page.locator(".form-status")).toHaveCount(0);
      await expect(page.locator("#prepared-message")).toHaveCount(0);
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: a late clipboard denial cannot promise a missing prepared message.",
      );
    } finally {
      await context.close();
    }
  }
  {
    const response = gate();
    let requested = false;
    const { context, page, errors } = await setup({
      get: async (route) => {
        requested = true;
        await response.promise;
        return route.fulfill({ json: { enabled: true } });
      },
      post: (route) =>
        route.fulfill({ json: { delivered: true, confirmationSent: true } }),
    });
    try {
      await until(() => requested);
      await fill(page);
      await page
        .getByRole("button", { name: "Copy enquiry", exact: true })
        .click();
      await expect(page.locator(".prepared-message")).toBeVisible();
      response.resolve();
      await send(page);
      await expect(page.locator(".form-status")).toContainText(
        "submitted to BuildMyX",
      );
      await expect(page.locator(".prepared-message")).toHaveCount(0);
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: successful sending clears earlier copy instructions after late capability discovery.",
      );
    } finally {
      response.resolve();
      await context.close();
    }
  }
  {
    const { context, page, errors } = await setup();
    try {
      await fill(page);
      await send(page);
      await expect(page.locator(".status-error")).toBeVisible();
      await page.locator("#interest").selectOption("learning");
      await expect(page.locator(".form-status")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Copy enquiry instead" }),
      ).toHaveCount(0);
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: changing interest clears failure feedback and copy-fallback controls together.",
      );
    } finally {
      await context.close();
    }
  }
  {
    const first = gate();
    let probes = 0;
    const { context, page, errors } = await setup({
      clock: true,
      get: async (route) => {
        probes++;
        if (probes === 1) {
          await first.promise;
          return route.fulfill({ json: { enabled: false } }).catch(() => {});
        }
        return route.fulfill({ json: { enabled: true } });
      },
    });
    try {
      await until(() => probes === 1);
      await fill(page);
      await page.clock.runFor(5100);
      await expect(
        page.getByRole("button", { name: "check sending again" }),
      ).toBeVisible();
      first.resolve();
      await page.getByRole("button", { name: "check sending again" }).click();
      await expect(
        page.getByRole("button", { name: "Send enquiry", exact: true }),
      ).toBeVisible();
      assert.equal(await page.locator("#name").inputValue(), "Example Visitor");
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: capability discovery times out and can retry without losing the draft.",
      );
    } finally {
      first.resolve();
      await context.close();
    }
  }
  {
    const { context, page, errors } = await setup({
      enabled: false,
      clipboard: "pending",
      clock: true,
    });
    try {
      await fill(page);
      await page
        .getByRole("button", { name: "Copy enquiry", exact: true })
        .click();
      await page.waitForFunction(
        () => typeof window.__rejectCopy === "function",
      );
      await page.clock.runFor(15100);
      await settled(page);
      await expect(page.locator(".form-status")).toContainText(
        "copy it manually",
      );
      await expect(page.locator("#prepared-message")).toBeFocused();
      assert.equal(
        await page
          .locator("#prepared-message")
          .evaluate((node) => node.selectionEnd - node.selectionStart),
        (await page.locator("#prepared-message").inputValue()).length,
      );
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: clipboard timeout enters a complete, focused manual-copy state.",
      );
    } finally {
      await context.close();
    }
  }
  {
    const { context, page, errors } = await setup({ enabled: false });
    try {
      await fill(page);
      await page
        .getByRole("link", { name: "How your enquiry details are handled" })
        .click();
      await page.getByRole("link", { name: "Back to your enquiry" }).click();
      await page.locator("#email").focus();
      assert.equal(
        await page.evaluate(
          () =>
            window.__stateEvents.filter(
              (event) => event.event === "enquiry_start",
            ).length,
        ),
        1,
      );
      await page.goto(`${base}/projects/reporting-pipeline/`);
      await page.getByRole("button", { name: "Run checks & report" }).click();
      await page.getByRole("button", { name: "Review issues" }).click();
      await page.getByRole("button", { name: "Reset sample" }).click();
      await page.getByRole("button", { name: "Run checks & report" }).click();
      await expect(
        page.getByRole("button", { name: "Compare weeks" }),
      ).toHaveAttribute("aria-pressed", "true");
      assert.deepEqual(errors, []);
      report.push(
        "PASS state transitions: enquiry-start tracking is once per persistent draft; report Reset restores the default explanation.",
      );
    } finally {
      await context.close();
    }
  }
}
