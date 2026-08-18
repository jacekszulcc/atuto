import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Używa klucza service_role, który POMIJA polityki RLS. Powód: tabele mają
 * RLS oparty o auth.uid(), a Faza 1 nie ma logowania — zapytanie z kluczem
 * anonimowym zostałoby przez RLS odrzucone. Dlatego zapis biegnie wyłącznie
 * w Server Action, a klucz nigdy nie trafia do przeglądarki (brak prefiksu
 * NEXT_PUBLIC_). Po wprowadzeniu Supabase Auth ten moduł zastąpi klient
 * sesyjny i RLS zacznie realnie chronić dane.
 */

let cachedClient: SupabaseClient | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Brak zmiennej środowiskowej ${name}. Uzupełnij .env.local (wzór w .env.example).`,
    );
  }
  return value;
}

export function serverClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverClient() wywołany w przeglądarce — klucz service_role nie może opuścić serwera.",
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  return cachedClient;
}

export function testUserId(): string {
  return requiredEnv("ATUTO_TEST_USER_ID");
}
