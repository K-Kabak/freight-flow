# FreightFlow — stan implementacji

Data ostatniej pełnej weryfikacji: 17 lipca 2026 r.

## Status

Etapy 0, 1, 2 i 3 są ukończone i zweryfikowane. Projekt jest gotowy do rozpoczęcia **Etapu 4 — publikacja portfolio**. Nie rozpoczęto implementacji Etapu 4 ani Etapu 5.

## Ukończony Etap 3

### 3.1 — callback auth i bazowa ochrona odpowiedzi

- Callback PKCE odrzuca absolutne, protokół-relative, zakodowane i zawierające backslash cele przekierowania.
- Przekierowanie pozostaje względne, dzięki czemu zachowuje host przeglądarki i sesję PKCE bez ufania nagłówkowi hosta.
- Odpowiedzi mają `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` i ograniczający `Permissions-Policy`; wyłączono nagłówek `X-Powered-By`.
- Lokalne Supabase wymaga hasła o długości co najmniej ośmiu znaków.

### 3.2 — profile, waluty i pełna macierz RLS

- Migracja `202607170001_harden_profile_and_currency.sql` odbiera nadmiarowe uprawnienia tabel i przyznaje wyłącznie potrzebne operacje oraz kolumny profilu.
- Użytkownik może zmieniać tylko `full_name` i `reporting_currency`; nie może zmienić właściciela ani e-maila profilu przez API tabeli.
- PostgreSQL blokuje zmianę waluty raportowej po utworzeniu przesyłek i wymusza kurs `1` dla przesyłki w walucie raportowej.
- Testy RLS obejmują SELECT/INSERT/UPDATE/DELETE dla profilu, klientów, przewoźników i przesyłek, izolację dwóch użytkowników, relacje cross-tenant oraz rolę anonimową.

### 3.3 — obliczenia finansowe, FX i agregacje

- Kwoty są agregowane w jednostkach minor z deterministycznym zaokrąglaniem half-away-from-zero.
- Zysk po konwersji jest liczony jako zaokrąglony przychód minus zaokrąglone koszty, co zachowuje spójność raportów.
- Dashboard, Analytics i statystyki klientów korzystają ze wspólnych czystych obliczeń z wstrzykiwaną datą UTC oraz deterministycznym sortowaniem remisów.
- Testy pokrywają granice zaokrągleń, kursy FX, koszty dodatkowe, marżę ważoną, miesiące UTC, puste dane i rankingi.

### 3.4 — formularze i obsługa błędów

- Chronione mutacje potwierdzają identyfikator zmienionego rekordu i nie zgłaszają sukcesu dla braku dostępu lub pustego wyniku.
- Formularze używają `try/catch/finally`, odzyskują stan po błędzie, pokazują dostępny alert, oznaczają niepoprawne pola i przenoszą fokus do pierwszego błędu.
- Komunikaty auth nie ujawniają szczegółów konta; logowanie błędów ogranicza się do operacji, kodu i bezpiecznego digestu.
- Testy komponentów obejmują walidację oraz stany błędu formularzy auth, katalogów i przesyłek.

### 3.5 — dostępność

- Nawigacja mobilna obsługuje Escape, pułapkę fokusu, fokus początkowy i powrót do przycisku otwierającego.
- Dodano widoczne style `focus-visible`, `aria-current`, etykiety filtrów, podpisy i nagłówki tabel oraz tekstowe odpowiedniki wykresów.
- Usunięto zagnieżdżone linki i przyciski oraz poprawiono semantykę nieaktywnych elementów paginacji.
- Sprawdzone kolory tekstu i akcji mają kontrast co najmniej 4,76:1 na białym tle.

### 3.6 — deterministyczne E2E i CI

- Wspólny fixture tworzy unikalnych użytkowników i dane per projekt/worker; testy nie zależą od kolejności ani danych seed.
- E2E obejmuje auth i recovery, CRUD klientów i przewoźników, chronione usuwanie, pełny cykl przesyłki, puste raporty, FX, zmianę waluty, nagłówki i klawiaturę.
- Playwright w CI używa jednego workera i maksymalnie jednego retry; testy nie są wyłączane ani maskowane wieloma powtórzeniami.
- GitHub Actions uruchamia minimalny lokalny Supabase, `db reset`, `db lint` i pełne E2E oraz zachowuje diagnostykę wyłącznie po błędzie.

### 3.7 — zapytania, indeksy i bundle

- Usunięto `select(*)`; listy pobierają tylko pola potrzebne do statystyk i prezentacji.
- Widoki szczegółowe klienta i przewoźnika filtrują rekord oraz powiązane przesyłki w PostgreSQL zamiast pobierać całe katalogi.
- Statystyki lokalnej bazy potwierdziły użycie indeksów właściciela, daty, klienta i przewoźnika. Mały zbiór nie uzasadnia dodatkowych indeksów.
- Produkcyjny build generuje 26 chunków JavaScript o łącznym niekompresowanym rozmiarze około 1,83 MB; nie wykryto regresji uzasadniającej zmianę architektury bundla.
- Agregacje raportowe pozostają po stronie serwera aplikacji, co jest adekwatne dla obecnej skali portfolio.

### 3.8 — końcowa weryfikacja

| Kontrola | Wynik |
| --- | --- |
| `npm ci` | PASS — 504 pakiety z lockfile |
| `npm run lint` | PASS — 0 błędów |
| `npm run typecheck` | PASS — 0 błędów TypeScript |
| `npm test` | PASS — 11 plików, 34/34 testy |
| `npm run build` | PASS — Next.js 16.2.10, 18 tras |
| `npx supabase db reset` | PASS — wszystkie 3 migracje odtworzone |
| `npx supabase db lint --local` | PASS — brak błędów schematu |
| pełne E2E, przebieg 1 | PASS — 12/12, 1 worker |
| pełne E2E, przebieg 2 | PASS — 12/12, 1 worker |
| `npm audit` | 0 high/critical, 2 moderate |

## Commity Etapu 3

- `e553b57 fix(auth): prevent external callback redirects`
- `453f976 fix(security): add baseline response protections`
- `11e06c6 fix(database): enforce profile and currency invariants`
- `7e5a42f test(security): cover complete rls operation matrix`
- `972600c refactor(reporting): make financial aggregation deterministic`
- `12db68c test(reporting): cover fx rounding and aggregate edges`
- `4794beb fix(actions): reject empty protected mutations`
- `d9d107f fix(auth): preserve callback host with relative redirects`
- `40e57a4 fix(forms): recover cleanly from failed submissions`
- `df06095 test(components): cover form validation and error states`
- `67996e5 fix(a11y): improve keyboard focus and interface semantics`
- `c0cd9bb test(a11y): cover critical keyboard workflows`
- `cc02526 test(e2e): stabilize live workspace workflows`
- `16696c2 ci: run Supabase-backed Playwright checks`
- `72a7c63 perf(data): narrow directory and shipment queries`
- `ccd6633 fix(a11y): remove nested interactive controls`
- końcowy commit dokumentacyjny aktualizujący README, roadmapę i ten raport.

## Znane ograniczenia

- Publiczny deployment nadal działa jako read-only demo bez produkcyjnego Supabase. Hostowane środowisko i produkcyjna weryfikacja należą do Etapu 4.
- `npm audit` zgłasza dwie podatności moderate dotyczące PostCSS `<8.5.10` dołączonego przez najnowszy stabilny Next.js 16.2.10. Npm proponuje wyłącznie nieakceptowalny downgrade do Next 9.3.3; brak podatności high i critical.
- Agregacje katalogów i raportów nadal wymagają odczytu finansowych pól przesyłek użytkownika. Jest to świadoma decyzja dla skali MVP; dopiero pomiary na dużym zbiorze mogą uzasadnić agregacje PostgreSQL.
- Nie dodano własnego rate limitera, ponieważ aplikacja nie ma niestandardowego publicznego endpointu, dla którego przyniósłby mierzalną ochronę; auth korzysta z ograniczeń dostawcy Supabase.

## Elementy niedokończone w Etapie 3

Brak znanych elementów niedokończonych blokujących kryteria Etapu 3. Dwie podatności moderate są jawnie udokumentowanym ograniczeniem zależności bez bezpiecznej dostępnej aktualizacji.
