# FreightFlow — roadmap produktu

Stan roadmapy: Etapy 0–5 są zakończone i zweryfikowane. FreightFlow osiągnął zamknięty zakres funkcjonalny portfolio w wersji 1.1.

## Cel produktu

FreightFlow ma być portfolio-ready aplikacją SaaS dla spedytorów: z bezpiecznym uwierzytelnianiem, izolacją danych organizacji, pełnym obiegiem zlecenia transportowego, katalogiem klientów i przewoźników oraz raportowaniem rentowności. Kod, migracje, testy i dokumentacja mają odzwierciedlać standard aplikacji produkcyjnej, a nie statycznego prototypu.

## Zasady realizacji

- Każdy etap kończy się uruchomieniem lint, typecheck, testów i builda odpowiednich dla zakresu.
- Zmiany są zapisywane w małych commitach zgodnych z Conventional Commits.
- Sekrety, hasła i prywatne dane nie trafiają do repozytorium.
- Interfejs jasno odróżnia dane demonstracyjne od danych trwałych.
- Operacje biznesowe są walidowane po stronie klienta i ponownie po stronie serwera/bazy.
- RLS jest podstawową granicą bezpieczeństwa, a nie wyłącznie filtrem w interfejsie.

## Etap 0 — porządkowanie prototypu

Status: zakończony.

Cel: uczciwie pokazać rzeczywisty stan aplikacji i usunąć elementy sugerujące funkcje, które jeszcze nie działają.

Zakres:

- usunięcie lub zablokowanie atrap przycisków, formularzy i akcji;
- jednoznaczne oznaczenie ekranów korzystających z danych przykładowych;
- usunięcie mylących linków z danych demonstracyjnych do nieistniejących rekordów;
- rozróżnienie demonstracyjnego i prywatnego workspace'u;
- aktualizacja README do rzeczywistego zakresu;
- bezpieczne usunięcie nieużywanych elementów i zależności;
- poprawki oczywistych problemów dostępności i prezentacji.

Kryteria akceptacji:

- żaden widoczny element nie zgłasza fałszywego sukcesu;
- funkcje demonstracyjne są opisane jako read-only/sample data;
- README nie deklaruje niezaimplementowanych funkcji jako gotowych;
- lint, typecheck i build przechodzą.

## Etap 1 — bezpieczny pionowy przepływ przesyłki

Status: zakończony.

Cel: dostarczyć jeden kompletny przepływ end-to-end oparty na prawdziwym Supabase.

Zakres:

- odtwarzalne lokalne środowisko Supabase i migracje PostgreSQL;
- profile powiązane z `auth.users`, tabele klientów, przewoźników i przesyłek;
- granty, constraints, indeksy, klucze obce i Row Level Security;
- rejestracja email/hasło, logowanie, wylogowanie i ochrona prywatnych tras;
- callback PKCE, reset hasła i bezpieczne przekierowania wewnętrzne;
- pobieranie przesyłek z Supabase dla zalogowanego użytkownika;
- tworzenie danych startowych klienta i przewoźnika dla pustego konta;
- tworzenie, odczyt, edycja, zmiana statusu i usuwanie przesyłki;
- wyszukiwanie i filtrowanie listy;
- automatyczne obliczanie zysku i marży w UI oraz bazie;
- odświeżanie danych po mutacjach i obsługa błędów formularza;
- testy przeglądarkowe przepływu auth i CRUD oraz testy izolacji RLS.

Kryteria akceptacji:

- nowy użytkownik może założyć konto, zalogować się i wylogować;
- callback recovery tworzy sesję, a nowe hasło pozwala się zalogować;
- przesyłka przechodzi pełen cykl create → read → edit → status update → delete;
- zmiany są widoczne bez ręcznego przeładowania strony;
- użytkownik nie może odczytać, zmienić ani usunąć danych innego użytkownika;
- nie można powiązać przesyłki z cudzym klientem lub przewoźnikiem;
- nie można usunąć klienta używanego przez przesyłkę;
- lint, typecheck, testy jednostkowe, E2E i build przechodzą.

## Etap 2 — pełny mini-TMS

Status: zakończony i zweryfikowany 17 lipca 2026 r.

Cel: zastąpić pozostałe widoki demonstracyjne kompletnymi modułami operacyjnymi.

Zakres planowany:

- pełny CRUD klientów z walidacją, statystykami i listą powiązanych przesyłek;
- pełny CRUD przewoźników, rating 1–5 i lista wykonanych przesyłek;
- blokowanie usuwania rekordów używanych przez przesyłki z czytelnym komunikatem UI;
- stronicowanie i sortowanie tabel po stronie serwera;
- dynamiczny Dashboard oparty wyłącznie na danych użytkownika;
- dynamiczne Analytics: przychód, koszty, zysk, marża, statusy, top klienci i przewoźnicy;
- ustawienie waluty raportowej PLN/EUR/USD;
- obowiązkowy ręczny kurs dla przesyłki w innej walucie i historyczny snapshot kursu;
- agregowanie raportów w walucie bazowej;
- kompletne empty, loading, error i not-found states;
- responsywne formularze i tabele dla wszystkich modułów.

Kryteria akceptacji:

- w prywatnym workspace nie są używane dane demonstracyjne;
- wszystkie główne moduły mają działający CRUD lub czytelny widok read-only wynikający z uprawnień;
- KPI i wykresy zgadzają się z danymi źródłowymi po konwersji walut;
- testy obejmują walidację relacji, dat, ratingu oraz kursu FX.

## Etap 3 — jakość, bezpieczeństwo i odporność

Status: zakończony i zweryfikowany 17 lipca 2026 r.

Zakres:

- rozszerzone testy jednostkowe obliczeń, walut i agregacji;
- testy komponentów formularzy i stanów błędów;
- pełna macierz testów integracyjnych RLS dla SELECT/INSERT/UPDATE/DELETE;
- E2E krytycznych przepływów klientów, przewoźników, przesyłek i raportów;
- dostępność klawiaturowa, focus management i kontrola kontrastu;
- ocena rate limitingu i bezpieczna obsługa błędów dla wrażliwych operacji;
- przegląd zależności, nagłówków bezpieczeństwa i logowania błędów;
- pomiar wydajności zapytań, użycia indeksów i bundle size oraz celowane poprawki;
- stabilne dane testowe oraz procedura resetu środowiska.

Kryteria akceptacji:

- krytyczne scenariusze mają automatyczne testy regresji;
- brak znanych problemów bezpieczeństwa o wysokiej wadze;
- podstawowe widoki spełniają wymagania dostępności i wydajności portfolio demo.

Wynik realizacji:

- callback auth akceptuje wyłącznie bezpieczne ścieżki względne, a odpowiedzi mają bazowe nagłówki ochronne;
- uprawnienia profilu, integralność waluty raportowej i snapshotów FX są wymuszane również w PostgreSQL;
- pełna macierz RLS obejmuje SELECT/INSERT/UPDATE/DELETE, użytkowników obcych i rolę anonimową;
- obliczenia finansowe, formularze, stany błędów, semantyka i krytyczne przepływy klawiaturowe mają testy regresji;
- GitHub Actions uruchamia jako osobne bramki jakość aplikacji oraz szeregowe E2E na minimalnym lokalnym Supabase po `db reset` i `db lint`;
- pomiary nie uzasadniły nowych indeksów, przenoszenia agregacji do PostgreSQL ani przebudowy bundla; usunięto natomiast `select(*)` i odczyty całych katalogów w widokach szczegółowych;
- nie dodano własnego rate limitera: aplikacja nie wystawia niestandardowego publicznego endpointu wymagającego tej warstwy, a operacje auth korzystają z ochrony Supabase;
- `npm audit` nie wykazuje podatności high ani critical; pozostają dwie moderate w PostCSS dołączonym przez najnowszy stabilny Next.js, bez bezpiecznej aktualizacji oferowanej przez npm.

## Etap 4 — publikacja portfolio

Status: zakończony i zweryfikowany 17 lipca 2026 r.

Zakres:

- produkcyjny projekt Supabase bez sekretów w repozytorium;
- deployment Vercel z poprawnymi zmiennymi i callback URLs;
- bezpieczne konto demonstracyjne i deterministyczny zestaw danych;
- GitHub Actions dla instalacji z lockfile, lint, typecheck, testów i builda;
- profesjonalne zrzuty Dashboard, Shipments i Analytics;
- README z architekturą, funkcjami, setupem, demo i ograniczeniami;
- weryfikacja produkcyjnego auth, RLS, mobile i kluczowego E2E;
- tag release i uporządkowane issues/milestones.

Kryteria akceptacji:

- publiczny URL działa bez konfiguracji po stronie odwiedzającego;
- demo nie ujawnia danych prywatnych i można je bezpiecznie odtworzyć;
- CI jest zielone, README zawiera aktualny link i zrzuty.

Wynik realizacji:

- wszystkie cztery migracje wdrożono do hosted Supabase, a zdalny lint i pełna macierz RLS nie wykazują błędów;
- produkcyjny Vercel korzysta wyłącznie z publicznego URL i publishable key, a callback Auth wskazuje dokładny publiczny adres aplikacji;
- każdy odwiedzający może utworzyć izolowane konto i jednorazowo załadować deterministyczny workspace z 10 przesyłkami, 4 klientami i 4 przewoźnikami;
- hosted E2E potwierdziło desktopowy CRUD, cykl przesyłki, Dashboard, Analytics, FX, izolację użytkowników i nawigację mobilną;
- rejestracja, logowanie, chronione trasy, recovery oraz callback zmiany hasła zostały sprawdzone w produkcji;
- README, rzeczywiste screenshoty, opis, topics i homepage repozytorium przedstawiają aktualny stan publicznego portfolio;
- pełny lokalny zestaw jakości i GitHub Actions pozostają zielone.

## Etap 5 — funkcje wyróżniające

Status: zakończony i zweryfikowany 17 lipca 2026 r.

Zrealizowany zakres:

1. Automatyczna, nieedytowalna historia statusów z osią czasu, właścicielem workspace'u i odrębnym użytkownikiem wykonującym zmianę.
2. Prywatne dokumenty transportowe w Supabase Storage z limitem 6 MiB, kontrolą PDF/JPEG/PNG, przepływem `pending → ready` i izolacją owner/stranger/anon.
3. Eksport CSV respektujący aktualne filtry i RLS, z ochroną przed CSV formula injection.
4. Profesjonalny widok podsumowania zlecenia korzystający z natywnego Print / Save as PDF zamiast generatora PDF.
5. Hosted rollout do Supabase i Vercel, lokalne oraz hosted E2E, aktualne screenshoty i release `v1.1.0`.

Kryteria akceptacji:

- każda rzeczywista zmiana statusu, również przez Data API, tworzy dokładnie jedno zdarzenie, a historia nie jest zapisywalna przez klienta;
- prywatny bucket i metadane dokumentów nie ujawniają danych innemu użytkownikowi ani roli anonimowej;
- upload nie jest gotowy przed poprawnym przejściem `pending → ready`, a klient nie może sam wymusić tego stanu;
- CSV obejmuje wyłącznie dane bieżącego użytkownika zgodne z filtrami i neutralizuje tekst mogący uruchomić formułę;
- podsumowanie zlecenia jest prywatne, czytelne na ekranie i przygotowane do wydruku A4;
- lokalne kontrole, GitHub Actions i testy hosted są zielone.

Wynik realizacji:

- migracja `202607170003_add_shipment_status_events.sql` dodaje audyt statusów wymuszany triggerem PostgreSQL oraz kompozycyjnym kluczem właściciela przesyłki;
- migracja `202607170004_add_shipment_documents.sql` dodaje prywatny bucket, metadane dokumentów, Storage RLS oraz bezpieczne funkcje finalizacji i usuwania metadanych;
- aplikacja nie używa publicznych URL-i Storage, `service_role`, proxy plików przez Vercel ani natywnego generatora PDF;
- agregacje Dashboardu i Analytics pozostały w sprawdzonej warstwie serwerowej TypeScript, ponieważ Etap 5 nie wykazał problemu uzasadniającego zmianę architektury;
- zakres został wdrożony bez nowych zależności, własnego rate limitera, dodatkowych ról i funkcji spoza zaakceptowanego planu.

Dalszy backlog:

- mapa trasy i estymacja dystansu;
- publiczny, ograniczony link śledzenia dla klienta;
- role admin/dispatcher;
- komentarze i powiadomienia;
- dark mode.

Poza zakresem pierwszego MVP pozostają automatyczne kursy walut, rozliczenia/fakturowanie, telematyka i rozbudowane zarządzanie flotą.

## Dalszy rozwój

Aktywny rozwój funkcjonalny może zostać zakończony po wersji 1.1. Pozostałe pomysły nie są wymagane do jakości portfolio i powinny wrócić do planu wyłącznie po pojawieniu się rzeczywistej potrzeby produktu lub pomiarów uzasadniających ich koszt.

## Standard Git i GitHub

- Jeden commit opisuje jeden logiczny rezultat i przechodzi dostępne kontrole.
- Nazwy commitów używają `feat:`, `fix:`, `test:`, `docs:`, `ci:` lub `chore:`.
- Pull request zawiera zakres, sposób weryfikacji, migracje i zrzuty zmian UI.
- Issues są grupowane milestone'ami odpowiadającymi etapom roadmapy.
- Dokument statusu jest aktualizowany przy zamknięciu każdego etapu.
