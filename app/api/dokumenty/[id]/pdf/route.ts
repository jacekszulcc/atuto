import { NextResponse } from "next/server";
import { getDocument } from "@/lib/referral/get-document";
import { renderDocumentHtml } from "@/lib/pdf/render-document";
import { renderPdf } from "@/lib/pdf/render";

// @sparticuz/chromium wymaga pełnego Node.js (fs, child_process) — nie edge.
export const runtime = "nodejs";

// Zimny start Chromium na Vercelu potrafi przekroczyć domyślny limit czasu
// funkcji i zwrócić timeout zamiast PDF-a.
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getDocument(id);

  if (!result.ok && result.reason === "not_found") {
    return NextResponse.json({ error: "Dokument nie istnieje." }, { status: 404 });
  }

  if (!result.ok && result.reason === "db_error") {
    return NextResponse.json(
      { error: `Błąd zapytania do bazy: ${result.detail}` },
      { status: 500 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: `Niekompletny snapshot dokumentu: ${result.detail}` },
      { status: 422 },
    );
  }

  const html = await renderDocumentHtml(result.numer, result.dane);
  const pdf = await renderPdf(html);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="skierowanie-${result.numer}.pdf"`,
    },
  });
}
