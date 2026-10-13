import puppeteer, { type Browser } from "puppeteer";

let browser: Browser | null = null;

/**
 * Get or launch a shared headless browser.
 * Callers should NOT close this — it's managed per-session.
 * @throws Error with a helpful message if Chromium is not installed.
 */
export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
    });
  } catch (err: any) {
    const hint = err?.message?.includes("ENOENT") || err?.message?.includes("no such file")
      ? "Chromium is not installed. Run: npx puppeteer browsers install chrome"
      : `Failed to launch browser: ${err?.message}`;
    throw new Error(hint);
  }
  return browser;
}

/**
 * Shut down the shared browser. Call on session_shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // Already closed
    }
    browser = null;
  }
}
