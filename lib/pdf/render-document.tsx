import { renderToStaticMarkup } from "react-dom/server.edge";
import SkierowanieWydruk from "@/components/SkierowanieWydruk";
import type { ReferralSnapshot } from "@/lib/referral/types";
import { inlineAppCss } from "./inline-css";

/**
 * Buduje samowystarczalny dokument HTML (SkierowanieWydruk + skompilowany
 * CSS aplikacji wstrzyknięty inline) do podania Puppeteerowi przez
 * page.setContent() — bez żadnego zapytania HTTP do własnej aplikacji.
 */
export async function renderDocumentHtml(
  numer: string,
  dane: ReferralSnapshot,
): Promise<string> {
  const documentHtml = renderToStaticMarkup(
    <SkierowanieWydruk numer={numer} dane={dane} />,
  );
  const css = await inlineAppCss();

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<style>${css}</style>
</head>
<body>${documentHtml}</body>
</html>`;
}
