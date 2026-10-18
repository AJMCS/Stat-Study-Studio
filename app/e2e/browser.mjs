import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const CANDIDATES = {
  win32: [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ],
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
};

/** Launch a locally installed Chromium-family browser (set BROWSER_PATH to choose one). */
export async function launchBrowser() {
  const path = process.env.BROWSER_PATH ?? (CANDIDATES[process.platform] ?? []).find((p) => existsSync(p));
  if (!path) throw new Error("No Chrome, Edge or Chromium found. Set BROWSER_PATH to its executable.");
  return chromium.launch({ executablePath: path, headless: true });
}
