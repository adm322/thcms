// Quick check: navigate to /trainer in a real browser and count reloads.
// If the page reloads more than 1-2 times in 5 seconds, the loop is back.
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login via API
  const loginRes = await page.request.post("http://localhost:3000/api/auth/login", {
    data: { email: "aisha@trainhub.my", password: "password123" },
    headers: { "Content-Type": "application/json" },
  });
  console.log("Login:", loginRes.status());

  // Count page navigations to /trainer
  let trainerLoadCount = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && frame.url().endsWith("/trainer")) {
      trainerLoadCount++;
      console.log(`  [${new Date().toISOString()}] /trainer navigated (count=${trainerLoadCount})`);
    }
  });

  // Capture any React warnings
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Can't perform a React state update") || text.includes("side-effect")) {
      console.log("  ⚠ React warning:", text.slice(0, 150));
    }
  });

  console.log("\n→ Navigate to /trainer");
  await page.goto("http://localhost:3000/trainer", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000); // wait 5s and see if it loops

  console.log(`\nTotal /trainer loads in 5s: ${trainerLoadCount}`);
  console.log(trainerLoadCount <= 2 ? "✓ No reload loop" : "✗ Reload loop detected");

  // Also test the studio page
  const programsRes = await page.request.get("http://localhost:3000/api/trainer/programs");
  const programs = await programsRes.json();
  const programId = programs[0].id;
  let studioLoadCount = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && frame.url().includes("/studio")) {
      studioLoadCount++;
      console.log(`  [${new Date().toISOString()}] /studio navigated (count=${studioLoadCount})`);
    }
  });

  console.log(`\n→ Navigate to /trainer/programs/${programId}/studio`);
  await page.goto(`http://localhost:3000/trainer/programs/${programId}/studio`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  console.log(`\nTotal /studio loads in 5s: ${studioLoadCount}`);
  console.log(studioLoadCount <= 2 ? "✓ No reload loop" : "✗ Reload loop detected");

  await page.screenshot({ path: "tests/no-loop.png" });
  console.log("\n✓ Screenshot saved: tests/no-loop.png");

  await browser.close();
})();
