/**
 * Medical referral (skierowanie na badania lekarskie) — form and snapshot types.
 * Printed template: annex 3a, Dz.U. 2023 poz. 607.
 *
 * Stored values stay in Polish because they are persisted in the database
 * and rendered on an official Polish form.
 */

export type ExaminationType = "wstepne" | "okresowe" | "kontrolne";

export type IdentifierType = "pesel" | "dokument" | "data_urodzenia";

export type FactorCategory = "I" | "II" | "III" | "IV" | "V";

export const EXAMINATION_TYPES: ReadonlyArray<{
  value: ExaminationType;
  label: string;
}> = [
  { value: "wstepne", label: "wstępne" },
  { value: "okresowe", label: "okresowe" },
  { value: "kontrolne", label: "kontrolne" },
];

export const IDENTIFIER_TYPES: ReadonlyArray<{
  value: IdentifierType;
  label: string;
  fieldLabel: string;
  placeholder: string;
}> = [
  {
    value: "pesel",
    label: "PESEL",
    fieldLabel: "Numer PESEL",
    placeholder: "11 cyfr",
  },
  {
    value: "dokument",
    label: "dokument tożsamości",
    fieldLabel: "Rodzaj i numer dokumentu tożsamości",
    placeholder: "np. dowód osobisty ABC 123456",
  },
  {
    value: "data_urodzenia",
    label: "data urodzenia",
    fieldLabel: "Data urodzenia",
    placeholder: "",
  },
];

export const FACTOR_CATEGORIES: ReadonlyArray<{
  value: FactorCategory;
  label: string;
}> = [
  { value: "I", label: "I. Czynniki fizyczne" },
  { value: "II", label: "II. Pyły" },
  { value: "III", label: "III. Czynniki chemiczne" },
  { value: "IV", label: "IV. Czynniki biologiczne" },
  { value: "V", label: "V. Inne czynniki, w tym niebezpieczne" },
];

/** One factor row in the form. */
export interface FactorRow {
  /** Stable key for React list rendering; never persisted. */
  key: string;
  category: FactorCategory;
  name: string;
  exposureLevel: string;
}

/** Full form state, before validation and before mapping to the snapshot. */
export interface ReferralFormData {
  examinationType: ExaminationType | "";
  issuePlace: string;
  issueDate: string;
  fullName: string;
  identifierType: IdentifierType;
  identifier: string;
  addressCity: string;
  addressStreet: string;
  addressHouseNo: string;
  addressFlatNo: string;
  positionName: string;
  positionDescription: string;
  factors: FactorRow[];
}

// --- Snapshot -------------------------------------------------------------
//
// Struktura zapisywana do `dokumenty.dane` (jsonb). To jedyne źródło treści
// dokumentu przy każdym późniejszym wydruku — nigdy złączenie z `pracownicy`.
// Dokument urzędowy raz wystawiony musi dać się odtworzyć w niezmienionej
// treści, także po zmianie adresu czy stanowiska pracownika.

/**
 * Version of the snapshot structure. Bump whenever the shape changes, so that
 * documents issued earlier can still be read with their original reader.
 */
export const SNAPSHOT_VERSION = 1 as const;

export const LEGAL_BASIS =
  "Załącznik nr 3a do rozporządzenia Ministra Zdrowia (Dz.U. 2023 poz. 607)";

/**
 * Klauzula prawna zapisywana w `dane.legalBasis` przy wystawieniu dokumentu.
 * Wydruk (SkierowanieWydruk) ma to zdanie na stałe w komponencie i go stąd
 * nie czyta — stała istnieje wyłącznie po to, żeby snapshot niósł tę samą
 * treść co ówczesny wydruk.
 */
export const SNAPSHOT_LEGAL_BASIS =
  "Działając na podstawie art. 229 § 4a ustawy z dnia 26 czerwca 1974 r. " +
  "– Kodeks pracy (Dz. U. z 2016 r. poz. 1666), kieruję na badania lekarskie:";

export interface AddressSnapshot {
  city: string;
  street: string | null;
  houseNo: string | null;
  flatNo: string | null;
}

export interface FactorSnapshot {
  category: FactorCategory;
  name: string;
  exposureLevel: string;
}

export interface ReferralSnapshot {
  schemaVersion: typeof SNAPSHOT_VERSION;
  /**
   * Pole zachowane dla zgodności snapshotów — nieużywane przy renderze.
   * SkierowanieWydruk ma tę klauzulę prawną na stałe w komponencie, nie
   * czyta jej z tego pola.
   */
  legalBasis: string;
  employer: {
    name: string;
    address: string;
  };
  person: {
    fullName: string;
    identifierType: IdentifierType;
    identifier: string;
    address: AddressSnapshot;
  };
  position: {
    name: string;
    description: string;
  };
  factors: FactorSnapshot[];
  /** Derived from `factors`, stored so a reprint never recomputes it. */
  factorCount: number;
  examinationType: ExaminationType;
  issuePlace: string;
  /** ISO date (YYYY-MM-DD). */
  issueDate: string;
}

/** Result returned by the save action to the form. */
export type SaveResult =
  | { ok: true; documentNumber: string }
  | { ok: false; error: string };
