/**
 * Seed bazy demonstracyjnej Atuto.
 *
 * Czyści firmy/pracowników/dokumenty i wstawia komplet danych fikcyjnych.
 * Idempotentny: każde uruchomienie kasuje wszystko i odtwarza ten sam stan,
 * więc numeracja skierowań startuje od SK-001 za każdym razem.
 *
 * URUCHOMIENIE
 *   npx tsx scripts/seed-demo.ts            <- dry run: pokazuje plan, NIC nie zmienia
 *   npx tsx scripts/seed-demo.ts --force    <- wykonuje czyszczenie i seed
 *
 * Wymaga .env (lub .env.local) z NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY i ATUTO_TEST_USER_ID.
 *
 * CZYSZCZENIE
 * Skrypt kasuje przez DELETE w kolejności dokumenty -> pracownicy -> firmy,
 * bo PostgREST nie wykonuje DDL i TRUNCATE przez klienta Supabase nie przejdzie.
 * Wariant ręczny, do wklejenia w Supabase Studio -> SQL Editor:
 *
 *   truncate table public.dokumenty, public.pracownicy, public.firmy
 *     restart identity cascade;
 *
 * (RESTART IDENTITY jest tu bez znaczenia — klucze główne to uuid
 * z gen_random_uuid(), w schemacie nie ma żadnej sekwencji ani kolumny serial.)
 *
 * DOKUMENTY
 * Skierowania powstają przez saveReferral — tę samą Server Action, której
 * używa formularz. Ręczny INSERT do `dokumenty` rozjechałby snapshoty
 * z tym, co produkuje realna ścieżka aplikacji.
 *
 * TREŚĆ MERYTORYCZNA
 * Stanowiska i czynniki poniżej są wypełniaczem demonstracyjnym, nie
 * rekomendacją BHP. Do zastąpienia treścią od właściciela.
 */

import { createClient } from "@supabase/supabase-js";
import { saveReferral } from "../lib/referral/save";
import type {
  ExaminationType,
  FactorCategory,
  IdentifierType,
  ReferralFormData,
} from "../lib/referral/types";

// .env nie jest wczytywany automatycznie poza runtime'em Next.
try {
  process.loadEnvFile(".env");
} catch {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Zmienne mogą już siedzieć w środowisku — sprawdzamy je niżej.
  }
}

const FORCE = process.argv.includes("--force");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.ATUTO_TEST_USER_ID;

if (!URL || !KEY || !USER_ID) {
  console.error(
    "Brak zmiennych środowiskowych. Wymagane: NEXT_PUBLIC_SUPABASE_URL, " +
      "SUPABASE_SERVICE_ROLE_KEY, ATUTO_TEST_USER_ID (wzór w .env.example).",
  );
  process.exit(1);
}

const supabase = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- PESEL-e demonstracyjne ------------------------------------------------

const PESEL_WEIGHTS = [9, 7, 3, 1, 9, 7, 3, 1, 9, 7];

/**
 * Dokleja poprawną cyfrę kontrolną do 10 cyfr numeru.
 *
 * Numery demo mają w pozycji dnia urodzenia wartość 32 — dzień, który
 * nie istnieje w żadnym miesiącu. Dzięki temu suma kontrolna się zgadza
 * i walidacja formularza przechodzi (sprawdza 11 cyfr i sumę, nie datę),
 * ale numer z definicji nie może należeć do żadnej realnej osoby.
 */
function demoPesel(first10: string): string {
  if (!/^\d{10}$/.test(first10)) {
    throw new Error(`demoPesel: oczekiwano 10 cyfr, dostałem "${first10}"`);
  }
  let sum = 0;
  for (let i = 0; i < PESEL_WEIGHTS.length; i++) {
    sum += PESEL_WEIGHTS[i] * Number(first10[i]);
  }
  return first10 + String(sum % 10);
}

// --- Dane fikcyjne ---------------------------------------------------------

const DEMO_COMPANY = {
  user_id: USER_ID,
  nazwa: "Kontur Biuro Sp. z o.o.",
  adres: "ul. Przykładowa 7, 00-001 Warszawa",
  // NIP zostaje pusty: numer z poprawną sumą kontrolną mógłby trafić
  // w istniejący podmiot, a demo go nie potrzebuje.
  nip: null as string | null,
};

interface DemoEmployee {
  fullName: string;
  identifierType: IdentifierType;
  identifier: string;
  addressCity: string;
  addressStreet: string;
  addressHouseNo: string;
  addressFlatNo: string;
  positionName: string;
}

const EMPLOYEES: DemoEmployee[] = [
  {
    // 71-08-32 -> sierpień 1971, dzień 32 (nie istnieje)
    fullName: "Anna Wiśniewska",
    identifierType: "pesel",
    identifier: demoPesel("7108320002"),
    addressCity: "Warszawa",
    addressStreet: "Kwiatowa",
    addressHouseNo: "3",
    addressFlatNo: "12",
    positionName: "Specjalista ds. administracji",
  },
  {
    // 89-11-32 -> listopad 1989, dzień 32
    fullName: "Marek Zawadzki",
    identifierType: "pesel",
    identifier: demoPesel("8911320015"),
    addressCity: "Warszawa",
    addressStreet: "Polna",
    addressHouseNo: "18",
    addressFlatNo: "",
    positionName: "Magazynier",
  },
  {
    // 03-25-32 -> miesiąc 25 = maj 2003 (kodowanie XXI w.), dzień 32
    fullName: "Katarzyna Dąbrowska",
    identifierType: "pesel",
    identifier: demoPesel("0325320024"),
    addressCity: "Piaseczno",
    addressStreet: "Leśna",
    addressHouseNo: "44",
    addressFlatNo: "2",
    positionName: "Pracownik obsługi zamówień",
  },
  {
    fullName: "Tomasz Lewandowski",
    identifierType: "dokument",
    identifier: "dowód osobisty ZZZ 000000",
    addressCity: "Pruszków",
    addressStreet: "Ogrodowa",
    addressHouseNo: "9",
    addressFlatNo: "",
    positionName: "Kurier wewnętrzny",
  },
  {
    fullName: "Paweł Górski",
    identifierType: "data_urodzenia",
    identifier: "1979-03-14",
    addressCity: "Warszawa",
    addressStreet: "Sosnowa",
    addressHouseNo: "27",
    addressFlatNo: "5",
    positionName: "Pracownik biurowy",
  },
];

interface DemoReferral {
  employee: DemoEmployee;
  examinationType: ExaminationType;
  positionDescription: string;
  factors: Array<{ category: FactorCategory; name: string; exposureLevel: string }>;
}

const REFERRALS: DemoReferral[] = [
  {
    employee: EMPLOYEES[0],
    examinationType: "wstepne",
    positionDescription:
      "Praca biurowa przy komputerze, obsługa korespondencji i dokumentacji, " +
      "8 godzin dziennie w pozycji siedzącej.",
    factors: [
      { category: "V", name: "Praca przy monitorze ekranowym", exposureLevel: "powyżej 4 h dziennie" },
      { category: "I", name: "Oświetlenie sztuczne", exposureLevel: "500 lx" },
    ],
  },
  {
    employee: EMPLOYEES[1],
    examinationType: "okresowe",
    positionDescription:
      "Przyjmowanie i wydawanie towaru, ręczne prace transportowe, " +
      "kompletowanie zamówień, 8 godzin dziennie.",
    factors: [
      { category: "V", name: "Ręczne prace transportowe", exposureLevel: "do 25 kg jednorazowo" },
      { category: "I", name: "Hałas", exposureLevel: "78 dB(A)" },
      { category: "II", name: "Pył papierniczy", exposureLevel: "poniżej NDS" },
    ],
  },
  {
    employee: EMPLOYEES[3],
    examinationType: "wstepne",
    positionDescription:
      "Przewóz przesyłek między oddziałami, prowadzenie samochodu " +
      "do 3,5 t, załadunek i rozładunek.",
    factors: [
      { category: "I", name: "Wibracja ogólna", exposureLevel: "poniżej NDN" },
      { category: "V", name: "Prowadzenie pojazdu służbowego", exposureLevel: "do 5 h dziennie" },
    ],
  },
  {
    employee: EMPLOYEES[4],
    examinationType: "kontrolne",
    positionDescription:
      "Obsługa sekretariatu, praca przy komputerze, kontakt z klientem, " +
      "8 godzin dziennie.",
    factors: [
      { category: "V", name: "Praca przy monitorze ekranowym", exposureLevel: "powyżej 4 h dziennie" },
      { category: "III", name: "Toner drukarski", exposureLevel: "śladowe" },
    ],
  },
];

const ISSUE_PLACE = "Warszawa";
const ISSUE_DATE = "2026-08-20";

function toFormData(referral: DemoReferral): ReferralFormData {
  const e = referral.employee;
  return {
    examinationType: referral.examinationType,
    issuePlace: ISSUE_PLACE,
    issueDate: ISSUE_DATE,
    fullName: e.fullName,
    identifierType: e.identifierType,
    identifier: e.identifier,
    addressCity: e.addressCity,
    addressStreet: e.addressStreet,
    addressHouseNo: e.addressHouseNo,
    addressFlatNo: e.addressFlatNo,
    positionName: e.positionName,
    positionDescription: referral.positionDescription,
    factors: referral.factors.map((f, index) => ({
      key: `seed-${index}`,
      category: f.category,
      name: f.name,
      exposureLevel: f.exposureLevel,
    })),
  };
}

// --- Wykonanie -------------------------------------------------------------

async function countRows(table: string): Promise<number | string> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return error ? `błąd: ${error.message}` : (count ?? 0);
}

async function deleteAll(table: string): Promise<void> {
  // PostgREST wymaga filtra przy DELETE — ten dopasowuje każdy wiersz.
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) {
    throw new Error(`Nie udało się wyczyścić tabeli ${table}: ${error.message}`);
  }
}

async function main(): Promise<void> {
  console.log(`Projekt Supabase: ${URL}`);
  console.log(`Konto demo:       ${USER_ID}\n`);

  console.log("Stan przed:");
  for (const table of ["firmy", "pracownicy", "dokumenty"]) {
    console.log(`  ${table.padEnd(12)} ${await countRows(table)}`);
  }

  console.log("\nDo wstawienia:");
  console.log(`  firma:       ${DEMO_COMPANY.nazwa}, ${DEMO_COMPANY.adres}`);
  console.log(`  pracownicy:  ${EMPLOYEES.length}`);
  for (const e of EMPLOYEES) {
    console.log(`     - ${e.fullName.padEnd(22)} [${e.identifierType}] ${e.identifier}`);
  }
  console.log(`  skierowania: ${REFERRALS.length} (przez saveReferral)`);

  if (!FORCE) {
    console.log(
      "\nDRY RUN — nic nie zmieniono.\n" +
        "Uruchom z --force, żeby wyczyścić bazę i wstawić powyższe dane.",
    );
    return;
  }

  console.log("\nCzyszczenie (dokumenty -> pracownicy -> firmy)...");
  for (const table of ["dokumenty", "pracownicy", "firmy"]) {
    await deleteAll(table);
    console.log(`  ${table} wyczyszczone`);
  }

  console.log("\nWstawianie firmy demo...");
  const { data: company, error: companyError } = await supabase
    .from("firmy")
    .insert(DEMO_COMPANY)
    .select("id, nazwa")
    .single();
  if (companyError || !company) {
    throw new Error(`Nie udało się wstawić firmy: ${companyError?.message ?? "brak odpowiedzi"}`);
  }
  console.log(`  ${company.nazwa} (${company.id})`);

  // Pracownicy wchodzą wprost do tabeli, bo dwoje z nich nie ma skierowania.
  // Dla pozostałych saveReferral znajdzie istniejący wiersz po identyfikatorze
  // i go zaktualizuje, zamiast tworzyć duplikat — tak działa realna ścieżka.
  console.log("\nWstawianie pracowników...");
  const { error: employeesError } = await supabase.from("pracownicy").insert(
    EMPLOYEES.map((e) => ({
      firma_id: company.id,
      imie_nazwisko: e.fullName,
      typ_identyfikatora: e.identifierType,
      identyfikator: e.identifier,
      miejscowosc: e.addressCity,
      ulica: e.addressStreet || null,
      nr_domu: e.addressHouseNo || null,
      nr_lokalu: e.addressFlatNo || null,
      stanowisko: e.positionName,
    })),
  );
  if (employeesError) {
    throw new Error(`Nie udało się wstawić pracowników: ${employeesError.message}`);
  }
  console.log(`  ${EMPLOYEES.length} pracowników`);

  console.log("\nWystawianie skierowań przez saveReferral...");
  for (const referral of REFERRALS) {
    const result = await saveReferral(toFormData(referral));
    if (!result.ok) {
      throw new Error(
        `Skierowanie dla ${referral.employee.fullName} nie przeszło: ${result.error}`,
      );
    }
    console.log(
      `  ${result.documentNumber}  ${referral.employee.fullName} (${referral.examinationType})`,
    );
  }

  console.log("\nStan po:");
  for (const table of ["firmy", "pracownicy", "dokumenty"]) {
    console.log(`  ${table.padEnd(12)} ${await countRows(table)}`);
  }
  console.log("\nGotowe.");
}

main().catch((error: unknown) => {
  console.error(`\nBŁĄD: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
