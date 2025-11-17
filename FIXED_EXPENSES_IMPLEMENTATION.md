# 💰 Implementacja Modułu Stałych Wydatków

## 📋 Przegląd

System "Stałe wydatki" został zaimplementowany zgodnie z wymaganiami. Zastępuje dotychczasowy widżet "Nadchodzące terminy" na dashboardzie nowym, kompletnym systemem zarządzania cyklicznymi kosztami firmy.

## ✅ Zaimplementowane Funkcjonalności

### 1. Model Bazy Danych
- ✅ Model `FixedExpense` w Prisma schema
- ✅ Pola: name, amount, dueDay, category, recurrence, isActive, syncWithCalendar, calendarEventId, notes
- ✅ Relacja z User
- ✅ Indeksy dla optymalizacji zapytań

### 2. API Endpoints
- ✅ `GET /api/fixed-expenses` - Lista stałych wydatków
- ✅ `POST /api/fixed-expenses` - Tworzenie nowego wydatku
- ✅ `GET /api/fixed-expenses/[id]` - Szczegóły pojedynczego wydatku
- ✅ `PATCH /api/fixed-expenses/[id]` - Aktualizacja wydatku
- ✅ `DELETE /api/fixed-expenses/[id]` - Usuwanie wydatku
- ✅ Walidacja z Zod
- ✅ Zabezpieczenie JWT/NextAuth
- ✅ Obsługa błędów

### 3. Komponenty Frontend

#### FixedExpensesWidget (Dashboard)
- ✅ Wyświetla stałe wydatki dla 3 miesięcy (bieżący, +1, +2)
- ✅ Bieżący miesiąc - pogrubiona czcionka
- ✅ Kolejne miesiące - mniejsza czcionka (text-sm)
- ✅ Kliknięcie otwiera modal ze szczegółami
- ✅ Responsywny design

#### FixedExpensesModal
- ✅ Pełna lista wydatków z zakładkami (3 miesiące)
- ✅ Wyświetlanie: nazwa, kwota, dzień płatności, kategoria, cykliczność
- ✅ Menu akcji: Edytuj, Aktywuj/Dezaktywuj, Usuń
- ✅ Przycisk "Dodaj nowy wydatek"
- ✅ Podsumowanie sum dla każdego miesiąca
- ✅ Badge'e dla kategorii z kolorami

#### FixedExpenseForm
- ✅ Formularz z React Hook Form + Zod
- ✅ Pola: nazwa, kwota, dzień płatności, kategoria, cykliczność
- ✅ Switch: aktywny/nieaktywny
- ✅ Switch: synchronizacja z kalendarzem
- ✅ Walidacja w czasie rzeczywistym
- ✅ Komunikaty błędów po polsku
- ✅ Obsługa tworzenia i edycji

#### FixedExpensesCalendarView
- ✅ Widok kalendarzowy z podziałem na dni
- ✅ Wizualizacja wydatków na konkretnych dniach
- ✅ Kolorowe badge'e dla kategorii
- ✅ Nawigacja między miesiącami
- ✅ Suma miesięczna
- ✅ Legenda kategorii

### 4. Custom Hook
- ✅ `useFixedExpenses()` - zarządzanie stanem
- ✅ Funkcje: fetchExpenses, createExpense, updateExpense, deleteExpense, toggleActive
- ✅ Optymistyczne aktualizacje
- ✅ Toast notifications
- ✅ Obsługa błędów
- ✅ Opcjonalne auto-refresh

### 5. Serwis Biznesowy
- ✅ `fixed-expenses.ts` - funkcje pomocnicze
- ✅ `groupExpensesByMonth()` - grupowanie wydatków
- ✅ `calculateMonthTotal()` - obliczanie sum
- ✅ `getUpcomingExpenses()` - wydatki na 3 miesiące
- ✅ Obsługa cykliczności: monthly, quarterly, yearly
- ✅ Predefiniowane kategorie

### 6. Integracja z Google Calendar
- ✅ `google-calendar.ts` - serwis integracji
- ✅ OAuth2 flow dla Google Calendar
- ✅ `createFixedExpenseEvent()` - tworzenie wydarzenia
- ✅ `updateFixedExpenseEvent()` - aktualizacja wydarzenia
- ✅ `deleteFixedExpenseEvent()` - usuwanie wydarzenia
- ✅ Automatyczne odświeżanie tokenów
- ✅ Przypomnienia (email 1 dzień przed, popup 1 godzinę przed)
- ✅ Recurring events (RRULE)

#### API Endpoints dla Kalendarza
- ✅ `GET /api/calendar/google/auth` - Rozpoczęcie OAuth
- ✅ `GET /api/calendar/google/callback` - Obsługa callback
- ✅ `POST /api/calendar/disconnect` - Rozłączenie kalendarza

### 7. Dashboard Integration
- ✅ Zastąpiono kartę "Nadchodzące terminy" widżetem FixedExpensesWidget
- ✅ Pobieranie danych z bazy dla aktywnych wydatków
- ✅ Przekazywanie danych do komponentu

## 🔧 Technologie

### Backend
- **Next.js 14** - App Router
- **Prisma ORM** - baza danych (SQLite/PostgreSQL)
- **NextAuth** - autoryzacja
- **Zod** - walidacja danych
- **Google APIs** - integracja z kalendarzem

### Frontend
- **React 18** - komponenty
- **TypeScript** - type safety
- **TailwindCSS** - styling
- **shadcn/ui** - komponenty UI
- **React Hook Form** - formularze
- **date-fns** - operacje na datach
- **Zustand** (via custom hooks) - zarządzanie stanem

## 📁 Struktura Plików

```
bizops/
├── prisma/
│   └── schema.prisma                    # ✅ Model FixedExpense
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       └── page.tsx             # ✅ Dashboard z widżetem
│   │   └── api/
│   │       ├── fixed-expenses/
│   │       │   ├── route.ts             # ✅ GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts         # ✅ GET, PATCH, DELETE
│   │       └── calendar/
│   │           ├── google/
│   │           │   ├── auth/
│   │           │   │   └── route.ts     # ✅ OAuth start
│   │           │   └── callback/
│   │           │       └── route.ts     # ✅ OAuth callback
│   │           └── disconnect/
│   │               └── route.ts         # ✅ Disconnect
│   ├── components/
│   │   └── dashboard/
│   │       ├── fixed-expenses-widget.tsx           # ✅ Widżet
│   │       ├── fixed-expenses-modal.tsx            # ✅ Modal
│   │       ├── fixed-expense-form.tsx              # ✅ Formularz
│   │       └── fixed-expenses-calendar-view.tsx    # ✅ Kalendarz
│   ├── hooks/
│   │   └── useFixedExpenses.ts          # ✅ Custom hook
│   └── lib/
│       └── services/
│           ├── fixed-expenses.ts        # ✅ Business logic
│           └── google-calendar.ts       # ✅ Calendar API
```

## 🔐 Konfiguracja Google Calendar API

### 1. Utworzenie projektu w Google Cloud Console

1. Przejdź do https://console.cloud.google.com/
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Google Calendar API**:
   - Przejdź do "APIs & Services" > "Enable APIs and Services"
   - Szukaj "Google Calendar API"
   - Kliknij "Enable"

### 2. Konfiguracja OAuth Consent Screen

1. Przejdź do "APIs & Services" > "OAuth consent screen"
2. Wybierz typ użytkownika: **External** (lub Internal dla Google Workspace)
3. Wypełnij wymagane pola:
   - App name: "BizOps"
   - User support email: twój email
   - Developer contact information: twój email
4. Dodaj scopes:
   - `https://www.googleapis.com/auth/calendar.events`
5. Zapisz i kontynuuj

### 3. Utworzenie OAuth Credentials

1. Przejdź do "APIs & Services" > "Credentials"
2. Kliknij "Create Credentials" > "OAuth 2.0 Client ID"
3. Typ aplikacji: **Web application**
4. Nazwa: "BizOps Web Client"
5. Authorized redirect URIs:
   - Dodaj: `http://localhost:3000/api/calendar/google/callback` (dev)
   - Dodaj: `https://twoja-domena.com/api/calendar/google/callback` (prod)
6. Zapisz i pobierz credentials

### 4. Zmienne Środowiskowe

Dodaj do pliku `.env`:

```bash
# Google Calendar API
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 5. Testowanie Integracji

1. Uruchom aplikację
2. Przejdź do Settings (lub dedykowanej strony integracji)
3. Kliknij "Połącz z Google Calendar"
4. Zaloguj się do Google i udziel uprawnień
5. Po powrocie do aplikacji, integracja powinna być aktywna
6. Utwórz nowy stały wydatek z włączoną synchronizacją
7. Sprawdź Google Calendar - powinno pojawić się cykliczne wydarzenie

## 📊 Funkcje Biznesowe

### Obliczanie Cykliczności

Algorytm określa, czy wydatek dotyczy danego miesiąca:

- **Monthly** - każdy miesiąc
- **Quarterly** - co 3 miesiące
- **Yearly** - co 12 miesięcy

### Kategorie Wydatków

Predefiniowane kategorie z kolorami:
- Podatki (czerwony)
- Media (niebieski)
- Abonamenty (fioletowy)
- Ubezpieczenia (zielony)
- Czynsz (żółty)
- Wynagrodzenia (różowy)
- ZUS (pomarańczowy)
- Inne (szary)

## 🎨 UI/UX

### Dashboard Widget
- Kliknięcie na cały widget otwiera modal
- Hover effect z cieniem
- Wskaźnik "Zobacz szczegóły" z chevronem

### Modal
- Zakładki dla 3 miesięcy
- Dropdown menu dla akcji na wydatkach
- Kolorowe badge'e dla kategorii
- Ikona kalendarza dla zsynchronizowanych wydatków
- Footer z podsumowaniem sum

### Formularz
- Real-time validation
- Komunikaty błędów w języku polskim
- Switch components dla boolean values
- Select dropdowns dla kategorii i cykliczności
- Disabled state podczas zapisywania

### Kalendarz
- Grid layout 7x6 (tydzień x tygodnie)
- Dzisiejsza data wyróżniona
- Wydatki jako małe karty na właściwych dniach
- Nawigacja między miesiącami
- Legenda kategorii

## 🔒 Bezpieczeństwo

### API Endpoints
- ✅ Autoryzacja NextAuth session
- ✅ Weryfikacja właściciela zasobu (userId)
- ✅ Walidacja input z Zod
- ✅ Try-catch z informacyjnymi błędami

### Google Calendar
- ✅ OAuth2 z minimal scope (`calendar.events`)
- ✅ Tokeny przechowywane w bazie (powinny być encrypted w prod)
- ✅ Automatyczne odświeżanie tokenów
- ✅ Obsługa błędów bez przerywania głównego flow

### Dane Wrażliwe
⚠️ **Uwaga**: W produkcji należy zaszyfrować:
- `accessToken` w `CalendarIntegration`
- `refreshToken` w `CalendarIntegration`

Rekomendacja: Użyj biblioteki `crypto` lub dedykowanego serwisu szyfrowania (np. AWS KMS).

## 🚀 Deployment

### Przed wdrożeniem na produkcję:

1. **Zmień providera bazy danych na PostgreSQL** (opcjonalnie):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Uruchom migracje**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Skonfiguruj Google OAuth** z produkcyjnym URL

4. **Ustaw zmienne środowiskowe** na serwerze produkcyjnym

5. **Implementuj szyfrowanie tokenów** (rekomendowane)

## 📝 Użytkowanie

### Dla Użytkownika Końcowego

1. **Przeglądanie wydatków**:
   - Kliknij widget "Stałe wydatki" na dashboardzie
   - Zobacz wydatki dla bieżącego i kolejnych 2 miesięcy

2. **Dodawanie nowego wydatku**:
   - Kliknij "Dodaj nowy" w modalu
   - Wypełnij formularz
   - Zaznacz "Synchronizuj z kalendarzem" jeśli chcesz przypomnienia

3. **Edycja wydatku**:
   - Kliknij menu (trzy kropki) przy wydatku
   - Wybierz "Edytuj"
   - Zmień dane i zapisz

4. **Usuwanie wydatku**:
   - Kliknij menu przy wydatku
   - Wybierz "Usuń"
   - Potwierdź usunięcie

5. **Dezaktywacja wydatku** (bez usuwania):
   - Kliknij menu przy wydatku
   - Wybierz "Dezaktywuj"
   - Wydatek przestanie się wyświetlać, ale pozostanie w bazie

6. **Widok kalendarzowy**:
   - Użyj komponentu `FixedExpensesCalendarView`
   - Możesz go dodać jako osobną zakładkę lub sekcję

## 🧪 Testy

### Rekomendowane testy (TODO):

1. **Unit Tests**:
   - Funkcje w `fixed-expenses.ts` (obliczenia, grupowanie)
   - Walidacja Zod schema

2. **Integration Tests**:
   - API endpoints (CRUD operations)
   - Calendar sync flow

3. **E2E Tests**:
   - Dodawanie wydatku przez UI
   - Edycja i usuwanie
   - Synchronizacja z kalendarzem

## 📚 Dokumentacja API

### GET /api/fixed-expenses
**Parametry**:
- `includeInactive=true` (optional) - pobierz także nieaktywne wydatki

**Odpowiedź**: `FixedExpense[]`

### POST /api/fixed-expenses
**Body**:
```typescript
{
  name: string
  amount: number
  dueDay: number (1-31)
  category: string
  recurrence: 'monthly' | 'quarterly' | 'yearly'
  isActive: boolean
  syncWithCalendar: boolean
  notes?: string
}
```

**Odpowiedź**: `FixedExpense`

### PATCH /api/fixed-expenses/[id]
**Body**: Partial<FixedExpense>

**Odpowiedź**: `FixedExpense`

### DELETE /api/fixed-expenses/[id]
**Odpowiedź**: `{ message: string }`

## 🎯 Cel Biznesowy (Osiągnięty)

✅ Użytkownik (właściciel firmy) może:
- Przeglądać koszty z obecnego i przyszłych miesięcy w jednym miejscu
- Łatwo planować płynność finansową
- Synchronizować koszty z kalendarzem Google
- Dodawać i edytować cykliczne płatności w prosty sposób
- Kategoryzować wydatki dla lepszego przeglądu
- Otrzymywać przypomnienia o nadchodzących płatnościach (przez kalendarz)

## 🔄 Możliwe Rozszerzenia

### Krótkoterminowe:
- [ ] Eksport listy wydatków do CSV/PDF
- [ ] Powiadomienia email o zbliżających się płatnościach
- [ ] Statystyki i wykresy wydatków w czasie
- [ ] Import wydatków z pliku

### Długoterminowe:
- [ ] Integracja z Outlook Calendar
- [ ] Automatyczne księgowanie wydatków jako Expenses
- [ ] Predykcja cashflow oparta na stałych wydatkach
- [ ] Alerty o przekroczeniu budżetu
- [ ] Multi-currency support
- [ ] Shared expenses dla zespołów

## 📞 Support

W razie problemów sprawdź:
1. Logi serwera (`console.error`)
2. Logi przeglądarki (DevTools)
3. Toast notifications (komunikaty błędów)
4. Dokumentację Google Calendar API

## ✨ Podsumowanie

System "Stałe wydatki" został w pełni zaimplementowany zgodnie z wymaganiami:
- ✅ Modularny kod z reużywalnymi komponentami
- ✅ TypeScript w całej aplikacji
- ✅ Bezpieczne API z walidacją
- ✅ Responsywny UI z TailwindCSS
- ✅ Integracja z Google Calendar
- ✅ Obsługa błędów i user feedback
- ✅ Polski język w UI i komunikatach

Aplikacja jest gotowa do użytku i testowania!










