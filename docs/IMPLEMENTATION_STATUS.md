# FreightFlow — stan implementacji

Data ostatniej pełnej weryfikacji: 17 lipca 2026 r.

## Status

Etapy 0, 1 i 2 są ukończone i zweryfikowane. Projekt jest gotowy do rozpoczęcia **Etapu 3 — jakość, bezpieczeństwo i odporność**. W tej iteracji nie rozpoczęto prac należących do Etapu 3 ani etapów późniejszych.

## Ukończony Etap 2

### Klienci

- Pełny create, read, update i delete oparty na Supabase i Server Actions.
- Walidacja kontaktu, e-maila, telefonu i Tax/VAT ID przez Zod.
- Statystyki przesyłek, przychodu w walucie raportowej i ważonej marży.
- Widok szczegółowy z edycją oraz listą powiązanych przesyłek.
- Serwerowe wyszukiwanie, sortowanie i paginacja.
- Czytelny błąd przy próbie usunięcia klienta używanego przez przesyłkę.

### Przewoźnicy

- Pełny create, read, update i delete oparty na Supabase i Server Actions.
- Rating 1–5, walidacja danych kontaktowych, kraju i typu pojazdu.
- Liczba zakończonych przesyłek i widok powiązanych zleceń.
- Serwerowe wyszukiwanie, sortowanie i paginacja.
- Czytelny błąd przy próbie usunięcia przewoźnika używanego przez przesyłkę.

### Shipments

- Lista korzysta z serwerowego wyszukiwania po referencji, trasie i kliencie.
- Dodano serwerowe filtrowanie statusu, sortowanie i paginację.
- Zachowano pełny CRUD, zmianę statusu, obliczenia biznesowe i RLS z Etapu 1.

### Dashboard i Analytics

- Prywatny Dashboard i Analytics nie korzystają z mocków.
- KPI obejmują aktywne i zakończone przesyłki, przychód, koszty, zysk i ważoną marżę.
- Wykres sześciomiesięczny, rozkład statusów, profit per client oraz rankingi klientów i przewoźników powstają z danych użytkownika.
- Empty states nie podstawiają danych portfolio do pustego prywatnego konta.
- Publiczne środowisko bez Supabase nadal działa jako jawnie oznaczone read-only demo.

### Waluta raportowa i FX

- Użytkownik może wybrać PLN, EUR lub USD przed utworzeniem pierwszej przesyłki.
- Formularz wymaga ręcznego kursu wyłącznie dla przesyłki w innej walucie.
- Kurs `exchange_rate_to_base` jest zapisywany z przesyłką jako historyczny snapshot.
- Dashboard, Analytics i statystyki klientów agregują kwoty po zapisanym kursie.
- Zmiana waluty raportowej po utworzeniu przesyłek jest blokowana, aby nie interpretować historycznych snapshotów w innej walucie bazowej.

### Stany i responsywność

- Dostępne są globalne loading/error/not-found states oraz lokalne empty states list i raportów.
- Formularze, tabele, nawigacja, katalogi i raporty zostały przejście E2E na profilach desktop i mobile.

## Zweryfikowane przepływy end-to-end

- rejestracja, logowanie, wylogowanie i password recovery z callbackiem PKCE;
- brak przykładowych przesyłek i klientów na pustym prywatnym koncie;
- CRUD klienta i przewoźnika wraz z ratingiem i edycją;
- utworzenie przesyłki powiązanej z katalogami;
- blokada usunięcia używanego klienta, a następnie poprawne usunięcie po usunięciu przesyłki;
- create, read, pełna edycja, status update i delete przesyłki;
- wyszukiwanie przesyłki po kliencie oraz filtrowanie statusu;
- ustawienie EUR jako waluty raportowej;
- przesyłka USD z ręcznym kursem 0,9 i poprawnymi agregatami EUR na Dashboardzie i Analytics;
- blokada późniejszej zmiany waluty raportowej;
- izolacja użytkowników przez RLS oraz odrzucenie cross-tenant relationships.

## Wyniki końcowych kontroli

| Kontrola | Wynik |
| --- | --- |
| `npm run lint` | PASS — 0 błędów i ostrzeżeń |
| `npm run typecheck` | PASS — 0 błędów TypeScript |
| `npm test` | PASS — 3 pliki, 11 testów |
| `SUPABASE_E2E=true npm run test:e2e -- --workers=1` | PASS — 14/14, desktop i mobile |
| `npm run build` | PASS — produkcyjny build Next.js 16.2.10 |

Testy E2E korzystały z lokalnego Supabase, PostgreSQL, Auth, PostgREST i Mailpit. Nie używały danych mockowych do weryfikacji prywatnego workspace'u.

## Commity Etapu 2

- `1d5dd72 feat(directories): add live client and carrier management`
- `266c8e3 feat(reporting): add live analytics and currency settings`
- `b7a9431 test(directories): cover contact and rating validation`
- `93f4f80 fix(shipments): preserve client search in server filters`
- `692b5ef test(reporting): stabilize analytics assertion`
- końcowy commit dokumentacyjny aktualizujący README, roadmapę i ten raport.

## Znane ograniczenia

- Publiczny deployment Vercel nadal jest read-only demo bez produkcyjnego Supabase. Hostowany Supabase i produkcyjna weryfikacja należą do Etapu 4.
- Waluta raportowa jest świadomie niezmienna po pierwszej przesyłce. Zmiana historycznej waluty bazowej wymagałaby dodatkowej tabeli kursów lub migracji snapshotów.
- Statystyki katalogów i raporty są agregowane po stronie serwera aplikacji. Jest to wystarczające dla obecnego MVP; przy dużych zbiorach należy przenieść agregacje do widoków lub funkcji PostgreSQL.
- Live E2E wymaga lokalnego Dockera i nie jest jeszcze uruchamiane w GitHub Actions. Rozszerzenie CI należy do Etapu 3.

## Elementy niedokończone w Etapie 2

Brak znanych elementów niedokończonych, które blokowałyby kryteria akceptacji Etapu 2.

Eksport, dokumenty, role, publiczne śledzenie, rozbudowana macierz testów bezpieczeństwa i produkcyjny deployment nie należą do Etapu 2 i pozostają w kolejnych etapach roadmapy.
