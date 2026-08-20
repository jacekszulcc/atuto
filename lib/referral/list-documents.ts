/**
 * Odczyt listy dokumentów.
 *
 * Czyta wyłącznie z `dokumenty` — kolumny plus pola wyciągnięte ze snapshotu
 * w `dane`. Zero złączeń z `pracownicy`/`firmy`, tak samo jak w getDocument():
 * snapshot jest jedynym źródłem treści dokumentu.
 */

import { serverClient } from "@/lib/supabase";
import { parseReferralSnapshot } from "./snapshot-guard";
import type { ExaminationType } from "./types";

const TABLE_DOCUMENTS = "dokumenty";

export interface DocumentListItem {
  id: string;
  numer: string;
  dataUtworzenia: string;
  fullName: string | null;
  examinationType: ExaminationType | null;
  /** Wypełnione tylko wtedy, gdy snapshot nie dał się odczytać. */
  snapshotError: string | null;
}

export type ListDocumentsResult =
  | { ok: true; items: DocumentListItem[] }
  | { ok: false; error: string };

export async function listDocuments(): Promise<ListDocumentsResult> {
  const supabase = serverClient();

  const { data, error } = await supabase
    .from(TABLE_DOCUMENTS)
    .select("id, numer, data_utworzenia, dane")
    .order("data_utworzenia", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const items = (data ?? []).map((row): DocumentListItem => {
    const parsed = parseReferralSnapshot(row.dane);

    // Uszkodzony snapshot degraduje pojedynczy wiersz, nie całą listę —
    // inaczej jeden zepsuty rekord zabrałby dostęp do wszystkich pozostałych.
    if (!parsed.ok) {
      return {
        id: row.id,
        numer: row.numer,
        dataUtworzenia: row.data_utworzenia,
        fullName: null,
        examinationType: null,
        snapshotError: parsed.error,
      };
    }

    return {
      id: row.id,
      numer: row.numer,
      dataUtworzenia: row.data_utworzenia,
      fullName: parsed.value.person.fullName,
      examinationType: parsed.value.examinationType,
      snapshotError: null,
    };
  });

  return { ok: true, items };
}
