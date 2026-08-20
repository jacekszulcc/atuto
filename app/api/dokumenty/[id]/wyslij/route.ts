import { NextResponse } from "next/server";
import { getDocument } from "@/lib/referral/get-document";
import { renderDocumentHtml } from "@/lib/pdf/render-document";
import { renderPdf } from "@/lib/pdf/render";
import { isValidEmail, sendReferralEmail } from "@/lib/email/send-referral";
import { checkSendLimit, clientIp } from "@/lib/email/rate-limit";

// @sparticuz/chromium wymaga pełnego Node.js (fs, child_process) — nie edge.
export const runtime = "nodejs";

// Wysyłka generuje PDF w locie, więc obowiązuje ten sam limit co przy
// pobieraniu — zimny start Chromium potrafi zająć kilkadziesiąt sekund.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let recipient: unknown;
  try {
    const body = await request.json();
    recipient = (body as { email?: unknown })?.email;
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe żądanie — oczekiwano JSON z polem `email`." },
      { status: 400 },
    );
  }

  if (typeof recipient !== "string" || !isValidEmail(recipient)) {
    return NextResponse.json(
      { error: "Podaj poprawny adres e-mail odbiorcy." },
      { status: 400 },
    );
  }

  // Limit sprawdzany po walidacji adresu, a przed jakąkolwiek kosztowną pracą:
  // literówka w mailu nie zjada wtedy limitu, a nadużycie i tak zatrzymuje się
  // przed generowaniem PDF-a i wywołaniem Resend.
  const limit = checkSendLimit(clientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

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

  // Generowanie PDF-a i wysyłka to dwa różne źródła awarii i dwa różne
  // komunikaty — inaczej "nie udało się wysłać" oznaczałoby też
  // nieuruchomionego Chromium, co wysyła szukającego w złą stronę.
  let pdf: Buffer;
  try {
    const html = await renderDocumentHtml(result.numer, result.dane);
    pdf = await renderPdf(html);
  } catch (thrown) {
    const detail = thrown instanceof Error ? thrown.message : String(thrown);
    return NextResponse.json(
      { error: `Nie udało się wygenerować PDF-a: ${detail}` },
      { status: 500 },
    );
  }

  const sent = await sendReferralEmail(
    recipient,
    result.numer,
    result.dane.issueDate,
    pdf,
  );

  if (!sent.ok) {
    return NextResponse.json(
      { error: `Resend odrzucił wysyłkę: ${sent.error}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, recipient: recipient.trim() });
}
