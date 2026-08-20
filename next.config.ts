import type { NextConfig } from "next";

const CHROMIUM_BINARIES = "./node_modules/@sparticuz/chromium/bin/**/*";

const nextConfig: NextConfig = {
  /*
   * Obie paczki są już na domyślnej liście paczek zewnętrznych Next.js,
   * więc ten wpis niczego dziś nie zmienia. Zostaje jako zapis intencji:
   * chromium i puppeteer sięgają po API Node.js i pliki na dysku, więc nie
   * wolno ich wciągać do bundla, niezależnie od tego, co Next trzyma
   * na swojej liście w kolejnych wersjach.
   */
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  /*
   * Właściwa poprawka błędu "input directory /var/task/node_modules/
   * @sparticuz/chromium/bin does not exist" na Vercelu.
   *
   * Tracer Next.js wykrywa zależności po importach, a @sparticuz/chromium
   * czyta swoje archiwa .br w runtime po ścieżce. Nic ich nie importuje,
   * więc do paczki funkcji nie trafiały — na Lambdzie zostawał sam kod
   * paczki bez binarki. Lokalnie problem nie występował, bo tam ścieżka
   * prowadzi przez PUPPETEER_EXECUTABLE_PATH i zainstalowaną przeglądarkę.
   *
   * Klucze odpowiadają ścieżkom tras; nawiasy segmentu dynamicznego
   * wymagają escapowania.
   */
  outputFileTracingIncludes: {
    "/api/dokumenty/\\[id\\]/pdf": [CHROMIUM_BINARIES],
    "/api/dokumenty/\\[id\\]/wyslij": [CHROMIUM_BINARIES],
  },
};

export default nextConfig;
