import { resendClient, senderAddress } from "./resend";

/**
 * Wysyłka gotowego skierowania jako załącznika PDF.
 *
 * Moduł nie generuje PDF-a ani nie czyta bazy — dostaje jedno i drugie
 * z trasy, żeby ścieżka generowania została ta sama co przy pobieraniu.
 */

export type SendReferralResult = { ok: true } | { ok: false; error: string };

/** Formatuje datę ISO (YYYY-MM-DD) na zapis polski, bez strefy czasowej. */
function formatIssueDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : isoDate;
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  // Celowo luźna reguła: jeden @, coś przed, kropka w domenie, bez spacji.
  // Ostatecznym sędzią poprawności adresu i tak jest serwer pocztowy.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export async function sendReferralEmail(
  recipient: string,
  documentNumber: string,
  issueDate: string,
  pdf: Buffer,
): Promise<SendReferralResult> {
  const formattedDate = formatIssueDate(issueDate);

  const text = [
    "Dzień dobry,",
    "",
    `w załączniku przesyłamy skierowanie na badania lekarskie nr ${documentNumber},`,
    `wystawione ${formattedDate}.`,
    "",
    "Wiadomość wygenerowana automatycznie.",
  ].join("\n");

  const html = [
    "<p>Dzień dobry,</p>",
    `<p>w załączniku przesyłamy skierowanie na badania lekarskie `,
    `nr <strong>${documentNumber}</strong>, wystawione ${formattedDate}.</p>`,
    "<p>Wiadomość wygenerowana automatycznie.</p>",
  ].join("");

  try {
    const { error } = await resendClient().emails.send({
      from: senderAddress(),
      to: recipient.trim(),
      subject: `Skierowanie na badania lekarskie ${documentNumber}`,
      text,
      html,
      attachments: [
        {
          filename: `skierowanie-${documentNumber}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    });

    if (error) {
      // Treść błędu Resend leci dalej do UI — inaczej nie da się odróżnić
      // złego klucza od niezweryfikowanej domeny czy odbiorcy spoza konta.
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (thrown) {
    return {
      ok: false,
      error: thrown instanceof Error ? thrown.message : "Nieznany błąd wysyłki.",
    };
  }
}
