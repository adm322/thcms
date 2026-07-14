// Playwright end-to-end test of the PPT HTML generator + error interceptor.
// Bypasses UI login (calls /api/auth/login directly for session cookie),
// then drives the browser through program → studio page → error triggering.
//
// Run: node tests/playwright-ppt-generator.cjs
// Requires:
//   - dev server running on http://localhost:3000
//   - chrome-log-server running on http://localhost:3100
//   - a seeded trainer (aisha@trainhub.my / password123)

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const LOG_FILE = path.join(__dirname, "..", "chrome-log-server", "logs", "latest.log");

async function readLogTail(n = 10) {
  try {
    const text = fs.readFileSync(LOG_FILE, "utf8");
    return text.split("\n").filter(Boolean).slice(-n);
  } catch (e) {
    return [`(could not read log: ${e.message})`];
  }
}

async function waitForLogEntry(matcher, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tail = await readLogTail(50);
    if (tail.some((line) => matcher(line))) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

(async () => {
  console.log("=== Starting Playwright test ===\n");
  console.log("Log file:", LOG_FILE);
  console.log("Pre-test log tail:", await readLogTail(3));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;
  function record(name, ok) {
    if (ok) { testsPassed++; console.log("  ✓ " + name); }
    else    { testsFailed++; console.log("  ✗ " + name); }
  }

  // Capture console output
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error") {
      console.log("  [browser error]", msg.text().slice(0, 200));
    }
  });
  page.on("pageerror", (err) => {
    console.log("  [browser pageerror]", err.message);
  });

  try {
    // ── 1) Get a real program ID via API ────────────────────────────────
    console.log("→ Step 1: Login via API and get a real program ID");

    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: "aisha@trainhub.my", password: "password123" },
      headers: { "Content-Type": "application/json" },
    });
    if (loginRes.status() !== 200) {
      throw new Error(`Login failed: ${loginRes.status()} - ${await loginRes.text()}`);
    }
    const user = await loginRes.json();
    console.log("  ✓ Logged in as", user.email, "(role:", user.role + ")");

    const programsRes = await page.request.get(`${BASE}/api/trainer/programs`);
    const programs = await programsRes.json();
    if (!Array.isArray(programs) || programs.length === 0) {
      throw new Error("No programs found for trainer");
    }
    const program = programs[0];
    console.log("  ✓ Found program:", program.title, "(id:", program.id + ")");

    // ── 2) Load studio page ────────────────────────────────────────────
    console.log("\n→ Step 2: Load studio page");
    const studioUrl = `${BASE}/trainer/programs/${program.id}/studio`;
    await page.goto(studioUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Give the page time to fully render
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log("  Page title:", title);
    const pageText = (await page.textContent("body"))?.slice(0, 200) ?? "";
    console.log("  Page text (first 200):", pageText);
    record("Studio page loaded", pageText.includes("Studio") || pageText.includes("Upload") || pageText.includes("Learning"));

    // ── 3) Verify interceptor installed ────────────────────────────────
    console.log("\n→ Step 3: Verify interceptor installed in browser");
    const installed = await page.evaluate(() => window.__chromeLogServerInstalled);
    record("window.__chromeLogServerInstalled === true", installed === true);

    const readySeen = await waitForLogEntry((line) => line.includes("Interceptor Ready"), 8000);
    record("'Interceptor Ready' event in log", readySeen);

    // ── 4) Trigger errors in the browser ───────────────────────────────
    console.log("\n→ Step 4: Trigger errors in browser to test interceptor");

    // 4a) JS Error - use setTimeout so it becomes an "uncaught" error event
    //      (immediate throws inside page.evaluate are caught by Playwright)
    console.log("  → 4a) throw new Error('playwright-js-error-test') [async]");
    await page.evaluate(() => {
      // Throw asynchronously so it escapes the try/catch
      setTimeout(() => { throw new Error("playwright-js-error-test"); }, 50);
    });
    const jsErrorSeen = await waitForLogEntry(
      (line) => line.includes("playwright-js-error-test"),
      5000
    );
    record("JS error landed in log", jsErrorSeen);

    // 4b) Promise rejection
    console.log("  → 4b) Promise.reject('playwright-promise-test')");
    await page.evaluate(() => {
      Promise.reject("playwright-promise-test");
    });
    await new Promise((r) => setTimeout(r, 500));
    const promiseSeen = await waitForLogEntry(
      (line) => line.includes("playwright-promise-test"),
      5000
    );
    record("Promise rejection landed in log", promiseSeen);

    // 4c) Network failure
    console.log("  → 4c) fetch('http://localhost:9999/nope')");
    await page.evaluate(() => {
      fetch("http://localhost:9999/nope").catch(() => {});
    });
    const networkSeen = await waitForLogEntry(
      (line) => line.includes("Network Failure"),
      5000
    );
    record("Network failure landed in log", networkSeen);

    // 4d) Test PPT export endpoints (auth + reachability)
    console.log("\n→ Step 5: Test PPT/PDF/HTML export endpoints");
    const pptxRes = await page.request.get(`${BASE}/api/trainer/programs/${program.id}/studio/export/pptx`);
    const pdfRes = await page.request.get(`${BASE}/api/trainer/programs/${program.id}/studio/export/pdf`);
    const htmlRes = await page.request.get(`${BASE}/api/trainer/programs/${program.id}/studio/export/html`);
    // Acceptable: 200 (studio exists) or 404 (no studio). NOT acceptable: 401/403/500.
    const acceptable = (s) => s === 200 || s === 404;
    record("PPTX export reachable (200 or 404)", acceptable(pptxRes.status()));
    record("PDF export reachable (200 or 404)", acceptable(pdfRes.status()));
    record("HTML export reachable (200 or 404)", acceptable(htmlRes.status()));
    console.log("  PPTX:", pptxRes.status(), "| PDF:", pdfRes.status(), "| HTML:", htmlRes.status());

    if (pptxRes.status() === 200) {
      const ct = pptxRes.headers()["content-type"] || "";
      record("PPTX has correct content-type", ct.includes("presentationml"));
      const buf = await pptxRes.body();
      record("PPTX is a valid ZIP file", buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04);
      console.log("  PPTX body size:", buf.length, "bytes, content-type:", ct);
    }
    if (pdfRes.status() === 200) {
      const ct = pdfRes.headers()["content-type"] || "";
      record("PDF has correct content-type", ct === "application/pdf");
      const buf = await pdfRes.body();
      const head = buf.slice(0, 4).toString("ascii");
      record("PDF starts with %PDF", head === "%PDF");
      console.log("  PDF body size:", buf.length, "bytes, magic:", head);
    }
    if (htmlRes.status() === 200) {
      const ct = htmlRes.headers()["content-type"] || "";
      record("HTML has correct content-type", ct.includes("text/html"));
      const buf = await htmlRes.body();
      const head = buf.slice(0, 50).toString("ascii");
      record("HTML starts with <!DOCTYPE", head.startsWith("<!DOCTYPE"));
      console.log("  HTML body size:", buf.length, "bytes, starts with:", head.slice(0, 30));
    }

    // ── 5) Screenshot ──────────────────────────────────────────────────
    await page.screenshot({ path: "tests/studio-page.png", fullPage: false });
    console.log("\n  ✓ Screenshot saved: tests/studio-page.png");

    // ── 6) Show log tail ───────────────────────────────────────────────
    console.log("\n→ Log tail (most recent first):");
    const tail = await readLogTail(20);
    tail.forEach((line) => console.log("  " + line));

    // ── 7) Summary ─────────────────────────────────────────────────────
    console.log("\n=== SUMMARY ===");
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    const allOk = testsFailed === 0;
    console.log("\n" + (allOk ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED"));
    process.exitCode = allOk ? 0 : 1;
  } catch (err) {
    console.error("\n✗ TEST FAILED:", err.message);
    await page.screenshot({ path: "tests/error-page.png", fullPage: false });
    console.error("Error screenshot saved: tests/error-page.png");
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
