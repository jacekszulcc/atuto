/**
 * Runtime-walidacja snapshotu przy odczycie z `dokumenty.dane` (jsonb).
 *
 * Baza nie gwarantuje kształtu jsonb — jedyne miejsce, w którym `unknown`
 * z bazy staje się typowanym `ReferralSnapshot`. Niekompletny/uszkodzony
 * wpis kończy się czytelnym błędem zamiast wyjątku gdzieś w środku renderu.
 */

import {
  SNAPSHOT_VERSION,
  type ExaminationType,
  type FactorCategory,
  type IdentifierType,
  type ReferralSnapshot,
} from "./types";

export type SnapshotParseResult =
  | { ok: true; value: ReferralSnapshot; warnings: string[] }
  | { ok: false; error: string };

const IDENTIFIER_TYPES: ReadonlySet<string> = new Set<IdentifierType>([
  "pesel",
  "dokument",
  "data_urodzenia",
]);

const FACTOR_CATEGORIES: ReadonlySet<string> = new Set<FactorCategory>([
  "I",
  "II",
  "III",
  "IV",
  "V",
]);

const EXAMINATION_TYPES: ReadonlySet<string> = new Set<ExaminationType>([
  "wstepne",
  "okresowe",
  "kontrolne",
]);

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseReferralSnapshot(value: unknown): SnapshotParseResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Snapshot dokumentu nie jest obiektem." };
  }

  if (value.schemaVersion !== SNAPSHOT_VERSION) {
    return {
      ok: false,
      error: `Nieobsługiwana wersja snapshotu: ${String(value.schemaVersion)}.`,
    };
  }

  if (!isString(value.legalBasis)) {
    return { ok: false, error: "Brak podstawy prawnej dokumentu." };
  }

  const employer = value.employer;
  if (!isRecord(employer) || !isString(employer.name) || !isString(employer.address)) {
    return { ok: false, error: "Brak lub niekompletne dane pracodawcy." };
  }

  const person = value.person;
  if (!isRecord(person)) {
    return { ok: false, error: "Brak danych osoby kierowanej na badania." };
  }
  if (!isString(person.fullName)) {
    return { ok: false, error: "Brak imienia i nazwiska osoby kierowanej." };
  }
  if (!isString(person.identifierType) || !IDENTIFIER_TYPES.has(person.identifierType)) {
    return { ok: false, error: "Nieznany typ identyfikatora osoby." };
  }
  if (!isString(person.identifier)) {
    return { ok: false, error: "Brak identyfikatora osoby." };
  }

  const address = person.address;
  if (
    !isRecord(address) ||
    !isString(address.city) ||
    !isNullableString(address.street) ||
    !isNullableString(address.houseNo) ||
    !isNullableString(address.flatNo)
  ) {
    return { ok: false, error: "Brak lub niekompletny adres osoby kierowanej." };
  }

  const position = value.position;
  if (!isRecord(position) || !isString(position.name) || !isString(position.description)) {
    return { ok: false, error: "Brak lub niekompletne dane stanowiska pracy." };
  }

  if (!Array.isArray(value.factors)) {
    return { ok: false, error: "Brak listy czynników szkodliwych." };
  }

  const factors: ReferralSnapshot["factors"] = [];
  for (let index = 0; index < value.factors.length; index++) {
    const raw = value.factors[index];
    if (!isRecord(raw)) {
      return { ok: false, error: `Czynnik #${index + 1} ma nieprawidłowy format.` };
    }
    if (!isString(raw.category) || !FACTOR_CATEGORIES.has(raw.category)) {
      return { ok: false, error: `Czynnik #${index + 1} ma nieznaną kategorię.` };
    }
    if (!isString(raw.name) || !isString(raw.exposureLevel)) {
      return { ok: false, error: `Czynnik #${index + 1} ma niekompletne dane.` };
    }
    factors.push({
      category: raw.category as FactorCategory,
      name: raw.name,
      exposureLevel: raw.exposureLevel,
    });
  }

  if (typeof value.factorCount !== "number") {
    return { ok: false, error: "Brak liczby czynników (factorCount)." };
  }

  if (!isString(value.examinationType) || !EXAMINATION_TYPES.has(value.examinationType)) {
    return { ok: false, error: "Nieznany rodzaj badania." };
  }

  if (!isString(value.issuePlace)) {
    return { ok: false, error: "Brak miejscowości wystawienia." };
  }

  if (!isString(value.issueDate)) {
    return { ok: false, error: "Brak daty wystawienia." };
  }

  // Niespójność factorCount vs. lista czynników nie blokuje renderu: snapshot
  // ma odtwarzać stan z chwili wystawienia, więc dokument raz wystawiony nie
  // może stać się nieczytelny, gdy wewnętrzna niespójność wyjdzie na jaw
  // później. Sygnalizujemy to jako ostrzeżenie, nie jako odmowę renderu.
  const warnings: string[] = [];
  if (value.factorCount !== factors.length) {
    warnings.push(
      `Zapisana liczba czynników (${value.factorCount}) różni się od liczby ` +
        `wpisów w tabeli (${factors.length}). Pokazano dokładnie to, co ` +
        `zapisano w chwili wystawienia dokumentu.`,
    );
  }

  return {
    ok: true,
    warnings,
    value: {
      schemaVersion: SNAPSHOT_VERSION,
      legalBasis: value.legalBasis,
      employer: { name: employer.name, address: employer.address },
      person: {
        fullName: person.fullName,
        identifierType: person.identifierType as IdentifierType,
        identifier: person.identifier,
        address: {
          city: address.city,
          street: address.street,
          houseNo: address.houseNo,
          flatNo: address.flatNo,
        },
      },
      position: { name: position.name, description: position.description },
      factors,
      factorCount: value.factorCount,
      examinationType: value.examinationType as ExaminationType,
      issuePlace: value.issuePlace,
      issueDate: value.issueDate,
    },
  };
}
