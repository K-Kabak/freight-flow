# FreightFlow — stan implementacji

Data ostatniej pełnej weryfikacji: 17 lipca 2026 r.

## Status

Etapy 0, 1, 2, 3, 4 i 5 są ukończone i zweryfikowane. FreightFlow działa jako publiczny projekt portfolio z hosted Supabase i produkcyjnym deploymentem Vercel. Wersja 1.1 domyka aktywny rozwój funkcjonalny; dalsze elementy roadmapy pozostają opcjonalnym backlogiem.

## Ukończony Etap 5

### 5.0 — bezpieczne domknięcie Etapu 4

- Ponownie potwierdzono hash i zawartość stasha bezpieczeństwa utworzonego przed Etapem 4; zawierał wyłącznie nieaktualne regresje i nie zawierał wartościowego drzewa untracked.
- Usunięto wyłącznie zweryfikowany stash, bez przywracania jakiejkolwiek jego części.
- Potwierdzono istniejący tag i GitHub Release `v1.0.0` dla zakończonego Etapu 4.

### 5.1 — automatyczna historia statusów

- Migracja `202607170003_add_shipment_status_events.sql` dodaje tabelę `shipment_status_events`, w której `user_id` oznacza właściciela danych/workspace'u, a `changed_by` użytkownika wykonującego zmianę.
- Kompozycyjny klucz obcy `(shipment_id, user_id)` wymusza, że właściciel zdarzenia zawsze odpowiada właścicielowi przesyłki; trigger ustawia oba pola i klient nie może nimi manipulować.
- Trigger PostgreSQL zapisuje zmianę również wykonaną bezpośrednio przez Data API. INSERT przesyłki tworzy jedno zdarzenie `created`, rzeczywista zmiana statusu jedno `changed`, a zapis tego samego statusu lub innych pól nie tworzy zdarzenia.
- Zdarzenia są nieedytowalne: authenticated ma wyłącznie SELECT własnych rekordów, a INSERT/UPDATE/DELETE są odebrane. Timeline pokazuje chronologię, status i aktora albo jawne zdarzenie systemowe.

### 5.2 — prywatne dokumenty transportowe

- Migracja `202607170004_add_shipment_documents.sql` tworzy prywatny bucket `shipment-documents`, tabelę metadanych, polityki Storage RLS i indeks listowania dokumentów przesyłki.
- Ścieżka obiektu ma postać `{ownerId}/{shipmentId}/{documentId}` i jest powiązana z istniejącą, własną przesyłką. Bucket oraz baza akceptują wyłącznie PDF/JPEG/PNG do 6 MiB.
- Przeglądarka wysyła plik bezpośrednio do Supabase Storage. Aplikacja nie używa `service_role`, publicznych URL-i ani Vercel Function jako proxy pliku.
- Metadane zaczynają w stanie `pending`; funkcja `finalize_shipment_document` przełącza je na `ready` dopiero po potwierdzeniu obiektu i właściciela w Storage. Klient nie ma uprawnienia UPDATE ani możliwości wstawienia rekordu jako `ready`.
- Usuwanie najpierw usuwa obiekt, a następnie wywołuje funkcję, która odmawia usunięcia metadanych, jeżeli obiekt nadal istnieje. Przesyłki z dokumentami są chronione przed przypadkowym usunięciem.
- Testy owner/stranger/anon obejmują upload, finalizację, odczyt, download, delete, zły MIME, przekroczenie limitu, próbę wymuszenia `ready` i izolację metadanych oraz obiektów.

### 5.3 — CSV i Print / Save as PDF

- Eksport `/shipments/export` działa w uwierzytelnionej sesji, przez RLS, obejmuje wszystkie rekordy zgodne z aktywnymi filtrami `q`, `status` i `sort` oraz pobiera je stabilnie w partiach.
- Każde pole tekstowe CSV jest cytowane, a wartości rozpoczynające się po białych znakach od `=`, `+`, `-` lub `@` otrzymują bezpieczny prefiks chroniący przed CSV formula injection.
- Prywatny widok `/shipments/[id]/summary` przedstawia trasę, strony, daty, status, finanse, snapshot FX i notatki w układzie A4.
- PDF jest realizowany przez natywny mechanizm przeglądarki Print / Save as PDF. Nie dodano biblioteki ani serwerowego generatora PDF.
- E2E potwierdza filtrowanie CSV, brak danych drugiego użytkownika, neutralizację formuł, prywatność podsumowania i wywołanie drukowania.

### 5.4 — hosted rollout i zamknięcie

- Migracje `202607170003` i `202607170004` wdrożono do linked hosted Supabase; lokalna i zdalna historia migracji są zgodne, a hosted `db lint` nie zgłasza błędów.
- Produkcyjny deployment Vercel jest gotowy i przypięty do `https://freight-flow-tau.vercel.app`.
- Hosted E2E historii, dokumentów, CSV i podsumowania przeszło 3/3. Dane biznesowe tymczasowych kont są sprzątane własnym tokenem użytkownika, bez uprawnień administracyjnych.
- CI uruchamia Storage razem z minimalnym Supabase, dzięki czemu test dokumentów nie jest pomijany ani maskowany retry.
- Screenshoty Dashboardu, listy przesyłek, Analytics, szczegółów z dokumentem/timeline oraz podsumowania są generowane przez Playwright.
- Release `v1.1.0` wskazuje zweryfikowany commit zamykający Etap 5.

### Końcowa weryfikacja Etapu 5

| Kontrola | Wynik |
| --- | --- |
| `npm run lint` | PASS — 0 błędów |
| `npm run typecheck` | PASS — 0 błędów TypeScript |
| `npm test` | PASS — 16 plików, 52/52 testy |
| `npm run build` | PASS — Next.js 16.2.10, 19 tras |
| lokalny `npx supabase db reset` | PASS — wszystkie 6 migracji i seed globalny |
| lokalny `npx supabase db lint --local` | PASS — brak błędów schematu |
| lokalne E2E | PASS — 16/16 aktywnych; 3 jawnie bramkowane testy hosted/screenshot pominięte |
| hosted E2E Etapu 5 | PASS — historia, dokumenty, CSV i podsumowanie, 3/3 |
| hosted `npx supabase db lint --linked` | PASS — brak błędów schematu |
| screenshot workflow | PASS — 1/1, pięć aktualnych ekranów |
| GitHub Actions | PASS — `quality` i Storage-backed `e2e` |
| `npm audit` | 0 high/critical, 2 moderate |
| skan śledzonych plików pod kątem sekretów | PASS — brak dopasowań |

### Commity Etapu 5

- `2ccf557 feat(database): add shipment status audit trail`
- `0bdd93c chore(database): normalize audit migration`
- `9c3014f feat(shipments): render status history timeline`
- `427dd09 test(security): verify immutable status history`
- `fb2b2c4 feat(storage): add private shipment document model`
- `07a3290 chore(storage): normalize document validation`
- `40a6252 feat(shipments): manage private transport documents`
- `cda5f14 test(security): verify private document isolation`
- `dbbd297 feat(shipments): export filtered shipments as safe CSV`
- `8323717 feat(shipments): add printable order summary`
- `a1fa5e4 test(e2e): verify private exports and summaries`
- `e08bd9c test(e2e): stabilize hosted feature verification`
- `1d69c2b docs(portfolio): showcase stage five features`
- końcowy commit dokumentacyjny aktualizujący media, README, roadmapę i ten raport.

### Znane ograniczenia Etapu 5

- Kontrola typu pliku opiera się na dozwolonym MIME deklarowanym przy uploadzie i prywatnym modelu zaufania właściciela; aplikacja nie wykonuje skanowania antywirusowego ani analizy sygnatur pliku.
- Limit pojedynczego dokumentu wynosi świadomie 6 MiB, a upload nie ma wznawiania fragmentowego. Jest to adekwatne dla PDF/JPEG/PNG w portfolio mini-TMS.
- Save as PDF korzysta z możliwości przeglądarki i nie tworzy archiwalnego, podpisanego dokumentu serwerowego.
- Hosted testy tworzą unikalne konta Auth; ich dane biznesowe są sprzątane, ale samodzielne usunięcie konta Auth nie jest udostępnione klientowi bez uprawnień administracyjnych.

### Elementy niedokończone w Etapie 5

Brak elementów niedokończonych w zaakceptowanym zakresie 5.0–5.4. Mapy, public tracking, role admin/dispatcher, komentarze, powiadomienia i dark mode świadomie pozostają poza zakresem i nie są wymagane do zamknięcia aktywnego rozwoju funkcjonalnego.

## Ukończony Etap 4

### 4.1 — stan publikacji i strategia demo

- Repozytorium rozpoczęło etap z `HEAD = origin/master = eefe0e7`; niezamierzone lokalne zmiany wraz z plikami untracked zabezpieczono w `stash@{0}` i nie przywracano ich do kodu Etapu 4.
- Zamiast współdzielonego hasła każdy odwiedzający tworzy własne konto chronione RLS.
- Puste konto może jednorazowo wywołać atomową funkcję `create_sample_workspace`, która tworzy 4 klientów, 4 przewoźników i 10 realistycznych przesyłek w PLN, EUR i USD.
- Funkcja jest `security invoker`, respektuje RLS, blokuje wywołania anonimowe i ponowne seedowanie oraz nie zawiera identyfikatorów użytkowników ani danych logowania.

### 4.2 — hosted Supabase

- Repozytorium połączono z projektem `freight-flow` w regionie `eu-west-2`.
- Wdrożono migracje `202607120001`, `202607160001`, `202607170001` i `202607170002`; lokalna i zdalna historia migracji są zgodne.
- Hosted `db lint` nie wykazał błędów w schematach `extensions` ani `public`.
- Auth używa produkcyjnego `site_url`, dokładnego callbacku Vercel i dwóch jawnych callbacków lokalnych; minimalna długość hasła wynosi 8 znaków.
- Wyłączono nieużywane vector storage, które nie należy do zakresu aplikacji i wymagałoby płatnego planu.
- Pełna macierz RLS uruchomiona przez publiczne Data API przeszła 3/3 testy, obejmując właściciela, obcego użytkownika, anonimową rolę, relacje cross-tenant oraz integralność walut i FX.

### 4.3 — produkcyjny Vercel i Auth

- Produkcja działa pod `https://freight-flow-tau.vercel.app` i używa hosted Supabase przez publiczny URL oraz publishable key przechowywane w Vercel.
- Aplikacja nie korzysta z `service_role` ani innego prywatnego klucza.
- Anonimowy użytkownik otrzymuje ekran logowania, a Dashboard i Analytics przekierowują do `/login`.
- Rejestracja, logowanie, wylogowanie, żądanie recovery, callback, ustawienie nowego hasła i ponowne logowanie zostały zweryfikowane w hosted środowisku.
- Błędny callback kończy się kontrolowanym przekierowaniem `invalid_callback`; odpowiedzi zachowują nagłówki bezpieczeństwa Etapu 3.

### 4.4 — hosted E2E i urządzenia mobilne

- Desktopowy hosted E2E potwierdza CRUD klientów i przewoźników, utworzenie, edycję, zmianę statusu i usunięcie przesyłki, Dashboard, Analytics oraz izolację dwóch kont.
- Mobilny hosted E2E potwierdza logowanie, otwieranie dostępnej nawigacji i przejście do Analytics na profilu Pixel 7.
- Osobny przebieg rekrutera potwierdził rejestrację w UI, utworzenie danych demo, obecność 10 przesyłek i blokadę ponownego seedowania.
- Testy używają unikalnych kont i rekordów; dane biznesowe głównego hosted E2E są sprzątane w `finally`, bez maskowania problemów wieloma retry.

### 4.5 — prezentacja portfolio i GitHub

- README opisuje funkcje, architekturę, RLS, testy, setup lokalny, publiczne demo i sposób utworzenia prywatnych danych przykładowych.
- Screenshoty Dashboard, Shipments i Analytics są generowane odtwarzalnym testem Playwright z rzeczywistego renderu i fikcyjnych danych.
- Repozytorium GitHub ma aktualny opis, właściwe topics i homepage prowadzący do działającego demo; nie utworzono sztucznych issues ani milestone'ów.

### 4.6 — końcowa weryfikacja

| Kontrola | Wynik |
| --- | --- |
| `npm run lint` | PASS — 0 błędów |
| `npm run typecheck` | PASS — 0 błędów TypeScript |
| `npm test` | PASS — 11 plików, 34/34 testy |
| `npm run build` | PASS — Next.js 16.2.10, 18 tras |
| lokalny `npx supabase db reset` | PASS — wszystkie 4 migracje i seed globalny |
| lokalny `npx supabase db lint --local` | PASS — brak błędów schematu |
| lokalne E2E | PASS — 13/13 aktywnych; 3 jawnie bramkowane testy portfolio/hosted pominięte |
| hosted E2E desktop/mobile | PASS — 2/2 |
| hosted pełna macierz RLS | PASS — 3/3 |
| hosted `npx supabase db lint --linked` | PASS — brak błędów schematu |
| GitHub Actions dla `c955279` | PASS — `quality` i `e2e` |
| `npm audit` | 0 high/critical, 2 moderate |
| skan śledzonych plików pod kątem sekretów | PASS — brak dopasowań |

## Commity Etapu 4

- `89326a7 docs: start stage four publication`
- `bb9e1f0 feat(demo): add isolated sample workspaces`
- `b9472cc test(demo): verify isolated sample workspace setup`
- `9e9e4f1 test(e2e): add hosted deployment verification`
- `236b50b test(portfolio): make screenshots reproducible`
- `43b31da docs(portfolio): refresh application screenshots`
- `168d757 chore(auth): declare production redirect URLs`
- `2ba151e fix(supabase): disable unused vector storage`
- `c955279 test(e2e): match mobile navigation semantics`

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

- Hosted Supabase używa domyślnej usługi e-mail. Recovery zweryfikowano end-to-end dla autoryzowanego adresu właściciela projektu, ale niezawodne doręczanie do dowolnych publicznych adresów wymagałoby skonfigurowania własnego SMTP.
- `npm audit` zgłasza dwie podatności moderate dotyczące PostCSS `<8.5.10` dołączonego przez najnowszy stabilny Next.js 16.2.10. Npm proponuje wyłącznie nieakceptowalny downgrade do Next 9.3.3; brak podatności high i critical.
- Agregacje katalogów i raportów nadal wymagają odczytu finansowych pól przesyłek użytkownika. Jest to świadoma decyzja dla skali MVP; dopiero pomiary na dużym zbiorze mogą uzasadnić agregacje PostgreSQL.
- Nie dodano własnego rate limitera, ponieważ aplikacja nie ma niestandardowego publicznego endpointu, dla którego przyniósłby mierzalną ochronę; auth korzysta z ograniczeń dostawcy Supabase.

## Elementy niedokończone w Etapie 3

Brak znanych elementów niedokończonych blokujących kryteria Etapu 3. Dwie podatności moderate są jawnie udokumentowanym ograniczeniem zależności bez bezpiecznej dostępnej aktualizacji.

## Elementy niedokończone w Etapie 4

Brak elementów blokujących publikację portfolio. Własny SMTP i bezpieczna przyszła aktualizacja zależności są udokumentowanymi zadaniami operacyjnymi, ale nie obniżają jakości demonstracji podstawowych przepływów FreightFlow.
