"use server";

import { serverClient, testUserId } from "@/lib/supabase";
import { validateForm } from "./validation";
import {
  SNAPSHOT_LEGAL_BASIS,
  SNAPSHOT_VERSION,
  type ReferralFormData,
  type ReferralSnapshot,
  type SaveResult,
} from "./types";

// --- Mapowanie na bazę ----------------------------------------------------
// Jedyne miejsce w kodzie, które zna nazwy tabel i kolumn. Jeśli schemat
// w Supabase różni się od `supabase/schema.sql`, poprawki nanieś tutaj.

const TABLE_COMPANIES = "firmy";
const TABLE_EMPLOYEES = "pracownicy";
const TABLE_DOCUMENTS = "dokumenty";

const DOCUMENT_TYPE = "skierowanie_badania";
const DOCUMENT_STATUS = "wystawiony";
const NUMBER_PREFIX = "SK";

/** Postgres unique_violation — numer zajęty między odczytem a zapisem. */
const UNIQUE_VIOLATION = "23505";

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Builds the snapshot stored in `dokumenty.dane`.
 *
 * Snapshot jest kompletny i samowystarczalny — zawiera także dane pracodawcy
 * i pełny adres pracownika, żeby wydruk po latach dał dokładnie ten sam
 * dokument, niezależnie od późniejszych zmian w tabeli `pracownicy`.
 */
function buildSnapshot(
  data: ReferralFormData,
  employer: { name: string; address: string },
): ReferralSnapshot {
  if (data.examinationType === "") {
    throw new Error("Rodzaj badania nie został wybrany.");
  }

  const factors = data.factors.map((factor) => ({
    category: factor.category,
    name: factor.name.trim(),
    exposureLevel: factor.exposureLevel.trim(),
  }));

  return {
    schemaVersion: SNAPSHOT_VERSION,
    legalBasis: SNAPSHOT_LEGAL_BASIS,
    employer,
    person: {
      fullName: data.fullName.trim(),
      identifierType: data.identifierType,
      identifier: data.identifier.trim(),
      address: {
        city: data.addressCity.trim(),
        street: blankToNull(data.addressStreet),
        houseNo: blankToNull(data.addressHouseNo),
        flatNo: blankToNull(data.addressFlatNo),
      },
    },
    position: {
      name: data.positionName.trim(),
      description: data.positionDescription.trim(),
    },
    factors,
    factorCount: factors.length,
    examinationType: data.examinationType,
    issuePlace: data.issuePlace.trim(),
    issueDate: data.issueDate,
  };
}

/**
 * Next number in the SK-001 sequence, scoped to one company.
 *
 * Świadomie prosta sekwencja: odczyt najwyższego numeru i +1. Przy dwóch
 * równoczesnych zapisach obie próby mogą wyliczyć ten sam numer — łapie to
 * ograniczenie UNIQUE na kolumnie `numer`. Docelowo: sekwencja po stronie bazy.
 *
 * UWAGA — rozjazd ze schematem, świadomie zostawiony: numerujemy w ramach
 * firmy, ale w bazie `dokumenty.numer` jest unikalny GLOBALNIE
 * (`numer text not null unique`). Przy jednej firmie Fazy 1 to bez znaczenia;
 * druga firma wyliczyłaby własne SK-001 i zapis odbiłby się bezpowrotnie.
 * Decyzja: ograniczenie zmieniamy na `unique (firma_id, numer)` dopiero przy
 * wdrożeniu Supabase Auth, razem z resztą warstwy wielofirmowej.
 */
async function nextDocumentNumber(companyId: string): Promise<string> {
  const supabase = serverClient();

  const { data, error } = await supabase
    .from(TABLE_DOCUMENTS)
    .select("numer")
    .eq("firma_id", companyId)
    .eq("typ", DOCUMENT_TYPE);

  if (error) {
    throw new Error(`Nie udało się odczytać numeracji dokumentów: ${error.message}`);
  }

  // Rozbiór przez startsWith zamiast RegExp budowanego z szablonu: wzorzec
  // sklejany ze stałej wymagałby podwójnego escapowania i cicho przestałby
  // dopasowywać numery, a wtedy licznik wracałby do SK-001 przy każdym zapisie.
  const prefix = `${NUMBER_PREFIX}-`;
  const highest = (data ?? []).reduce((max, row) => {
    const value = String(row.numer ?? "");
    if (!value.startsWith(prefix)) return max;

    const sequence = value.slice(prefix.length);
    if (!/^\d+$/.test(sequence)) return max;

    return Math.max(max, Number(sequence));
  }, 0);

  return `${NUMBER_PREFIX}-${String(highest + 1).padStart(3, "0")}`;
}

export async function saveReferral(
  data: ReferralFormData,
): Promise<SaveResult> {
  // Server Action jest osiągalna zwykłym POST-em, więc walidacja po stronie
  // klienta nie wystarcza — te same reguły puszczamy jeszcze raz na serwerze.
  const errors = validateForm(data);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Formularz zawiera błędy — popraw zaznaczone pola." };
  }

  try {
    const supabase = serverClient();

    const { data: company, error: companyError } = await supabase
      .from(TABLE_COMPANIES)
      .select("id, nazwa, adres")
      .eq("user_id", testUserId())
      .single();

    if (companyError || !company) {
      return {
        ok: false,
        error:
          "Nie znaleziono firmy przypisanej do konta testowego. Sprawdź ATUTO_TEST_USER_ID i wiersz w tabeli `firmy`.",
      };
    }

    const identifier = data.identifier.trim();

    const employeeRow = {
      firma_id: company.id,
      imie_nazwisko: data.fullName.trim(),
      typ_identyfikatora: data.identifierType,
      identyfikator: identifier,
      miejscowosc: data.addressCity.trim(),
      ulica: blankToNull(data.addressStreet),
      nr_domu: blankToNull(data.addressHouseNo),
      nr_lokalu: blankToNull(data.addressFlatNo),
      // `pracownicy` trzyma stan bieżący, `dokumenty.dane` — stan z chwili
      // wystawienia. Te dwie wartości mogą się rozjechać i to jest zamierzone.
      stanowisko: data.positionName.trim(),
    };

    // Krok 1: pracownik o tym identyfikatorze już w tej firmie istnieje?
    const { data: existing, error: lookupError } = await supabase
      .from(TABLE_EMPLOYEES)
      .select("id")
      .eq("firma_id", company.id)
      .eq("identyfikator", identifier)
      .maybeSingle();

    if (lookupError) {
      return {
        ok: false,
        error: `Nie udało się sprawdzić pracownika w bazie: ${lookupError.message}`,
      };
    }

    let employeeId: string;

    if (existing) {
      employeeId = existing.id;
      const { error: updateError } = await supabase
        .from(TABLE_EMPLOYEES)
        .update(employeeRow)
        .eq("id", employeeId);

      if (updateError) {
        return {
          ok: false,
          error: `Nie udało się zaktualizować danych pracownika: ${updateError.message}`,
        };
      }
    } else {
      const { data: created, error: insertError } = await supabase
        .from(TABLE_EMPLOYEES)
        .insert(employeeRow)
        .select("id")
        .single();

      if (insertError || !created) {
        return {
          ok: false,
          error: `Nie udało się zapisać pracownika: ${insertError?.message ?? "brak odpowiedzi z bazy"}`,
        };
      }
      employeeId = created.id;
    }

    // Krok 2 i 3: numer w ramach firmy, potem dokument ze snapshotem.
    const documentNumber = await nextDocumentNumber(company.id);
    const snapshot = buildSnapshot(data, {
      name: company.nazwa,
      address: company.adres,
    });

    const { error: documentError } = await supabase
      .from(TABLE_DOCUMENTS)
      .insert({
        firma_id: company.id,
        pracownik_id: employeeId,
        typ: DOCUMENT_TYPE,
        numer: documentNumber,
        status: DOCUMENT_STATUS,
        url_pliku: null,
        dane: snapshot,
      });

    if (documentError) {
      if (documentError.code === UNIQUE_VIOLATION) {
        return {
          ok: false,
          error: `Numer ${documentNumber} jest już zajęty. Jeśli powtórzenie zapisu nie pomaga, numeracja zderzyła się z inną firmą — patrz uwaga przy nextDocumentNumber.`,
        };
      }
      return {
        ok: false,
        error: `Nie udało się zapisać dokumentu: ${documentError.message}`,
      };
    }

    return { ok: true, documentNumber };
  } catch (thrown) {
    return {
      ok: false,
      error:
        thrown instanceof Error
          ? thrown.message
          : "Nieznany błąd podczas zapisu.",
    };
  }
}
