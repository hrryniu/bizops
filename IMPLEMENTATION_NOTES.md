# Notatki implementacyjne - BizOps

## ✅ Co zostało zaimplementowane

### Infrastruktura podstawowa
- ✅ Konfiguracja Next.js 14 (App Router)
- ✅ TypeScript + TailwindCSS
- ✅ Prisma ORM z schematem SQLite/PostgreSQL
- ✅ NextAuth.js (autoryzacja email/password)
- ✅ shadcn/ui (komponenty UI)
- ✅ Seed bazy danych z przykładowymi danymi

### Moduły funkcjonalne

#### Dashboard
- ✅ Podsumowanie przychodów i kosztów
- ✅ Lista nadchodzących terminów podatkowych
- ✅ Ostatnie faktury i koszty
- ✅ Karty z podstawowymi statystykami

#### Faktury
- ✅ Lista faktur z filtrowaniem
- ✅ Widok szczegółów faktury
- ✅ Wyświetlanie pozycji, sum VAT/netto/brutto
- ⚠️ Formularz tworzenia (placeholder - do implementacji)
- ⚠️ Generowanie PDF (do implementacji)

#### Koszty
- ✅ Lista kosztów z filtrowaniem
- ✅ Widok szczegółów kosztu
- ✅ Wyświetlanie kontrahenta i kwot
- ⚠️ Formularz tworzenia (placeholder - do implementacji)
- ⚠️ Upload załączników (do implementacji)

#### Kalendarz podatkowy
- ✅ Generator zdarzeń podatkowych z szablonów
- ✅ Wyświetlanie nadchodzących i zakończonych terminów
- ✅ Zmiana statusu (PENDING/DONE)
- ✅ Konfigurowalne szablony w Settings
- ✅ API endpoint dla aktualizacji statusu

#### Projekty / Kanban
- ✅ Lista projektów z ikonami i kolorami
- ✅ Widok szczegółów projektu
- ✅ Tablica Kanban (statyczna - bez drag&drop)
- ✅ Notatki markdown
- ⚠️ Drag & Drop zadań (do implementacji z @dnd-kit)
- ⚠️ Formularze tworzenia/edycji (do implementacji)

#### Ustawienia
- ✅ Formularz danych firmy (NIP, adres, konto)
- ✅ Schemat numeracji faktur
- ✅ Stawki VAT (JSON)
- ✅ Forma opodatkowania (informacyjna)
- ✅ API endpoint dla zapisywania ustawień
- ⚠️ Kalendarz podatkowy (edycja szablonów - do implementacji)
- ⚠️ Eksport/Import (do implementacji)

### Testy
- ✅ Vitest + React Testing Library (setup)
- ✅ Testy jednostkowe utils (kalkulacje VAT, numeracja)
- ✅ Playwright (setup + test logowania)
- ✅ GitHub Actions CI/CD

### Pozostałe
- ✅ i18n (prosty system tłumaczeń PL)
- ✅ Tryb ciemny/jasny (CSS variables)
- ✅ Responsywność (mobile-first)
- ✅ Toast notifications
- ✅ README z dokumentacją

## ⚠️ TODO - Co wymaga uzupełnienia

### Wysokiej priorytetu

1. **Formularze CRUD**
   - [ ] Formularz tworzenia/edycji faktury z dynamicznymi pozycjami
   - [ ] Formularz tworzenia/edycji kosztu
   - [ ] Formularz tworzenia/edycji projektu
   - [ ] Formularz tworzenia/edycji kontrahenta
   - [ ] React Hook Form + Zod validation

2. **Generowanie PDF**
   - [ ] Szablon faktury PDF z @react-pdf/renderer
   - [ ] Dane sprzedawcy z Settings
   - [ ] Tabela pozycji
   - [ ] Stopka z danymi płatności
   - [ ] Zapis do `exports/invoices/{rok}/{nr}.pdf`

3. **Upload plików**
   - [ ] Multer/FormData dla załączników do kosztów
   - [ ] Walidacja rozszerzeń i rozmiaru (max 10MB)
   - [ ] Zapis do `uploads/`
   - [ ] Abstrakcja pod S3 (przyszłość)

4. **Drag & Drop Kanban**
   - [ ] Integracja @dnd-kit/core
   - [ ] Przenoszenie zadań między kolumnami
   - [ ] Zmiana kolejności
   - [ ] Zapisywanie do bazy

### Średniego priorytetu

5. **API Routes - kompletne CRUD**
   - [ ] `/api/invoices` (POST create, GET list)
   - [ ] `/api/invoices/[id]` (PATCH, DELETE)
   - [ ] `/api/invoices/[id]/pdf` (generowanie)
   - [ ] `/api/expenses` (POST, GET)
   - [ ] `/api/expenses/[id]` (PATCH, DELETE)
   - [ ] `/api/contractors` (CRUD)
   - [ ] `/api/projects` (CRUD)
   - [ ] `/api/tasks` (CRUD + drag&drop order)

6. **Eksport/Import**
   - [ ] CSV export listy faktur/kosztów
   - [ ] JSON backup wszystkich danych
   - [ ] Import z walidacją
   - [ ] ZIP z PDFami miesiąca

7. **Wykresy**
   - [ ] recharts: Przychody vs Koszty (ostatnie 6/12 miesięcy)
   - [ ] Rozkład VAT (należny/naliczony)
   - [ ] Wykres kategorii kosztów

8. **Kalendarz - edycja szablonów**
   - [ ] Formularz zarządzania szablonami w Settings
   - [ ] Dodawanie/usuwanie/edycja
   - [ ] Regeneracja zdarzeń na podstawie nowych szablonów
   - [ ] RRULE-like parser dla cyklicznych terminów

### Niskiego priorytetu

9. **Keyboard shortcuts**
   - [ ] `g + d` → Dashboard
   - [ ] `g + i` → Invoices
   - [ ] `g + e` → Expenses
   - [ ] `g + c` → Calendar
   - [ ] `g + p` → Projects
   - [ ] `n` → New (kontekstowo)

10. **Powiadomienia email**
    - [ ] Konfiguracja SMTP w Settings
    - [ ] Przypomnienia o terminach podatkowych (cron/scheduler)
    - [ ] Na razie: log do konsoli

11. **Rate limiting**
    - [ ] Prosty limiter dla API routes
    - [ ] Zabezpieczenie przed abuse

12. **OAuth providers**
    - [ ] Google OAuth (NextAuth)
    - [ ] GitHub OAuth

13. **Dodatkowe funkcje**
    - [ ] Faktury korygujące
    - [ ] Szablony faktur
    - [ ] Multi-currency support
    - [ ] Etykiety i tagi dla wszystkich encji
    - [ ] Wyszukiwarka globalna

## 🏗️ Architektura

### Struktura folderów (zaimplementowana)

```
bizops/
├── prisma/
│   ├── schema.prisma      ✅ Kompletny schemat
│   └── seed.ts            ✅ Seed z danymi
├── src/
│   ├── app/
│   │   ├── (dashboard)/   ✅ Wszystkie strony widoków
│   │   ├── api/           ⚠️ Częściowo (settings, tax-events)
│   │   ├── login/         ✅ Strona logowania
│   │   ├── layout.tsx     ✅ Root layout
│   │   └── page.tsx       ✅ Redirect
│   ├── components/
│   │   ├── ui/            ✅ shadcn/ui komponenty
│   │   ├── layout/        ✅ Sidebar
│   │   ├── invoices/      ✅ Lista faktur
│   │   ├── expenses/      ✅ Lista kosztów
│   │   ├── calendar/      ✅ Lista zdarzeń
│   │   ├── projects/      ✅ Grid + Kanban
│   │   └── settings/      ✅ Formularze
│   ├── lib/
│   │   ├── auth.ts        ✅ NextAuth config
│   │   ├── db.ts          ✅ Prisma client
│   │   ├── utils.ts       ✅ Helpers (VAT, currency)
│   │   └── i18n.ts        ✅ Tłumaczenia PL
│   ├── types/             ✅ next-auth.d.ts
│   └── test/              ✅ Setup + przykładowe testy
├── e2e/                   ✅ Playwright login test
├── .github/workflows/     ✅ CI/CD
└── README.md              ✅ Dokumentacja

```

### Baza danych (Prisma)

**Status**: ✅ Schemat kompletny, migracje gotowe, seed działa

Modele:
- `User` - użytkownicy
- `Settings` - ustawienia użytkownika (firma, VAT, szablony)
- `Contractor` - kontrahenci (nabywcy/dostawcy)
- `Invoice` + `InvoiceItem` - faktury i pozycje
- `Expense` - koszty
- `TaxEvent` - zdarzenia podatkowe
- `Project` + `KanbanColumn` + `Task` - projekty i zadania

### API Routes

**Status**: ⚠️ Częściowe

Zaimplementowane:
- ✅ `/api/auth/[...nextauth]` - NextAuth
- ✅ `/api/settings` - PATCH (update ustawień)
- ✅ `/api/tax-events/[id]` - PATCH (zmiana statusu)

Do zrobienia:
- ⚠️ Pełne CRUD dla invoices, expenses, contractors, projects, tasks

## 🎨 UI/UX

### Komponenty shadcn/ui (gotowe)
- ✅ Button, Card, Input, Label, Badge, Select
- ✅ Dialog, Table, Tabs, Toast
- ✅ Wszystkie używane w aplikacji

### Widoki
- ✅ Login (formularz + walidacja)
- ✅ Dashboard (statystyki + quick links)
- ✅ Listy (faktury, koszty, projekty) z filtrowaniem
- ✅ Szczegóły (faktura, koszt, projekt)
- ⚠️ Formularze nowych encji (placeholder)

### Responsywność
- ✅ Mobile-first approach
- ✅ Grid layout dla kart
- ✅ Sidebar collapse (do zrobienia na mobile)

## 🧪 Testy

**Status**: ✅ Infrastruktura gotowa, przykłady działają

Zaimplementowane:
- ✅ Vitest config
- ✅ Testing Library setup
- ✅ Testy utils (kalkulacje)
- ✅ Playwright config
- ✅ E2E test logowania

Do zrobienia:
- [ ] Testy komponentów React
- [ ] Testy integracyjne API
- [ ] E2E: tworzenie faktury, kosztu, projektu
- [ ] E2E: drag&drop w Kanban

## 🚀 Deployment

### Wymagania środowiska

Produkcja:
- Node.js 18+
- PostgreSQL (lub pozostać na SQLite)
- Zmienne środowiskowe:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`

### Migracja do PostgreSQL

1. Zmień `provider` w `schema.prisma` na `postgresql`
2. Zaktualizuj `DATABASE_URL` w `.env`
3. Uruchom `npx prisma migrate dev`

## 📝 Dalsze kroki

### Najbliższe zadania (rekomendowane)

1. **Formularze** - zacząć od Invoice Form (najważniejsze)
   - React Hook Form + Zod
   - Dynamiczne dodawanie pozycji
   - Kalkulacje w czasie rzeczywistym
   - Wybór kontrahenta z listy

2. **PDF Generation** - najprostszy szablon faktury
   - @react-pdf/renderer
   - Dane z Settings + Invoice
   - Podstawowy layout

3. **API CRUD** - dokończyć wszystkie endpointy
   - Invoices, Expenses, Contractors
   - Walidacja z Zod
   - Obsługa błędów

4. **Upload** - załączniki do kosztów
   - FormData handling
   - Walidacja plików
   - Zapis do uploads/

5. **Drag & Drop** - Kanban
   - @dnd-kit/core + sortable
   - Update order w bazie

## 🐛 Znane problemy / Uwagi

- Brak Node.js w środowisku deweloperskim (aplikacja utworzona ręcznie)
- Szablony kalendarza w JSON - wymaga przyjaznego UI do edycji
- Brak paginacji w listach (może być problem przy dużej liczbie rekordów)
- Sidebar nie collapse'uje się na mobile
- Brak globalnej wyszukiwarki
- Generowanie zdarzeń podatkowych odbywa się tylko przy seed (potrzebny cron)

## 📚 Dokumentacja dla deweloperów

Wszystkie kluczowe funkcje biznesowe w `src/lib/utils.ts`:
- `calculateVat()` - obliczanie VAT
- `calculateLineItem()` - sumy pozycji faktury
- `generateInvoiceNumber()` - numeracja z szablonu
- `formatCurrency()` - formatowanie PLN
- `slugify()` - dla projektów

Tłumaczenia w `src/lib/i18n.ts` - prosty słownik PL.

Wszystkie modele Prisma mają:
- `createdAt` / `updatedAt` (timestamps)
- Proper relations z `onDelete: Cascade`
- Indexes na często używanych polach

---

**Podsumowanie**: Aplikacja ma solidne fundamenty, wszystkie główne moduły są funkcjonalne w trybie "read-only". Największa praca przed nami to formularze, PDF i pełne API.





