import { chromium, devices } from "@playwright/test";
import { execSync } from "node:child_process";
const S = "/tmp/claude-0/-home-user-optimus-vintage/d9ef7ed9-1efc-5de9-a657-f8be40b5cfcf/scratchpad";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ ...devices["iPhone 14"], locale: "fr-FR" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE:", m.text().slice(0, 200)); });
await page.goto("http://127.0.0.1:3100/");
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => console.log("no controller yet"));
await page.waitForTimeout(2500);
console.log(await page.evaluate(async () => {
  const keys = await caches.keys();
  const off = await caches.match("/offline", { ignoreSearch: true });
  const off2 = await caches.match(new Request("/offline"), { ignoreVary: true, ignoreSearch: true });
  let n = 0; for (const k of keys) { const c = await caches.open(k); n += (await c.keys()).length; }
  return JSON.stringify({ keys, controller: !!navigator.serviceWorker.controller, offline: !!off, offline2: !!off2, entries: n });
}));
execSync("pkill -f 'next start' || true; pkill -f 'next-server' || true");
await new Promise((r) => setTimeout(r, 1500));
try { await page.goto("http://127.0.0.1:3100/app/stock", { timeout: 20000 }); } catch (e) { console.log("goto err", String(e).slice(0, 120)); }
await page.waitForTimeout(1000);
console.log("server down /app/stock →", page.url(), "|", (await page.textContent("h1").catch(() => "?"))?.slice(0, 80));
await page.screenshot({ path: `${S}/offline-real.png` });
try { await page.goto("http://127.0.0.1:3100/", { timeout: 20000 }); } catch (e) { console.log("goto / err", String(e).slice(0, 120)); }
await page.waitForTimeout(800);
console.log("server down / →", (await page.textContent("h1").catch(() => "?"))?.slice(0, 40));
await browser.close();
