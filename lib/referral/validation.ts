/**
 * Client-side validation for the medical referral form.
 * Every message is keyed by field name so it renders next to its input.
 */

import type { ReferralFormData } from "./types";

export type FormErrors = Record<string, string>;

/** Error key for a factor row, e.g. "factor.a1.name". */
export function factorErrorKey(
  key: string,
  field: "name" | "exposureLevel",
): string {
  return `factor.${key}.${field}`;
}

const PESEL_WEIGHTS = [9, 7, 3, 1, 9, 7, 3, 1, 9, 7] as const;

/**
 * Suma iloczynów pierwszych 10 cyfr przez wagi, modulo 10, musi się równać
 * cyfrze kontrolnej. Zapis równoważny oficjalnej formule GUS (wagi 1,3,7,9…
 * i kontrola = (10 − suma%10) % 10), bo 9 ≡ −1, 7 ≡ −3, 3 ≡ −7, 1 ≡ −9 (mod 10).
 *
 * To jedyna walidacja w tym formularzu, której błąd ma realne skutki:
 * zły PESEL na skierowaniu oznacza odesłanie pracownika z przychodni.
 */
export function isValidPesel(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < PESEL_WEIGHTS.length; i++) {
    sum += PESEL_WEIGHTS[i] * Number(value[i]);
  }

  return sum % 10 === Number(value[10]);
}

/** Parses YYYY-MM-DD and rejects roll-over dates such as 2026-02-31. */
function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isReal ? date : null;
}

/** Today at 00:00 local time — comparisons are day-level, not timestamp-level. */
function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayIso(): string {
  const date = today();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function validateIdentifier(data: ReferralFormData): string | null {
  const value = data.identifier.trim();

  if (isBlank(value)) {
    switch (data.identifierType) {
      case "pesel":
        return "Podaj numer PESEL.";
      case "dokument":
        return "Podaj rodzaj i numer dokumentu tożsamości.";
      case "data_urodzenia":
        return "Podaj datę urodzenia.";
    }
  }

  switch (data.identifierType) {
    case "pesel":
      if (!/^\d{11}$/.test(value)) {
        return "PESEL musi składać się z dokładnie 11 cyfr.";
      }
      if (!isValidPesel(value)) {
        return "Niepoprawny numer PESEL — suma kontrolna się nie zgadza.";
      }
      return null;

    case "dokument":
      if (value.length < 3) {
        return "Podaj co najmniej 3 znaki — rodzaj i numer dokumentu.";
      }
      return null;

    case "data_urodzenia": {
      const date = parseDate(value);
      if (!date) return "Podaj poprawną datę urodzenia.";
      if (date.getTime() >= today().getTime()) {
        return "Data urodzenia musi być datą z przeszłości.";
      }
      return null;
    }
  }
}

export function validateForm(data: ReferralFormData): FormErrors {
  const errors: FormErrors = {};

  if (data.examinationType === "") {
    errors.examinationType = "Wybierz rodzaj badania.";
  }

  if (isBlank(data.issuePlace)) {
    errors.issuePlace = "Podaj miejscowość wystawienia.";
  }

  if (isBlank(data.issueDate)) {
    errors.issueDate = "Podaj datę wystawienia.";
  } else {
    const date = parseDate(data.issueDate);
    if (!date) {
      errors.issueDate = "Podaj poprawną datę wystawienia.";
    } else if (date.getTime() > today().getTime()) {
      errors.issueDate = "Data wystawienia nie może być z przyszłości.";
    }
  }

  if (isBlank(data.fullName)) {
    errors.fullName = "Podaj imię i nazwisko osoby kierowanej.";
  }

  const identifierError = validateIdentifier(data);
  if (identifierError) {
    errors.identifier = identifierError;
  }

  if (isBlank(data.addressCity)) {
    errors.addressCity = "Podaj miejscowość zamieszkania.";
  }

  if (isBlank(data.positionName)) {
    errors.positionName = "Podaj nazwę stanowiska pracy.";
  }

  if (isBlank(data.positionDescription)) {
    errors.positionDescription = "Opisz stanowisko pracy.";
  }

  if (data.factors.length === 0) {
    errors.factors = "Dodaj co najmniej jeden czynnik.";
  }

  for (const factor of data.factors) {
    if (isBlank(factor.name)) {
      errors[factorErrorKey(factor.key, "name")] = "Podaj nazwę czynnika.";
    }
    if (isBlank(factor.exposureLevel)) {
      errors[factorErrorKey(factor.key, "exposureLevel")] =
        "Podaj wielkość narażenia.";
    }
  }

  return errors;
}
