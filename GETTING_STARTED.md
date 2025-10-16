# Getting Started - BizOps

## Szybki start

### 1. Zainstaluj zależności

```bash
cd bizops
npm install
```

Jeśli nie masz Node.js, zainstaluj go z https://nodejs.org/ (wersja 18 lub nowsza).

### 2. Skonfiguruj bazę danych

Projekt domyślnie używa SQLite (nie wymaga dodatkowej konfiguracji).

```bash
# Wygeneruj Prisma Client
npx prisma generate

# Uruchom migracje (utworzy plik dev.db)
npx prisma migrate dev --name init

# Załaduj dane testowe
npm run prisma:seed
```

### 3. Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

### 4. Zaloguj się

Po wykonaniu seed, możesz zalogować się danymi testowymi:

- **Email**: `admin@bizops.local`
- **Hasło**: `admin123`

## Przegląd aplikacji

### Dashboard (`/dashboard`)
- Podsumowanie przychodów i kosztów
- Nadchodzące terminy podatkowe
- Ostatnie faktury i koszty

### Faktury (`/invoices`)
- Lista wszystkich faktur
- Filtrowanie i wyszukiwanie
- Widok szczegółów faktury
- TODO: Tworzenie nowych faktur

### Koszty (`/expenses`)
- Ewidencja kosztów
- Lista z załącznikami
- Widok szczegółów kosztu
- TODO: Dodawanie kosztów

### Kalendarz (`/calendar`)
- Terminy podatkowe (VAT, ZUS, PIT)
- Oznaczanie jako "Zrobione"
- Konfigurowalne w Ustawieniach

### Projekty (`/projects`)
- Lista projektów z ikonami
- Tablica Kanban (statyczna)
- Notatki w Markdown
- TODO: Drag & Drop zadań

### Ustawienia (`/settings`)
- Dane firmy (NIP, adres, konto)
- Schemat numeracji faktur
- Stawki VAT
- TODO: Eksport/Import

## Struktura danych (seed)

Po uruchomieniu `npm run prisma:seed`, w bazie znajdziesz:

- **Użytkownik**: admin@bizops.local
- **Ustawienia**: dane firmy, stawki VAT (23%, 8%, 5%, 0%, zw)
- **Projekt**: "Projekt Startowy" z 4 kolumnami Kanban
- **Zadanie**: przykładowe zadanie onboardingowe
- **Terminy podatkowe**: na najbliższe 6 miesięcy (VAT, ZUS, PIT)

## Konfiguracja dla PostgreSQL (opcjonalnie)

Jeśli chcesz użyć PostgreSQL zamiast SQLite:

1. Zainstaluj PostgreSQL lokalnie lub użyj usługi cloudowej

2. Edytuj `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Zaktualizuj plik `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bizops"
   ```

4. Uruchom migracje ponownie:
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

## Narzędzia deweloperskie

### Prisma Studio (przeglądanie bazy danych)

```bash
npm run prisma:studio
```

Otwiera graficzny interfejs do przeglądania i edycji danych w bazie.

### Formatowanie kodu

```bash
npm run format
```

### Linting

```bash
npm run lint
```

### Testy

```bash
# Testy jednostkowe
npm run test

# Testy E2E
npm run test:e2e
```

## Najczęstsze problemy

### Port 3000 jest zajęty

Zmień port w `package.json`:
```json
"dev": "next dev -p 3001"
```

### Błąd przy migracjach Prisma

Usuń plik `prisma/dev.db` i uruchom ponownie:
```bash
rm prisma/dev.db
npx prisma migrate dev
npm run prisma:seed
```

### Nie działa logowanie

Sprawdź czy zmienna `NEXTAUTH_SECRET` jest ustawiona w `.env`:
```
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
```

## Następne kroki

1. **Zapoznaj się z aplikacją** - przejrzyj wszystkie moduły
2. **Przeczytaj IMPLEMENTATION_NOTES.md** - zobacz co jest zrobione, a co TODO
3. **Dodaj pierwsze dane** - skonfiguruj dane swojej firmy w Ustawieniach
4. **Zaimplementuj brakujące funkcje** - formularze, PDF, upload (patrz TODO)

## Wsparcie

Masz pytania? Zajrzyj do:
- `README.md` - ogólna dokumentacja
- `IMPLEMENTATION_NOTES.md` - szczegóły techniczne i TODO
- `src/lib/utils.ts` - funkcje pomocnicze i kalkulacje

---

**Miłego kodowania!** 🚀





