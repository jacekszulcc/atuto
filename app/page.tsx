/*
 * Strona główna. Opisuje, co projekt faktycznie robi. Nie stoi za nim żadna
 * oferta handlowa, więc strona nie zawiera cennika ani wezwania do zakupu.
 */

import Link from "next/link";

const REPO_URL = "https://github.com/jacekszulcc/atuto";

function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Atuto
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex dark:text-slate-300">
          <a href="#jak-to-dziala" className="hover:text-slate-900 dark:hover:text-white">Jak to działa</a>
          <a href="#demo" className="hover:text-slate-900 dark:hover:text-white">Demo</a>
          <a href="#stan-projektu" className="hover:text-slate-900 dark:hover:text-white">Stan projektu</a>
        </nav>
        <Link
          href="/skierowanie"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          Zobacz demo
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">
        Projekt własny
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Obowiązkowa dokumentacja firmowa generowana z formularza
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
        Atuto to aplikacja, która na podstawie wypełnionego formularza składa
        gotowy dokument, zapisuje go i wysyła mailem jako PDF.
      </p>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
        Zaimplementowany typ dokumentu:{" "}
        <strong className="font-semibold text-slate-900 dark:text-white">
          skierowanie na badania lekarskie
        </strong>{" "}
        zgodne ze wzorem z załącznika nr 3a (Dz.U. 2023 poz. 607).
      </p>
    </section>
  );
}

const STEPS: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Formularz",
    description:
      "Rodzaj badania, dane osoby kierowanej, stanowisko i lista czynników szkodliwych. Walidacja sprawdza m.in. sumę kontrolną numeru PESEL.",
  },
  {
    title: "Zapis snapshotu",
    description:
      "Dokument dostaje kolejny numer i trafia do bazy razem z pełną kopią danych z chwili wystawienia.",
  },
  {
    title: "PDF",
    description:
      "Skierowanie renderowane jest do HTML zgodnego ze wzorem, a następnie drukowane do PDF-a przez przeglądarkę uruchomioną po stronie serwera.",
  },
  {
    title: "Mail i lista",
    description:
      "Gotowy PDF idzie w załączniku na wskazany adres, a dokument pojawia się na liście wystawionych skierowań.",
  },
];

function HowItWorks() {
  return (
    <section
      id="jak-to-dziala"
      className="scroll-mt-16 border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Jak to działa
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section id="demo" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Demo
      </h2>
      <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
        Aplikacja działa na żywo. Możesz wystawić skierowanie i pobrać
        wygenerowany PDF.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/skierowanie"
          className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-800"
        >
          Zobacz demo
        </Link>
        <Link
          href="/dokumenty"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Lista wystawionych dokumentów
        </Link>
      </div>
      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Wszystkie dane w demo są fikcyjne: nazwa firmy, nazwiska, adresy
        i numery PESEL zostały wygenerowane na potrzeby prezentacji.
      </p>
    </section>
  );
}

const STATUS_POINTS: ReadonlyArray<{ label: string; description: string }> = [
  {
    label: "Projekt własny, w budowie",
    description: "Nie jest to produkt komercyjny ani usługa, którą można zamówić.",
  },
  {
    label: "Jeden typ dokumentu",
    description:
      "Obsługiwane jest wyłącznie skierowanie na badania lekarskie wg załącznika nr 3a.",
  },
  {
    label: "Brak logowania",
    description:
      "Dostęp do demo jest otwarty. Każdy może wystawić dokument i zobaczyć listę.",
  },
  {
    label: "Wysyłka ograniczona limitem",
    description:
      "Liczba wiadomości na godzinę jest limitowana, a adres nadawcy jest tymczasowy.",
  },
];

function ProjectStatus() {
  return (
    <section
      id="stan-projektu"
      className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 pb-20 sm:px-6"
    >
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6 sm:p-8 dark:border-amber-700 dark:bg-amber-950/30">
        <h2 className="text-2xl font-semibold tracking-tight text-amber-950 dark:text-amber-100">
          Stan projektu
        </h2>
        <p className="mt-4 max-w-3xl text-amber-900 dark:text-amber-200/90">
          Docelowo Atuto ma obsługiwać różne rodzaje obowiązkowej dokumentacji
          firmowej (BHP, RODO, HACCP), a obecna wersja implementuje jeden typ
          dokumentu jako kompletną ścieżkę od formularza do wysyłki.
        </p>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          {STATUS_POINTS.map((point) => (
            <div key={point.label}>
              <dt className="font-semibold text-amber-950 dark:text-amber-100">
                {point.label}
              </dt>
              <dd className="mt-1 text-amber-900 dark:text-amber-200/90">
                {point.description}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 border-t border-amber-300 pt-5 text-sm text-amber-900 dark:border-amber-800 dark:text-amber-200/90">
          Dokument wygenerowany przez aplikację wymaga weryfikacji przez osobę
          uprawnioną, zanim zostanie użyty w obrocie.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Atuto · atuto.pl</p>
        <a
          href={REPO_URL}
          className="hover:text-slate-900 dark:hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          Kod źródłowy na GitHubie
        </a>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans dark:bg-slate-950">
      <Nav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Demo />
        <ProjectStatus />
      </main>
      <Footer />
    </div>
  );
}
