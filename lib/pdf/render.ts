import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * Uruchamia Chromium: na Vercelu przez @sparticuz/chromium (binarka
 * skompilowana pod serverless Amazon Linux), lokalnie przez zainstalowaną
 * przeglądarkę wskazaną zmienną PUPPETEER_EXECUTABLE_PATH — binarka
 * sparticuz nie działa poza tym środowiskiem.
 */
async function launchBrowser() {
  const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (localExecutablePath) {
    return puppeteer.launch({
      executablePath: localExecutablePath,
      headless: true,
    });
  }

  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

/**
 * Renderuje gotowy dokument HTML (już z wstrzykniętym CSS) do PDF.
 * `preferCSSPageSize` oddaje wymiary strony i marginesy regule `@page`
 * w CSS dokumentu — bez tego Puppeteer nadpisałby je marginesem 0.
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
