const { test } = require("@playwright/test");

test("debug live vercel blank screen", async ({ page }) => {
  page.on("console", (msg) => {
    console.log(`console:${msg.type()}: ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.log(`pageerror: ${err.message}`);
  });

  const response = await page.goto("https://imk-market.vercel.app", { waitUntil: "networkidle" });
  console.log(`status:${response ? response.status() : "no-response"}`);
  console.log(`title:${await page.title()}`);
  await page.screenshot({ path: "vercel-debug-shot.png", fullPage: true });
});
