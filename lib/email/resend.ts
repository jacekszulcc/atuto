import { Resend } from "resend";

/**
 * Klient Resend — wyłącznie po stronie serwera.
 *
 * Klucz API nie ma prefiksu NEXT_PUBLIC_, więc nie trafia do bundla
 * przeglądarki. Tworzony leniwie, żeby brak zmiennej środowiskowej nie
 * wywracał builda ani importu modułu, tylko zgłaszał się w momencie wysyłki.
 */

let cachedClient: Resend | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Brak zmiennej środowiskowej ${name}. Uzupełnij .env (wzór w .env.example).`,
    );
  }
  return value;
}

export function resendClient(): Resend {
  if (typeof window !== "undefined") {
    throw new Error(
      "resendClient() wywołany w przeglądarce — klucz API nie może opuścić serwera.",
    );
  }

  if (!cachedClient) {
    cachedClient = new Resend(requiredEnv("RESEND_API_KEY"));
  }

  return cachedClient;
}

export function senderAddress(): string {
  return requiredEnv("RESEND_FROM");
}
