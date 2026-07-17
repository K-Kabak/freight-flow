# FreightFlow — roadmap produktu

Stan roadmapy: zaakceptowana. Etapy 0–2 są zakończone i zweryfikowane. Kolejne prace rozpoczynają się od Etapu 3.

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

Status: planowany.

Zakres:

- rozszerzone testy jednostkowe obliczeń, walut i agregacji;
- testy komponentów formularzy i stanów błędów;
- pełna macierz testów integracyjnych RLS dla SELECT/INSERT/UPDATE/DELETE;
- E2E krytycznych przepływów klientów, przewoźników, przesyłek i raportów;
- dostępność klawiaturowa, focus management i kontrola kontrastu;
- rate limiting i bezpieczna obsługa błędów dla wrażliwych endpointów;
- przegląd zależności, nagłówków bezpieczeństwa i logowania błędów;
- poprawa wydajności zapytań, indeksów i bundle size;
- stabilne dane testowe oraz procedura resetu środowiska.

Kryteria akceptacji:

- krytyczne scenariusze mają automatyczne testy regresji;
- brak znanych problemów bezpieczeństwa o wysokiej wadze;
- podstawowe widoki spełniają wymagania dostępności i wydajności portfolio demo.

## Etap 4 — publikacja portfolio

Status: planowany.

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

## Etap 5 — funkcje wyróżniające

Status: backlog po MVP.

Priorytetowe rozszerzenia:

1. Historia zmian statusu z osią czasu i użytkownikiem wykonującym zmianę.
2. Dokumenty transportowe w Supabase Storage z kontrolą dostępu.
3. Eksport CSV/PDF i profesjonalne podsumowanie zlecenia.

Dalszy backlog:

- mapa trasy i estymacja dystansu;
- publiczny, ograniczony link śledzenia dla klienta;
- role admin/dispatcher;
- komentarze i powiadomienia;
- dark mode.

Poza zakresem pierwszego MVP pozostają automatyczne kursy walut, rozliczenia/fakturowanie, telematyka i rozbudowane zarządzanie flotą.

## Najbliższe priorytety

Następnym krokiem jest Etap 3. Priorytety obejmują rozszerzenie macierzy testów RLS, testy komponentów formularzy, przegląd dostępności, bezpieczeństwa i wydajności oraz przygotowanie stabilnego środowiska E2E w CI.

## Standard Git i GitHub

- Jeden commit opisuje jeden logiczny rezultat i przechodzi dostępne kontrole.
- Nazwy commitów używają `feat:`, `fix:`, `test:`, `docs:`, `ci:` lub `chore:`.
- Pull request zawiera zakres, sposób weryfikacji, migracje i zrzuty zmian UI.
- Issues są grupowane milestone'ami odpowiadającymi etapom roadmapy.
- Dokument statusu jest aktualizowany przy zamknięciu każdego etapu.
