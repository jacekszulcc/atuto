/**
 * Jedyne miejsce odczytu dokumentu do podglądu/PDF.
 *
 * Czyta wyłącznie kolumny `numer, data_utworzenia, dane` z `dokumenty`.
 * Zero złączeń z `pracownicy`/`firmy` — snapshot w `dane` jest samowystarczalny
 * i jest jedynym źródłem treści dokumentu (patrz komentarz przy tej kolumnie
 * w supabase/schema.sql). Jeśli tu kiedyś pojawi się `.select()` na innej
 * tabeli w tej ścieżce, to błąd łamiący tę zasadę.
 */

import { serverClient } from "@/lib/supabase";
import { parseReferralSnapshot } from "./snapshot-guard";
import type { ReferralSnapshot } from "./types";

const TABLE_DOCUMENTS = "dokumenty";

export type GetDocumentResult =
  | {
      ok: true;
      numer: string;
      dataUtworzenia: string;
      dane: ReferralSnapshot;
      warnings: string[];
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "db_error"; detail: string }
  | { ok: false; reason: "invalid_snapshot"; detail: string };

export async function getDocument(id: string): Promise<GetDocumentResult> {
  const supabase = serverClient();

  const { data, error } = await supabase
    .from(TABLE_DOCUMENTS)
    .select("numer, data_utworzenia, dane")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "db_error", detail: error.message };
  }
  if (!data) {
    return { ok: false, reason: "not_found" };
  }

  const parsed = parseReferralSnapshot(data.dane);
  if (!parsed.ok) {
    return { ok: false, reason: "invalid_snapshot", detail: parsed.error };
  }

  return {
    ok: true,
    numer: data.numer,
    dataUtworzenia: data.data_utworzenia,
    dane: parsed.value,
    warnings: parsed.warnings,
  };
}
