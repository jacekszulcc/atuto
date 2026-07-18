/*
 * Landing page for the "Atuto Start" package (Phase 1 MVP).
 * Content placeholders that require the owner's input are marked with <Todo />.
 */

const CONTACT_EMAIL = "kontakt@atuto.pl";

function Todo({ label = "DO UZUPEŁNIENIA" }: { label?: string }) {
  return (
    <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {label}
    </span>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Atuto
        </a>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex dark:text-slate-300">
          <a href="#pakiet" className="hover:text-slate-900 dark:hover:text-white">Pakiet</a>
          <a href="#jak-to-dziala" className="hover:text-slate-900 dark:hover:text-white">Jak to działa</a>
          <a href="#cena" className="hover:text-slate-900 dark:hover:text-white">Cena</a>
          <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">FAQ</a>
        </nav>
        <a
          href="#cena"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          Zamów pakiet
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">
        Dokumentacja BHP dla mikro i małych firm
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Twoja dokumentacja to&nbsp;atut.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
        Pakiet <strong className="font-semibold text-slate-900 dark:text-white">Atuto Start</strong> to
        komplet dokumentacji BHP dla biura i e-commerce. Wypełniasz prostą ankietę online,
        a w ciągu 48 godzin otrzymujesz dokumenty przygotowane przez specjalistę ds. BHP —
        spersonalizowane pod Twoją firmę, gotowe do użycia.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a
          href="#cena"
          className="rounded-lg bg-blue-700 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-800"
        >
          Zobacz pakiet
        </a>
        <a
          href="#jak-to-dziala"
          className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Jak to działa
        </a>
      </div>
      <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-2">
          <Check /> Dokumenty w 48 godzin
        </li>
        <li className="flex items-center gap-2">
          <Check /> Przygotowuje specjalista ds. BHP
        </li>
        <li className="flex items-center gap-2">
          <Check /> Faktura VAT dla firmy
        </li>
      </ul>
    </section>
  );
}

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ForWhom() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Dla kogo jest Atuto Start?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Biuro</h3>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Prowadzisz firmę, w której praca odbywa się przy biurku — usługi, doradztwo,
              IT, księgowość. Zatrudniasz pierwszych pracowników i potrzebujesz dokumentacji
              BHP dopasowanej do stanowisk biurowych.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">E-commerce</h3>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Sprzedajesz online — sklep internetowy, marketplace, mała wysyłka. Twój zespół
              łączy pracę biurową z pakowaniem i obsługą zamówień, a dokumentacja musi to
              odzwierciedlać.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Package() {
  return (
    <section id="pakiet" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Co znajdziesz w pakiecie
      </h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Komplet dokumentów przygotowanych na podstawie Twoich odpowiedzi z ankiety.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <Check />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Ocena Ryzyka Zawodowego (ORZ)
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Główny dokument BHP — dla stanowisk występujących w Twojej firmie.
            </p>
          </div>
        </li>
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <Check />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Dokument nr {i + 1} <Todo />
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Nazwę i opis pozycji pakietu dostarczy właściciel.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Zamawiasz i płacisz online",
      text: "Wybierasz pakiet Atuto Start i opłacasz zamówienie. Fakturę VAT otrzymasz automatycznie.",
    },
    {
      title: "Wypełniasz ankietę",
      text: "Prosty formularz online — odpowiadasz na pytania o firmę i stanowiska pracy. Bez żargonu, krok po kroku.",
    },
    {
      title: "Otrzymujesz dokumenty w 48 h",
      text: "Specjalista ds. BHP przygotowuje komplet spersonalizowanych dokumentów i wysyła je na Twój e-mail w formacie PDF.",
    },
  ];
  return (
    <section id="jak-to-dziala" className="border-y border-slate-200 bg-slate-50 scroll-mt-16 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Jak to działa
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="cena" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Cena</h2>
      <div className="mt-8 max-w-md rounded-2xl border border-slate-200 p-8 shadow-sm dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Atuto Start — BHP dla biura i e-commerce
        </h3>
        <p className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            — zł
          </span>
          <span className="text-slate-600 dark:text-slate-400">netto</span>
          <Todo label="CENA DO USTALENIA" />
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Do ceny doliczany jest podatek VAT. Otrzymasz fakturę VAT.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Atuto%20Start%20%E2%80%94%20zapytanie`}
          className="mt-8 block rounded-lg bg-blue-700 px-6 py-3 text-center text-base font-medium text-white transition-colors hover:bg-blue-800"
        >
          Zapytaj o pakiet
        </a>
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          Zamówienia online już wkrótce. Do tego czasu napisz: {CONTACT_EMAIL}
        </p>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    "Czy ta dokumentacja wystarczy w razie kontroli?",
    "Skąd mam wiedzieć, które dokumenty są mi potrzebne?",
    "Co jeśli moja firma ma nietypowe stanowiska pracy?",
    "Czy dokumenty trzeba aktualizować?",
  ];
  return (
    <section id="faq" className="border-t border-slate-200 bg-slate-50 scroll-mt-16 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Częste pytania
        </h2>
        <dl className="mt-8 space-y-4">
          {items.map((q) => (
            <div key={q} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <dt className="font-medium text-slate-900 dark:text-white">{q}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Odpowiedź przygotuje właściciel. <Todo />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Atuto · atuto.pl</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-900 dark:hover:text-white">
            {CONTACT_EMAIL}
          </a>
          <span className="text-slate-400 dark:text-slate-600">
            Regulamin i polityka prywatności — wkrótce
          </span>
        </div>
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
        <ForWhom />
        <Package />
        <HowItWorks />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
