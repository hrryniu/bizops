# 💰 Stałe Wydatki - Przewodnik Szybkiego Startu

## 🚀 Uruchomienie

### 1. Przygotowanie Bazy Danych

```bash
cd /Users/hrrniu/Desktop/JIMBO\ MEDIA/Program/bizops

# Zastosuj zmiany w bazie (już wykonane)
npm run prisma:generate

# Opcjonalnie: dodaj przykładowe dane (jeśli baza jest pusta)
npm run prisma:seed
```

### 2. Uruchom Aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

### 3. Zaloguj się

```
Email: admin@bizops.local
Hasło: admin123
```

### 4. Przejdź do Dashboard

Po zalogowaniu zobaczysz nowy widget "Stałe wydatki" zamiast poprzedniego "Nadchodzące terminy".

## 📝 Podstawowe Operacje

### Przeglądanie Wydatków

1. Kliknij na widget "Stałe wydatki" na dashboardzie
2. Zobaczysz modal z trzema zakładkami:
   - **Bieżący miesiąc** - wydatki na obecny miesiąc
   - **Następny miesiąc** - wydatki na kolejny miesiąc
   - **Za 2 miesiące** - wydatki na miesiąc +2

### Dodawanie Nowego Wydatku

1. W modalu kliknij **"Dodaj nowy"**
2. Wypełnij formularz:
   - **Nazwa** (np. "ZUS", "Czynsz", "Prąd")
   - **Kwota** w PLN
   - **Dzień płatności** (1-31)
   - **Kategoria** (Podatki, Media, Abonamenty, itp.)
   - **Cykliczność** (Miesięczna, Kwartalna, Roczna)
   - **Notatki** (opcjonalne)
3. Zaznacz switche:
   - **Wydatek aktywny** - czy wydatek jest aktualnie aktywny
   - **Synchronizuj z kalendarzem** - czy dodać do Google Calendar
4. Kliknij **"Dodaj wydatek"**

### Edycja Wydatku

1. Znajdź wydatek na liście
2. Kliknij ikonę **trzech kropek** (⋮)
3. Wybierz **"Edytuj"**
4. Zmień potrzebne dane
5. Kliknij **"Zapisz zmiany"**

### Usuwanie Wydatku

1. Znajdź wydatek na liście
2. Kliknij ikonę **trzech kropek** (⋮)
3. Wybierz **"Usuń"**
4. Potwierdź usunięcie

### Dezaktywacja Wydatku (bez usuwania)

1. Znajdź wydatek na liście
2. Kliknij ikonę **trzech kropek** (⋮)
3. Wybierz **"Dezaktywuj"**
4. Wydatek zniknie z widoku, ale pozostanie w bazie

## 📅 Integracja z Google Calendar (Opcjonalna)

### Konfiguracja

1. **Uzyskaj Google API Credentials**:
   - Przejdź do https://console.cloud.google.com/
   - Utwórz nowy projekt lub wybierz istniejący
   - Włącz **Google Calendar API**
   - Utwórz **OAuth 2.0 Client ID** (Web application)
   - Dodaj redirect URI: `http://localhost:3000/api/calendar/google/callback`
   - Pobierz Client ID i Client Secret

2. **Dodaj do .env**:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

3. **Restart aplikacji**:
   ```bash
   # Ctrl+C aby zatrzymać
   npm run dev
   ```

### Połączenie z Google Calendar

1. Przejdź do **Settings** (lub stwórz dedykowaną stronę)
2. Znajdź sekcję "Integracje"
3. Kliknij **"Połącz z Google Calendar"** → przekierowanie do `/api/calendar/google/auth`
4. Zaloguj się do Google i udziel uprawnień
5. Po powrocie, integracja jest aktywna

### Synchronizacja Wydatków

1. Podczas dodawania/edycji wydatku zaznacz **"Synchronizuj z kalendarzem"**
2. Wydatek zostanie automatycznie dodany do Google Calendar jako cykliczne wydarzenie
3. Otrzymasz przypomnienia:
   - Email: 1 dzień przed terminem
   - Popup: 1 godzinę przed terminem

### Rozłączenie Kalendarza

```javascript
// POST /api/calendar/disconnect
{
  "provider": "GOOGLE"
}
```

## 🎨 Przykładowe Dane

Jeśli uruchomiłeś seed, w bazie znajdują się następujące przykładowe wydatki:

1. **ZUS - składki** - 1500 PLN (20. dzień, miesięcznie)
2. **Czynsz biura** - 2500 PLN (5. dzień, miesięcznie)
3. **Prąd** - 350 PLN (15. dzień, miesięcznie)
4. **Internet i telefon** - 200 PLN (10. dzień, miesięcznie)
5. **Oprogramowanie księgowe** - 99 PLN (1. dzień, miesięcznie)
6. **Ubezpieczenie OC** - 450 PLN (25. dzień, kwartalnie)
7. **Zaliczka PIT** - 800 PLN (20. dzień, miesięcznie)
8. **Hosting serwerów** - 150 PLN (1. dzień, miesięcznie)
9. **Rewizja księgowa** - 1200 PLN (15. dzień, rocznie)

## 📊 Obliczenia

### Cykliczność

- **Miesięczna** - wydatek występuje w każdym miesiącu
- **Kwartalna** - wydatek występuje co 3 miesiące
- **Roczna** - wydatek występuje co 12 miesięcy

### Wyświetlanie na Dashboardzie

Widget pokazuje:
- **Bieżący miesiąc** (czcionka pogrubiona)
- **Następny miesiąc** (text-sm)
- **Za 2 miesiące** (text-sm)

Kliknięcie otwiera modal ze szczegółami.

## 🔍 Testowanie

### Ręczne Testowanie

1. **Test dodawania**:
   - Dodaj nowy wydatek "Test" na 100 PLN, dzień 15, miesięcznie
   - Sprawdź czy pojawia się w widżecie
   - Sprawdź czy pojawia się we wszystkich 3 miesiącach (miesięczny)

2. **Test edycji**:
   - Edytuj wydatek "Test" - zmień kwotę na 200 PLN
   - Sprawdź czy widok się zaktualizował
   - Sprawdź czy suma miesięczna się zmieniła

3. **Test cykliczności kwartalnej**:
   - Dodaj wydatek kwartalny
   - Sprawdź czy pojawia się tylko w bieżącym miesiącu (nie w kolejnych 2)

4. **Test dezaktywacji**:
   - Dezaktywuj wydatek "Test"
   - Sprawdź czy zniknął z widoku
   - Sprawdź czy suma miesięczna się zmniejszyła

5. **Test usuwania**:
   - Usuń wydatek "Test"
   - Sprawdź czy całkowicie zniknął

### Test Synchronizacji z Kalendarzem

(Wymaga skonfigurowania Google API)

1. Połącz Google Calendar
2. Dodaj nowy wydatek z zaznaczonym "Synchronizuj z kalendarzem"
3. Otwórz Google Calendar
4. Sprawdź czy wydarzenie zostało utworzone
5. Sprawdź czy ma odpowiednią cykliczność (RRULE)
6. Sprawdź czy ma przypomnienia

## 🐛 Rozwiązywanie Problemów

### Widżet nie wyświetla się

1. Sprawdź console przeglądarki (F12)
2. Sprawdź czy użytkownik jest zalogowany
3. Sprawdź czy baza danych zawiera fixedExpenses

### Błąd przy dodawaniu wydatku

1. Sprawdź console serwera (terminal z `npm run dev`)
2. Sprawdź czy wszystkie pola są wypełnione poprawnie
3. Sprawdź czy kwota jest > 0
4. Sprawdź czy dzień jest między 1-31

### Synchronizacja z kalendarzem nie działa

1. Sprawdź czy zmienne `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` są ustawione w `.env`
2. Sprawdź czy użytkownik połączył konto Google
3. Sprawdź czy integracja jest aktywna (`CalendarIntegration` w bazie)
4. Sprawdź logi serwera - powinny być szczegóły błędu

### Wydatek nie pojawia się w właściwym miesiącu

1. Sprawdź cykliczność wydatku
2. Kwartalny wydatek pojawia się co 3 miesiące (0, 3, 6, 9...)
3. Roczny wydatek pojawia się co 12 miesięcy

## 📚 API Dokumentacja

### Endpointy

```
GET    /api/fixed-expenses              # Lista wydatków
POST   /api/fixed-expenses              # Dodaj wydatek
GET    /api/fixed-expenses/[id]         # Szczegóły
PATCH  /api/fixed-expenses/[id]         # Aktualizuj
DELETE /api/fixed-expenses/[id]         # Usuń

GET    /api/calendar/google/auth        # Start OAuth
GET    /api/calendar/google/callback    # OAuth callback
POST   /api/calendar/disconnect         # Rozłącz kalendarz
```

### Przykład: Dodanie wydatku przez API

```bash
curl -X POST http://localhost:3000/api/fixed-expenses \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Abonament RTV",
    "amount": 27.50,
    "dueDay": 10,
    "category": "Media",
    "recurrence": "monthly",
    "isActive": true,
    "syncWithCalendar": false,
    "notes": "Opłata RTV"
  }'
```

## 🎯 Następne Kroki

1. **Przetestuj podstawowe operacje CRUD**
2. **Sprawdź różne cykliczności** (monthly, quarterly, yearly)
3. **Opcjonalnie: skonfiguruj Google Calendar**
4. **Dodaj swoje rzeczywiste stałe wydatki**
5. **Użyj do planowania budżetu firmy**

## 📞 Pomoc

W razie problemów:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi serwera (terminal)
3. Sprawdź dokumentację w `FIXED_EXPENSES_IMPLEMENTATION.md`
4. Sprawdź komunikaty toast w prawym górnym rogu aplikacji

---

**Gotowe!** 🎉 System stałych wydatków jest w pełni funkcjonalny i gotowy do użycia.









