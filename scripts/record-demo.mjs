import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve("work/demo-recording");
await mkdir(directory, { recursive: true });
await mkdir("public/demos", { recursive: true });
const reservation = createServer();
await new Promise((done) => reservation.listen(0, "127.0.0.1", done));
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
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
  { stdio: "ignore" },
);
const url = `http://127.0.0.1:${port}`;
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((done) => setTimeout(done, 200));
  }
  if (!ready) throw new Error("Production server did not become ready");
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    reducedMotion: "reduce",
    recordVideo: { dir: directory, size: { width: 1280, height: 820 } },
  });
  const page = await context.newPage();
  await page.goto(`${url}/projects/reporting-pipeline/`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".working-demo").scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    document
      .querySelector(".working-demo")
      .scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Run checks & report" }).click();
  await page.waitForTimeout(3500);
  await page.evaluate(() =>
    document
      .querySelector(".working-demo")
      .scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await page.screenshot({
    path: "public/demos/reporting-poster.jpg",
    type: "jpeg",
    quality: 85,
  });
  await page.getByRole("button", { name: "Review issues" }).click();
  await page.waitForTimeout(4500);
  await page.getByRole("button", { name: "Row 13 / R007" }).click();
  await page.waitForTimeout(3000);
  await page
    .getByRole("textbox", { name: "Amount for row 1, R001", exact: true })
    .fill("1500.00");
  await page.waitForTimeout(3500);
  await page.getByRole("button", { name: "Run checks & report" }).click();
  await page.getByRole("button", { name: "Compare weeks" }).click();
  await page.waitForTimeout(4000);
  await page
    .getByRole("button", { name: "View 5 source rows" })
    .first()
    .click();
  await page.waitForTimeout(4000);
  const video = page.video();
  await context.close();
  const input = await video.path();
  const encoder = spawn(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vf",
      "fps=24,scale=1280:-2",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      "public/demos/reporting-walkthrough.mp4",
    ],
    { stdio: "ignore" },
  );
  const code = await new Promise((done) => encoder.on("exit", done));
  if (code !== 0) throw new Error("Video encoding failed");
  await writeFile(
    "public/demos/reporting-captions.vtt",
    `WEBVTT

00:00.000 --> 00:03.500
A working reporting demo using editable, fictional data.

00:03.500 --> 00:07.000
Run validation: 10 accepted rows, 3 issues excluded from totals.

00:07.000 --> 00:12.000
Review a missing account, an invalid amount and a duplicate ID.

00:12.000 --> 00:15.500
Follow the duplicate issue to its exact source record.

00:15.500 --> 00:19.500
Edit a source amount. The previous report is marked out of date.

00:19.500 --> 00:24.000
Rerun: Week 1 is now £4,500 and Week 2 remains £5,000.

00:24.000 --> 00:30.000
Trace the new total to its five accepted source rows.
`,
  );
  console.log(
    "Recorded the actual demo, generated MP4, poster and English captions.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
