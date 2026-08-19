/**
 * Wydruk skierowania na badania lekarskie (załącznik 3a, Dz.U. 2023 poz. 607).
 *
 * Renderowany wyłącznie z `dane` (snapshot z `dokumenty.dane`) — żadnych
 * zapytań do `pracownicy`/`firmy`. Jeden układ obsługuje i podgląd na
 * ekranie, i wydruk/PDF: różnice między nimi to wyłącznie CSS (`print:`
 * warianty Tailwind + reguły w bloku <style> poniżej, których Tailwind nie
 * wyraża — wymiary strony przy przełamaniu).
 *
 * Układ, etykiety i treść stałych fragmentów (podstawa prawna, nagłówki
 * czynników I–V, przypisy) odwzorowują oficjalny wzór 1:1 — to nie jest
 * swobodna interpretacja formularza.
 */

import {
  EXAMINATION_TYPES,
  FACTOR_CATEGORIES,
  type FactorCategory,
  type IdentifierType,
  type ReferralSnapshot,
} from "@/lib/referral/types";

interface SkierowanieWydrukProps {
  numer: string;
  dane: ReferralSnapshot;
}

/** Etykiety identyfikatora na wydruku — inne niż etykiety pól w formularzu. */
const IDENTIFIER_PRINT_LABELS: Record<IdentifierType, string> = {
  pesel: "nr PESEL**)",
  dokument: "seria, numer i nazwa dokumentu potwierdzającego tożsamość**)",
  data_urodzenia: "data urodzenia**)",
};

function formatPolishDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function formatAddress(address: ReferralSnapshot["person"]["address"]): string {
  const houseAndFlat = address.flatNo
    ? `${address.houseNo ?? ""}/${address.flatNo}`
    : (address.houseNo ?? "");

  const streetLine = address.street
    ? `ul. ${address.street}${houseAndFlat ? ` ${houseAndFlat}` : ""}`
    : houseAndFlat || null;

  return [streetLine, address.city].filter(Boolean).join(", ");
}

/** Blank z podkreśleniem, tekstem poprzedzającym (opcjonalnie) i podpisem pod spodem. */
function DottedLine({
  prefix,
  value,
  caption,
}: {
  prefix?: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="mb-3 break-inside-avoid">
      <div className="flex items-baseline gap-2 border-b border-black pb-0.5">
        {prefix && <span className="whitespace-nowrap">{prefix}</span>}
        <span className="min-h-[1em] flex-1 whitespace-pre-line">{value}</span>
      </div>
      {caption && (
        <div className="text-center text-[9pt] text-gray-600">{caption}</div>
      )}
    </div>
  );
}

/** Wariant wstępne/okresowe/kontrolne — pozostałe dwa przekreślone. */
function ExaminationTypeChoice({ value }: { value: ReferralSnapshot["examinationType"] }) {
  return (
    <>
      {EXAMINATION_TYPES.map((option, index) => (
        <span key={option.value}>
          {index > 0 && "/"}
          <span className={option.value === value ? "" : "line-through"}>
            {option.label}
          </span>
        </span>
      ))}
    </>
  );
}

export default function SkierowanieWydruk({ numer, dane }: SkierowanieWydrukProps) {
  const identifierValue =
    dane.person.identifierType === "data_urodzenia"
      ? formatPolishDate(dane.person.identifier)
      : dane.person.identifier;

  const factorsByCategory = (category: FactorCategory) =>
    dane.factors.filter((factor) => factor.category === category);

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white p-[20mm] font-serif text-[11pt] text-black shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>

      <div className="mb-6 grid grid-cols-2 gap-x-10">
        <DottedLine
          value={`${dane.employer.name}\n${dane.employer.address}`}
          caption="(oznaczenie pracodawcy)"
        />
        <DottedLine
          value={`${dane.issuePlace}, ${formatPolishDate(dane.issueDate)}`}
          caption="(miejscowość, data)"
        />
      </div>

      <h1 className="mb-1 text-center text-[13pt] font-semibold uppercase">
        Skierowanie na badania lekarskie
      </h1>
      <p className="mb-6 text-center text-[10pt]">
        (
        <ExaminationTypeChoice value={dane.examinationType} />
        *))
      </p>

      <p className="mb-4 text-[11pt]">
        Działając na podstawie art. 229 § 4a ustawy z dnia 26 czerwca 1974 r. –
        Kodeks pracy (Dz. U. z 2016 r. poz. 1666), kieruję na badania lekarskie:
      </p>

      <DottedLine
        prefix="Pana/Panią*)"
        value={dane.person.fullName}
        caption="(imię i nazwisko)"
      />

      <DottedLine prefix={IDENTIFIER_PRINT_LABELS[dane.person.identifierType]} value={identifierValue} />

      <DottedLine
        prefix="zamieszkałego/zamieszkałą*)"
        value={formatAddress(dane.person.address)}
        caption="(miejscowość, ulica, nr domu, nr lokalu)"
      />

      <DottedLine
        prefix="zatrudnionego/zatrudnioną*) lub podejmującego/podejmującą*) pracę na stanowisku lub stanowiskach pracy"
        value={dane.position.name}
      />

      <DottedLine
        prefix="określenie stanowiska/stanowisk*) pracy***):"
        value={dane.position.description}
      />

      <section className="mb-6 mt-4">
        <p className="mb-3 text-[10pt]">
          Opis warunków pracy uwzględniający informacje o występowaniu na
          stanowisku lub stanowiskach pracy czynników niebezpiecznych,
          szkodliwych dla zdrowia lub czynników uciążliwych i innych
          wynikających ze sposobu wykonywania pracy, z podaniem wielkości
          narażenia oraz aktualnych wyników badań i pomiarów czynników
          szkodliwych dla zdrowia, wykonanych na tym stanowisku/stanowiskach –
          należy wpisać nazwę czynnika/czynników i wielkość/wielkości
          narażenia****):
        </p>

        {FACTOR_CATEGORIES.map((category) => {
          const items = factorsByCategory(category.value);
          return (
            <div key={category.value} className="mb-2 break-inside-avoid">
              <div className="text-[11pt]">{category.label}:</div>
              {items.length > 0 && (
                <ul className="ml-5 list-disc text-[10pt]">
                  {items.map((factor, index) => (
                    <li key={`${category.value}-${index}`}>
                      {factor.name} — {factor.exposureLevel}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <p className="mt-3 flex flex-wrap items-baseline gap-2 text-[11pt]">
          <span>
            Łączna liczba czynników niebezpiecznych, szkodliwych dla zdrowia
            lub czynników uciążliwych i innych wynikających ze sposobu
            wykonywania pracy wskazanych w skierowaniu:
          </span>
          <span className="border border-black px-3 py-0.5 font-semibold">
            {dane.factorCount}
          </span>
        </p>
      </section>

      <div className="mt-16 flex justify-end break-inside-avoid">
        <div className="w-64 border-b border-black pb-0.5">&nbsp;</div>
      </div>
      <div className="flex justify-end break-inside-avoid">
        <div className="w-64 text-center text-[9pt] text-gray-600">
          (podpis pracodawcy)
        </div>
      </div>

      <section className="mt-10 break-inside-avoid text-[8pt] leading-snug text-gray-700">
        <p className="mb-1 font-semibold">Objaśnienia:</p>
        <p className="mb-1">*) Niepotrzebne skreślić.</p>
        <p className="mb-1">
          **) W przypadku osoby, której nie nadano numeru PESEL – seria,
          numer i nazwa dokumentu potwierdzającego tożsamość, a w przypadku
          osoby przyjmowanej do pracy − data urodzenia.
        </p>
        <p className="mb-1">
          ***) Opisać: rodzaj pracy, podstawowe czynności, sposób i czas ich
          wykonywania.
        </p>
        <p className="mb-1">
          ****) Opis warunków pracy uwzględniający w szczególności przepisy:
        </p>
        <p className="mb-1 ml-4">1) wydane na podstawie:</p>
        <p className="mb-1 ml-8">
          a) art. 222 § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy
          dotyczące wykazu substancji chemicznych, ich mieszanin, czynników
          lub procesów technologicznych o działaniu rakotwórczym lub
          mutagennym,
        </p>
        <p className="mb-1 ml-8">
          b) art. 222¹ § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy
          dotyczące wykazu szkodliwych czynników biologicznych,
        </p>
        <p className="mb-1 ml-8">
          c) art. 227 § 2 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy
          dotyczące badań i pomiarów czynników szkodliwych dla zdrowia,
        </p>
        <p className="mb-1 ml-8">
          d) art. 228 § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy
          dotyczące wykazu najwyższych dopuszczalnych stężeń i natężeń
          czynników szkodliwych dla zdrowia w środowisku pracy,
        </p>
        <p className="mb-1 ml-8">
          e) art. 25 pkt 1 ustawy z dnia 29 listopada 2000 r. – Prawo atomowe
          (Dz. U. z 2021 r. poz. 1941 oraz z 2022 r. poz. 974) dotyczące
          wskaźników pozwalających na wyznaczenie dawek promieniowania
          jonizującego stosowanych przy ocenie narażenia na promieniowanie
          jonizujące;
        </p>
        <p className="mb-1 ml-4">
          2) załącznika nr 1 do rozporządzenia Ministra Zdrowia i Opieki
          Społecznej z dnia 30 maja 1996 r. w sprawie przeprowadzania badań
          lekarskich pracowników, zakresu profilaktycznej opieki zdrowotnej
          nad pracownikami oraz orzeczeń lekarskich wydawanych do celów
          przewidzianych w Kodeksie pracy (Dz. U. z 2016 r. poz. 2067)
        </p>
        <p className="mt-2">
          Skierowanie na badania lekarskie jest wydawane w dwóch
          egzemplarzach, z których jeden otrzymuje osoba kierowana na
          badania.
        </p>
      </section>

      <footer className="mt-6 border-t border-gray-300 pt-2 text-[7pt] text-gray-400 print:break-inside-avoid">
        Numer wewnętrzny dokumentu: {numer}
      </footer>
    </article>
  );
}
