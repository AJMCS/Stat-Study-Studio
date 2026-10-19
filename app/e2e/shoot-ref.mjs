// Screenshots a reference page for the design review: node e2e/shoot-ref.mjs <url> <outPrefix>
import { launchBrowser } from "./browser.mjs";
const [url, out] = process.argv.slice(2);
const browser = await launchBrowser();
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}-${name}.png` });
  await page.screenshot({ path: `${out}-${name}-full.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log("ok");
