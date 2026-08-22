# Atuto

Aplikacja generująca obowiązkową dokumentację firmową z formularza. Pierwszy
zaimplementowany typ dokumentu to skierowanie na profilaktyczne badania
lekarskie zgodne ze wzorem z załącznika nr 3a do rozporządzenia Ministra
Zdrowia (Dz.U. 2023 poz. 607).

## Co to jest

Formularz webowy, z którego powstaje gotowy PDF, wysyłany mailem i zapisywany
na liście wystawionych dokumentów. Projekt własny, w budowie. Nie jest to
produkt komercyjny.

Docelowo aplikacja ma obsługiwać różne rodzaje dokumentacji firmowej (BHP,
RODO, HACCP). Obecna wersja implementuje jeden typ dokumentu jako kompletną
ścieżkę od formularza do wysyłki.

Demo jest otwarte, bez logowania, a wszystkie dane w nim są fikcyjne.

Opis problemu, procesu przed i po wdrożeniu oraz tego, co poszło nie tak
w trakcie budowy: [CASE-STUDY.md](CASE-STUDY.md).

## Problem

Skierowanie na badania wypełnia się dziś zwykle ręcznie, na druku pobranym
z internetu. Wychodzą z tego trzy rzeczy.

Pierwsza to ryzyko błędu formalnego. Druk ma określony układ i wymagane pola,
a pierwszy wynik wyszukiwania potrafi być wersją sprzed 1 kwietnia 2015 roku,
z nagłówkiem REGON-EKD, czyli nieaktualną. Osobna pułapka to pole „łączna
liczba czynników", wpisywane ręcznie i rozjeżdżające się z tabelą powyżej.

Druga to brak numeracji. Papierowe skierowania nie mają wspólnego licznika,
więc nie da się powiedzieć, które było które.

Trzecia to brak archiwum. Kopia zostaje najwyżej w segregatorze, a odtworzenie
treści dokumentu sprzed roku jest w praktyce niemożliwe.

W aplikacji układ druku jest zaszyty w kodzie, licznik prowadzi baza, a treść
każdego wystawionego dokumentu zostaje zapisana w całości.

## Jak działa

```
formularz  ->  snapshot w bazie  ->  PDF  ->  mail  ->  lista dokumentów
```

1. **Formularz** (`/skierowanie`): rodzaj badania, dane osoby kierowanej,
   stanowisko i lista czynników szkodliwych. Walidacja po stronie klienta
   i serwera, z kontrolą sumy kontrolnej numeru PESEL.
2. **Snapshot**: dokument dostaje kolejny numer (`SK-001`, `SK-002` i dalej),
   a do kolumny `dokumenty.dane` (jsonb) trafia komplet danych z chwili
   wystawienia.
3. **PDF**: snapshot renderowany jest do HTML zgodnego ze wzorem i drukowany
   przez Chromium uruchomione po stronie serwera.
4. **Mail**: PDF idzie w załączniku na adres podany w formularzu wysyłki.
5. **Lista** (`/dokumenty`): numer, data utworzenia, osoba kierowana, rodzaj
   badania, pobranie PDF-a i ponowna wysyłka.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase: PostgreSQL, RLS, region UE
- Vercel: hosting, funkcje serverless
- Resend: poczta transakcyjna
- puppeteer-core + @sparticuz/chromium: render HTML do PDF

## Decyzje projektowe

### Dokument renderowany wyłącznie ze snapshotu

Treść skierowania odtwarzana jest tylko z `dokumenty.dane`. W tej ścieżce nie
ma ani jednego złączenia z `pracownicy` czy `firmy`.

Chodzi o to, że dokument raz wystawiony musi dać się odtworzyć w niezmienionej
treści. Gdyby wydruk sklejał dane przez złączenie z tabelą pracowników, zmiana
adresu albo stanowiska po miesiącu dawałaby przy ponownym wydruku inny dokument
pod tym samym numerem. To nie jest rozważanie teoretyczne. W trakcie pracy nad
projektem wiersz pracownika został podmieniony, a wystawione wcześniej
skierowania dalej pokazywały pierwotną osobę, dokładnie tak, jak powinny. Stąd
też `pracownik_id` ma `ON DELETE SET NULL`, a nie `CASCADE`: usunięcie
pracownika nie może skasować wystawionego dokumentu.

W praktyce oznacza to, że `pracownicy` trzyma stan bieżący, `dokumenty.dane`
stan historyczny, i te dwie wartości mają prawo się różnić.

### Treść wzoru w komponencie, dane sprawy w snapshocie

Stałe elementy druku, czyli nagłówki rubryk, klauzula o podstawie prawnej
i układ sekcji czynników, siedzą w komponencie `SkierowanieWydruk`.
W snapshocie zapisywane są tylko dane konkretnej sprawy.

Podział wynika z tego, że jedno i drugie zmienia się w innym rytmie i z innego
powodu. Układ druku zmienia się przy nowelizacji rozporządzenia, dla wszystkich
dokumentów naraz. Dane sprawy nie zmieniają się nigdy po wystawieniu.

Słaby punkt: przy nowelizacji wzoru ponowny wydruk starego dokumentu wyjdzie
w nowym układzie. Snapshot niesie pole `legalBasis` z klauzulą obowiązującą
w chwili wystawienia, ale komponent go dziś nie czyta, bo ma tę klauzulę
wpisaną na stałe.

### factorCount renderowany tak, jak zapisany

Na druku jest pole „łączna liczba czynników". Aplikacja wylicza je z listy
przy wystawianiu i zapisuje w snapshocie jako `factorCount`.

Przy odczycie liczba nie jest przeliczana ponownie. Jeśli okaże się niezgodna
z długością tablicy czynników, trafia to do `warnings` i wyświetla się nad
podglądem, ale render idzie dalej i pokazuje wartość zapisaną.

Odwrotne zachowanie, czyli poprawianie liczby przy wydruku albo odmowa
renderu, byłoby gorsze. Dokument urzędowy ma pokazywać to, co w nim zapisano,
a nie to, co system uważa dziś za poprawne. Niespójność jest sygnalizowana,
nie naprawiana po cichu.

### HTML do PDF przez Puppeteer

PDF powstaje przez wydrukowanie HTML-a w headless Chromium, a nie przez
programistyczne składanie strony z prymitywów graficznych.

Druk 3a to gęsty formularz z liniami do wypełnienia i pięcioma nazwanymi
sekcjami czynników. Ułożenie tego współrzędnymi w bibliotece typu pdf-lib
oznaczałoby ręczne liczenie pozycji każdej kreski i osobną robotę przy każdej
zmianie układu. W HTML i CSS ten sam układ opisuje się siatką, a reguła
`@page` pilnuje formatu i marginesów.

Kosztuje to tyle: paczka funkcji serverless rośnie o około 66 MB archiwów
Chromium, a zimny start jest wyraźnie wolniejszy niż przy generatorze
działającym w czystym Node.

### PDF budowany lokalnie, bez zapytania HTTP do samego siebie

Częsty wzorzec to wskazanie Puppeteerowi własnego adresu URL i wydrukowanie
strony podglądu. Tutaj HTML powstaje w tym samym procesie:
`renderToStaticMarkup` składa komponent do stringa, skompilowany CSS jest
doklejany inline, a całość trafia do `page.setContent()`.

Powody są dwa. Round-trip HTTP do własnej aplikacji z wnętrza funkcji
serverless to dodatkowe opóźnienie i kolejny element, który może paść. Drugi
powód jest ważniejszy: po wprowadzeniu logowania strona podglądu będzie
chroniona, więc Puppeteer musiałby dostać ciasteczko sesyjne albo osobną
furtkę pomijającą autoryzację. Budowanie HTML-a lokalnie usuwa ten problem,
zanim powstanie.

## Znane ograniczenia

**Brak logowania.** Zapis i wysyłka idą kluczem `service_role`, który omija
RLS. Polityki RLS są w `supabase/schema.sql` napisane pod `auth.uid()`, więc
bez sesji użytkownika są faktycznie nieaktywne i zaczną chronić dopiero po
wprowadzeniu Supabase Auth. W obecnej postaci bezpieczeństwo danych opiera się
na tym, że klucz nie opuszcza serwera, a nie na RLS.

**Numeracja.** Kod nadaje numery w ramach firmy, ale w bazie `dokumenty.numer`
ma `unique` globalny. Przy jednej firmie nie ma to znaczenia. Druga firma
wyliczyłaby własne `SK-001` i zapis odbiłby się od ograniczenia. Do zmiany na
`unique (firma_id, numer)` razem z warstwą wielofirmową.

**CSS do PDF-a.** `lib/pdf/inline-css.ts` czyta skompilowany CSS z katalogu
`.next/static`. Ścieżka zależy od bundlera, a w `next dev` katalog bywa pusty,
bo style idą przez HMR. PDF wychodzi wtedy bez formatowania. Wygląd wydruku
sprawdzaj przez `npm run build && npm run start`.

**Limit wysyłki.** Licznik żyje w pamięci procesu, więc zeruje się przy każdym
zimnym starcie funkcji, a równoległe instancje mają osobne liczniki. To
zaślepka na czas otwartego demo, nie szczelny limit.

**Jeden typ dokumentu.** Obsługiwane jest wyłącznie skierowanie na badania
lekarskie. Struktura snapshotu jest związana z tym wzorem.

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env
npm run dev
```

Zmienne środowiskowe (wzór z komentarzami w `.env.example`):

| Zmienna | Opis |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | adres projektu Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | klucz `service_role`, wyłącznie po stronie serwera |
| `ATUTO_TEST_USER_ID` | `auth.users.id` konta, do którego przypięta jest firma |
| `RESEND_API_KEY` | klucz API Resend |
| `RESEND_FROM` | adres nadawcy, wymaga domeny zweryfikowanej w Resend |
| `PUPPETEER_EXECUTABLE_PATH` | ścieżka do lokalnej przeglądarki, na Vercelu zostaw pustą |

Bez `PUPPETEER_EXECUTABLE_PATH` generowanie PDF-a lokalnie nie zadziała.
Binarka `@sparticuz/chromium` jest skompilowana pod Amazon Linux i uruchamia
się tylko na serverless.

Schemat bazy jest w `supabase/schema.sql`. Dane demonstracyjne wypełnia
`scripts/seed-demo.ts`. Skrypt czyści tabele i odtwarza ten sam stan przy
każdym uruchomieniu:

```bash
npx tsx scripts/seed-demo.ts           # dry run, nic nie zmienia
npx tsx scripts/seed-demo.ts --force   # czyści bazę i wypełnia danymi demo
```

```bash
npm run build    # build produkcyjny
npm run lint     # ESLint
```

## Uwaga

Dokument wygenerowany przez aplikację wymaga weryfikacji przez osobę
uprawnioną, zanim zostanie użyty w obrocie. Aplikacja odtwarza układ wzoru
i pilnuje spójności danych, ale nie rozstrzyga, czy skierowanie jest w danym
przypadku zasadne ani czy zakres badań jest właściwy.
