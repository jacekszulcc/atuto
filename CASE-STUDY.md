# Case study: generator skierowań na badania lekarskie

Opis problemu i decyzji projektowych. Dokumentacja techniczna, uruchomienie
i pełna lista ograniczeń są w [README](README.md).

## 1. Problem

Skierowanie na profilaktyczne badania lekarskie wystawia pracodawca. Wzór jest
określony w załączniku nr 3a do rozporządzenia Ministra Zdrowia (Dz.U. 2023
poz. 607). W małej firmie wypełnia się go ręcznie, na druku pobranym
z internetu, i z tego biorą się trzy osobne kłopoty.

**Nieaktualny wzór.** Wyszukiwarka nie wie, która wersja druku obowiązuje.
Pierwszy wynik potrafi być wersją sprzed 1 kwietnia 2015 roku, rozpoznawalną po
nagłówku REGON-EKD. Wypełniony poprawnie nieaktualny druk jest wciąż
nieaktualnym drukiem, a osoba wypełniająca zwykle nie ma powodu sprawdzać daty
wzoru, bo formularz wygląda znajomo.

**Pole, które trzeba policzyć samemu.** Druk zawiera rubrykę „łączna liczba
czynników". Wpisuje się ją ręcznie, po wypisaniu czynników szkodliwych
w sekcjach powyżej. Przy dopisaniu albo skreśleniu jednej pozycji łatwo
zapomnieć o poprawieniu liczby, a wtedy dokument sam sobie przeczy.

**Brak numeracji i archiwum.** Papierowe skierowania nie mają wspólnego
licznika, więc nie da się ich jednoznacznie rozróżnić ani policzyć. Kopia
zostaje najwyżej w segregatorze. Odtworzenie treści dokumentu sprzed roku
sprowadza się do znalezienia właściwej kartki.

## 2. Proces dziś

Bez aplikacji wystawienie jednego skierowania wygląda tak:

1. **Znalezienie druku.** Wyszukiwarka, pobranie pliku, wydruk pustego
   formularza albo otwarcie go w edytorze.
2. **Wypełnienie.** Dane firmy, dane osoby kierowanej, stanowisko, opis
   wykonywanej pracy, wypisanie czynników szkodliwych, policzenie ich
   i wpisanie sumy.
3. **Wydruk w dwóch egzemplarzach.**
4. **Przekazanie pracownikowi**, który zanosi dokument do przychodni.
5. **Kopia do segregatora.**

Błąd powstaje w krokach pierwszym i drugim, a ujawnia się dopiero w przychodni,
czyli poza firmą i po czasie. Nieaktualny wzór wychodzi przy okienku. Literówka
w numerze PESEL też, bo na papierze nikt jej nie weryfikuje. Rozjechana liczba
czynników przechodzi zwykle niezauważona, bo trzeba by przeliczyć pozycje
z sekcji powyżej.

Po kroku piątym proces przestaje być odtwarzalny. Nie wiadomo, ile skierowań
wystawiono, ani które było pierwsze. Nie ma jak sprawdzić, co dokładnie
napisano w skierowaniu wystawionym pół roku wcześniej, jeśli kartka się nie
znajdzie albo znalazła się kopia po poprawkach. Zmiana adresu pracownika nie
zostawia śladu, więc rok później nie da się powiedzieć, jaki adres był na
dokumencie w chwili wystawienia.

## 3. Proces po wdrożeniu

Ten sam dokument powstaje przez wypełnienie formularza w przeglądarce.
Po zapisaniu aplikacja generuje PDF i wysyła go mailem, a dokument trafia na
listę wystawionych.

Z procesu znika:

- szukanie druku, bo układ wzoru jest w kodzie aplikacji
- ręczne liczenie czynników, bo liczba wynika z listy wpisanych pozycji
- pilnowanie numeracji, bo numer nadaje aplikacja przy zapisie
- segregator jako jedyne archiwum

Dochodzi:

- walidacja w momencie wpisywania, w tym kontrola sumy kontrolnej numeru PESEL,
  czyli wychwycenie literówki przed wystawieniem dokumentu, a nie w przychodni
- zapis pełnej treści dokumentu z chwili wystawienia, niezależny od tego, co
  później stanie się z danymi pracownika
- lista wystawionych dokumentów z możliwością ponownego pobrania PDF-a
  i ponownej wysyłki

Czego proces nie zmienia: dokument nadal wystawia i firmuje człowiek.
Aplikacja odtwarza układ wzoru i pilnuje spójności danych, ale nie rozstrzyga,
czy skierowanie jest zasadne ani jaki zakres badań jest właściwy.

## 4. Architektura

```
  [ przeglądarka ]
         |
         |  formularz, walidacja po stronie klienta
         v
  [ Next.js na Vercelu ]
         |
         |--- Server Action: zapis --------------> [ Supabase / PostgreSQL ]
         |                                            pracownicy  (stan bieżący)
         |                                            dokumenty   (numer + snapshot)
         |                                                   |
         |<-- odczyt snapshotu -----------------------------+
         |
         v
  [ render HTML w tym samym procesie ]
         |   renderToStaticMarkup + CSS doklejony inline
         v
  [ Chromium w funkcji serverless ]
         |
         |  PDF
         +--------> pobranie w przeglądarce
         |
         +--------> [ Resend ] --------> skrzynka odbiorcy
```

**Next.js na Vercelu** obsługuje zarówno strony, jak i logikę serwerową.
Formularz jest komponentem klienckim, zapis biegnie przez Server Action,
a generowanie PDF-a i wysyłka przez osobne Route Handlery. Podział wynika
z ograniczeń środowiska: trasy generujące PDF muszą deklarować środowisko
Node.js i dłuższy limit czasu, bo uruchamiają przeglądarkę. Gdyby wysyłka
wisiała na Server Action wywoływanym ze strony listy, to strona listy
musiałaby nieść ten limit.

**Supabase** trzyma trzy tabele: firmy, pracownicy i dokumenty. Aplikacja łączy
się z nią po stronie serwera. Tabela `pracownicy` opisuje stan bieżący,
a kolumna `dokumenty.dane` przechowuje snapshot, czyli komplet danych z chwili
wystawienia. Te dwa źródła celowo nie są ze sobą zsynchronizowane. Ścieżka
generowania dokumentu czyta wyłącznie snapshot i nie wykonuje żadnego złączenia
z pozostałymi tabelami.

**Chromium** działa wewnątrz funkcji serverless. HTML dokumentu powstaje w tym
samym procesie, który potem go drukuje: komponent renderowany jest do stringa,
skompilowany CSS aplikacji doklejany inline, a całość podawana przeglądarce
bezpośrednio. Aplikacja nie odpytuje samej siebie po HTTP, więc w tym przepływie
nie ma round-tripu sieciowego ani zależności od tego, czy strona podglądu jest
dostępna.

**Resend** dostaje gotowy PDF jako załącznik. Warstwa poczty nie wie nic
o bazie ani o renderowaniu: przyjmuje adres odbiorcy, numer dokumentu, datę
wystawienia i plik. Dzięki temu ta sama binarna zawartość, którą pobiera się
z listy, jedzie w mailu.

Uzasadnienia poszczególnych wyborów są w sekcji „Decyzje projektowe"
w [README](README.md#decyzje-projektowe).

## 5. Co się nie udało i czego się nauczyłem

**Schemat odtworzony z pamięci rozjechał się z bazą w trzech miejscach.**
Kod zapisu powstał na podstawie schematu zrekonstruowanego z notatek, zanim
plik `schema.sql` znalazł się w repozytorium. Po porównaniu z rzeczywistą bazą
wyszło, że nie zgadza się wartość dopuszczana przez ograniczenie `CHECK` dla
typu identyfikatora oraz nazwy czterech kolumn adresowych, a jedna istniejąca
kolumna w ogóle nie była wypełniana. Każda z tych trzech różnic wywróciłaby
każdy zapis. Od tamtej pory kolumny sprawdzam wprost w bazie, zanim napiszę
kod, który je zapisuje.

Wzorzec numeracji zapisany jako `^SK-(\d+)$` wewnątrz szablonu tekstowego
stracił lewy ukośnik, bo `\d` w takim szablonie to po prostu litera `d`.
Powstałe wyrażenie szukało ciągu w rodzaju `SK-ddd` i nie dopasowywało żadnego
istniejącego numeru. Skutek: każdy dokument dostawałby numer `SK-001`,
a drugi zapis odbiłby się od ograniczenia unikalności. Błąd wyszedł przy
czytaniu diffu przed commitem, bo testy sprawdzały wtedy walidację formularza,
a numeracji nie obejmowały. Wniosek podwójny: przeglądanie własnego diffu
wychwytuje rzeczy, których testy nie pokrywają, a wzorce sklejane z tekstu
lepiej zastąpić czymś, co nie wymaga escapowania.

**PDF działał lokalnie, a na produkcji nie.** Wdrożona wersja zwracała błąd
o nieistniejącym katalogu z binarką Chromium. Komunikat sugerował brak
wyłączenia pakietu z bundlowania i ta hipoteza okazała się nietrafiona: oba
pakiety były już na domyślnej liście pakietów zewnętrznych frameworka.
Przyczyną było śledzenie plików. Framework wykrywa zależności po importach,
a biblioteka czyta swoje archiwa w trakcie działania, po ścieżce, więc nic ich
nie importowało i nie trafiały do paczki funkcji. Rozstrzygnął plik
`route.js.nft.json`, czyli zapis tego, co faktycznie zostało dołączone: przed
poprawką zero archiwów, po poprawce cztery. Lokalnie ta gałąź kodu nigdy się
nie wykonywała, bo tam używana jest zainstalowana przeglądarka, więc build
przechodził, a kod pozostawał nieprzetestowany.

Pierwsza wersja wydruku renderowała listę czynników jako tabelę zbudowaną
z tego, co wpisał użytkownik. Wyglądało to porządnie i było nieprawidłowe.
We wzorze 3a czynniki są ujęte w pięciu nazwanych sekcjach, które występują na
druku zawsze, także wtedy, gdy w danej sekcji nic nie wpisano. Dokument
urzędowy odtwarza konkretny formularz razem z jego pustymi rubrykami, więc przy
odwzorowaniu punktem wyjścia jest układ wzoru, a struktura danych dopasowuje
się do niego.

**Realne dane osobowe w bazie demonstracyjnej.** Przed upublicznieniem repo
w bazie znajdowały się prawdziwe dane osobowe, zapisane w snapshotach
wystawionych dokumentów. Pierwszy odruch, czyli wyczyszczenie tabeli
`pracownicy`, nic by nie dał, bo snapshot jest z założenia niezależny od tej
tabeli i przechowuje własną kopię danych. Ta sama właściwość, która chroni
treść dokumentu przed późniejszymi zmianami, sprawia, że dane osobowe zostają
w miejscu, w którym nikt ich nie szuka. Wniosek: przy usuwaniu danych trzeba
najpierw ustalić, gdzie one faktycznie leżą; tabela o pasującej nazwie bywa
mylącym tropem. Aktualnie baza demo wypełniana jest skryptem z danymi fikcyjnymi,
w tym numerami PESEL, które mają poprawną sumę kontrolną, ale kodują dzień
nieistniejący w żadnym miesiącu, więc nie mogą należeć do realnej osoby.

## 6. Stan i ograniczenia

Projekt jest w budowie i nie jest produktem komercyjnym. Zaimplementowany jest
jeden typ dokumentu, jako kompletna ścieżka od formularza do wysyłki. Demo jest
otwarte, bez logowania, a dane w nim są fikcyjne.

Ograniczenia są wypisane wprost w sekcji „Znane ograniczenia"
w [README](README.md#znane-ograniczenia). Dotyczą między innymi braku
uwierzytelniania i wynikającej z tego nieaktywności polityk dostępu,
numeracji dokumentów oraz limitu wysyłki, który przechowywany jest w pamięci
procesu.

Dokument wygenerowany przez aplikację wymaga weryfikacji przez osobę
uprawnioną, zanim zostanie użyty w obrocie.
