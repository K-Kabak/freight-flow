# FreightFlow — stan implementacji

Data weryfikacji: 16 lipca 2026 r.

## Status

Etap 0 i Etap 1 są ukończone i zweryfikowane. Następnym krokiem jest **Etap 2 — pełny mini-TMS**. Etap 2 ani żaden późniejszy etap nie został rozpoczęty w ramach tej iteracji.

## Ukończony zakres

### Etap 0

- Usunięto atrapowe akcje globalnego wyszukiwania, eksportu, powiadomień i niezapisujących ustawień.
- Usunięto formularze klientów i przewoźników, które wcześniej tylko pokazywały fałszywy sukces; bezpośrednie adresy wracają do oznaczonych widoków demonstracyjnych.
- Dashboard i Analytics jednoznacznie opisują KPI oraz wykresy jako dane przykładowe.
- Usunięto mylące linki z przykładowych rekordów Dashboard do nieistniejących danych użytkownika.
- Sidebar rozróżnia read-only demo od prywatnego workspace'u Supabase.
- README opisuje stan faktyczny, lokalny setup, zakres live CRUD i ograniczenia wdrożonego demo.

### Etap 1

- Dodano odtwarzalny lokalny stack Supabase oraz migracje schematu i grantów.
- Skonfigurowano tabele `profiles`, `clients`, `carriers`, `shipments`, typy enum, constraints, indeksy, triggery, klucze obce i generowane pola finansowe.
- Włączono RLS dla wszystkich tabel; rekordy biznesowe należą do użytkownika Supabase Auth.
- Zaimplementowano rejestrację, logowanie, wylogowanie, ochronę tras, reset hasła i callback PKCE.
- Callback akceptuje wyłącznie bezpieczne przekierowania wewnętrzne i uwzględnia publiczny host za proxy.
- Lista przesyłek pobiera prawdziwe dane z Supabase w skonfigurowanym środowisku.
- Dla pustego konta można utworzyć kontrolowany zestaw startowy klienta i przewoźnika.
- Zaimplementowano create, read, edit, status update i delete dla przesyłek.
- Formularz pokazuje zysk i marżę, a baza ponownie wylicza te wartości.
- Po mutacjach UI odświeża dane przez revalidation/router refresh.
- Działają wyszukiwanie, filtr statusu, walidacja Zod, komunikaty błędów i potwierdzenie usuwania.

## Zweryfikowane przepływy

- Rejestracja przez UI i automatyczne wejście do workspace'u przy wyłączonym potwierdzaniu e-mail.
- Wylogowanie i ponowne logowanie hasłem.
- Wysłanie wiadomości recovery, przejście przez rzeczywisty lokalny link Mailpit, callback PKCE, ustawienie nowego hasła i logowanie nowym hasłem.
- Ochrona prywatnych tras i sesja utrzymywana w cookies.
- Pobranie przesyłek z prawdziwego lokalnego Supabase.
- Utworzenie katalogu startowego, utworzenie przesyłki, wyświetlenie jej na liście, pełna edycja, zmiana statusu i usunięcie.
- Natychmiastowa aktualizacja listy po każdej mutacji.
- Izolacja RLS: drugi użytkownik nie odczytuje ani nie modyfikuje klienta oraz nie odczytuje ani nie usuwa przesyłki właściciela.
- Odrzucenie przesyłki próbującej użyć klienta i przewoźnika innego użytkownika.
- Blokada usunięcia klienta posiadającego powiązaną przesyłkę.
- Responsywny przebieg auth i shipment lifecycle na profilu desktopowym i mobilnym.

## Wyniki kontroli

Wszystkie kontrole zakończyły się powodzeniem 16 lipca 2026 r.:

| Kontrola | Wynik |
| --- | --- |
| `npm run lint` | PASS — 0 błędów |
| `npm run typecheck` | PASS — 0 błędów TypeScript |
| `npm test` | PASS — 2 pliki, 8 testów |
| `SUPABASE_E2E=true npm run test:e2e -- --workers=1` | PASS — 10/10, desktop i mobile |
| Rozszerzony test RLS po dodaniu asercji bezpieczeństwa | PASS — 2/2, desktop i mobile |
| `npm run build` | PASS — produkcyjny build Next.js 16.2.10 |

E2E działało na lokalnym Supabase, nie na mockach. Test recovery odczytał wiadomość z lokalnego Mailpit i użył wygenerowanego linku w przeglądarce.

## Commity Etapu 0 i 1

- `5e58966 chore: clarify demo-only application features`
- `46fb215 chore(supabase): add reproducible local development setup`
- `99c9c5f fix(types): align database types with Supabase schema`
- `9cb1aaa feat(auth): complete session and password recovery flows`
- `93af504 feat(shipments): connect lifecycle to Supabase`
- `f82c3c9 test(shipments): cover live CRUD and tenant isolation`
- `232603e feat(shipments): add starter directory onboarding`
- `6dc2f63 test(shipments): verify complete edit workflow`
- `659044a docs(readme): document authenticated shipment milestone`
- `a9aeac3 fix(ui): remove remaining placeholder interactions`
- `1c3fb75 fix(auth): complete registration and recovery flows`
- `5bb0e8a test(security): expand tenant isolation coverage`
- Końcowy commit dokumentacyjny zawierający ten raport i roadmapę.

## Znane problemy i ograniczenia

- Publiczny deployment Vercel pozostaje read-only demo, ponieważ nie podłączono jeszcze produkcyjnego projektu Supabase. Pełny Etap 1 jest zweryfikowany lokalnie.
- Dashboard, Analytics, Clients, Carriers i Settings nadal pokazują jawnie oznaczone dane lub formularze demonstracyjne/read-only; ich podłączenie należy do Etapu 2.
- Lokalne uruchomienie pełnego zestawu usług Supabase na Windows może zgłosić problem health check usługi Storage. Zakres Etapu 1 nie używa Storage; wymagane usługi Auth, Postgres, PostgREST, Kong i Mailpit działają poprawnie.
- GitHub Actions wykonuje lint, typecheck, testy jednostkowe i build. Testy live Supabase/E2E wymagają osobnego środowiska Docker i obecnie są uruchamiane lokalnie.

## Elementy niedokończone w Etapie 0 i 1

Brak znanych niedokończonych elementów blokujących kryteria akceptacji Etapu 0 lub Etapu 1.

Funkcje nieobjęte tymi etapami — CRUD klientów/przewoźników, live Dashboard/Analytics, waluta raportowa, snapshot FX, paginacja i produkcyjny Supabase — są świadomie pozostawione do Etapu 2 i kolejnych etapów, a interfejs nie przedstawia ich jako gotowych.
