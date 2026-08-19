import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Wczytuje skompilowany CSS aplikacji (Tailwind) z dysku i zwraca jako
 * jeden string do wstrzyknięcia w <style> dokumentu podawanego Puppeteerowi.
 *
 * Route PDF nie odpytuje własnej strony przez HTTP (round-trip + problem
 * z autoryzacją po Supabase Auth) — HTML do wydruku budujemy lokalnie przez
 * renderToStaticMarkup, więc klasy Tailwind same z siebie nic nie stylują.
 * Next zapisuje skompilowany CSS builda jako statyczne pliki pod .next/static
 * — czytamy je z dysku (zero sieci, ten sam proces serverless). Katalog
 * zależy od bundlera: webpack pisze do static/css, Turbopack do
 * static/chunks — przeszukujemy całe static/ rekurencyjnie, żeby nie
 * rozjechać się przy zmianie bundlera.
 *
 * W `next dev` style ekranowe potrafią iść przez HMR/JS zamiast statycznych
 * plików .css, więc ten katalog bywa pusty — PDF wygenerowany lokalnie w
 * trybie dev może wyjść bez stylów Tailwind. Do sprawdzenia wyglądu PDF
 * użyj `npm run build && npm run start`.
 */
export async function inlineAppCss(): Promise<string> {
  const staticDir = path.join(process.cwd(), ".next", "static");
  const cssFiles = await findCssFiles(staticDir);

  const contents = await Promise.all(
    cssFiles.map((file) => readFile(file, "utf8").catch(() => "")),
  );
  return contents.join("\n");
}

async function findCssFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findCssFiles(fullPath);
      return entry.name.endsWith(".css") ? [fullPath] : [];
    }),
  );

  return results.flat();
}
