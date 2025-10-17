# BizOps - Aplikacja do zarządzania jednoosobową działalnością

Pełna aplikacja do prowadzenia jednoosobowej działalności w Polsce, zawierająca moduły faktur, kosztów, kalendarza podatkowego i zarządzania projektami.

## 🚀 Szybkie uruchomienie

### Opcja 1: Aplikacja macOS (ZALECANE)
1. **Podwójnie kliknij na `BizOps.app`** w katalogu aplikacji
2. Aplikacja automatycznie:
   - Sprawdzi czy Node.js jest zainstalowany
   - Zainstaluje zależności (pierwsze uruchomienie)
   - Skonfiguruje bazę danych
   - Uruchomi serwer
   - Otworzy przeglądarkę

### Opcja 2: Skrypt Terminal
1. **Podwójnie kliknij na `start.command`**
2. Lub uruchom w Terminal: `./start.sh`

### Opcja 3: Ręczne uruchomienie
```bash
# Przejdź do katalogu aplikacji
cd /path/to/bizops

# Zainstaluj zależności (pierwsze uruchomienie)
npm install

# Skonfiguruj bazę danych
npm run prisma:migrate
npm run prisma:seed

# Uruchom aplikację
npm run dev
```

## 📧 Dane logowania

**Domyślne konto:**
- Email: `admin@bizops.pl`
- Hasło: `admin123`

## 🌐 Dostęp do aplikacji

Po uruchomieniu aplikacja będzie dostępna pod adresem:
**http://localhost:3000**

## 📋 Wymagania systemowe

- **macOS 10.15+** (Catalina lub nowszy)
- **Node.js 18+** (zostanie pobrany automatycznie jeśli nie jest zainstalowany)
- **8GB RAM** (zalecane)
- **1GB wolnego miejsca** na dysku

## 🔧 Rozwiązywanie problemów

### Node.js nie jest zainstalowany
1. Pobierz Node.js z: https://nodejs.org/
2. Lub zainstaluj przez Homebrew: `brew install node`

### Błąd uprawnień
```bash
chmod +x start.sh
chmod +x start.command
chmod +x create_app.sh
```

### Port 3000 jest zajęty
Aplikacja automatycznie znajdzie wolny port i poinformuje o nowym adresie.

### Baza danych nie działa
```bash
# Usuń starą bazę i utwórz nową
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

## 📁 Struktura aplikacji

```
bizops/
├── BizOps.app              # Aplikacja macOS (podwójny klik)
├── start.command           # Skrypt uruchamiający (podwójny klik)
├── start.sh               # Skrypt bash
├── create_app.sh          # Skrypt tworzący aplikację
├── src/                   # Kod źródłowy
│   ├── app/              # Strony Next.js
│   ├── components/       # Komponenty React
│   └── lib/              # Biblioteki i utilities
├── prisma/               # Schemat bazy danych
└── package.json          # Zależności Node.js
```

## 🎯 Funkcje aplikacji

### 📊 Dashboard
- Przegląd finansów
- Wykresy przychodów vs kosztów
- Nadchodzące terminy podatkowe
- Statystyki miesięczne

### 🧾 Faktury
- Tworzenie faktur przychodowych
- Automatyczne kalkulacje VAT
- Generowanie PDF
- Numeracja faktur
- Statusy płatności

### 💰 Koszty
- Rejestracja kosztów
- Kategorie kosztów
- Załączniki (skany)
- Kalkulacje VAT

### 📅 Kalendarz podatkowy
- Terminy ZUS, PIT, VAT
- Konfigurowalne szablony
- Przypomnienia
- Statusy wykonania

### 📋 Projekty i Kanban
- Zarządzanie projektami
- Tablica Kanban z drag&drop
- Zadania z checklistami
- Notatki markdown

### ⚙️ Ustawienia
- Dane firmy
- Konfiguracja podatków
- Eksport/Import danych
- Kopie zapasowe

## 🔄 Eksport i Import

### Eksport
- **JSON**: Pełna kopia wszystkich danych
- **CSV**: Tabele faktur i kosztów
- **PDF**: Wszystkie faktury jako ZIP
- **ZIP**: Kompletny eksport

### Import
- **JSON**: Przywracanie z kopii zapasowej
- Walidacja danych
- Zastąpienie istniejących danych

## 🛠️ Rozwój aplikacji

### Dostępne skrypty
```bash
npm run dev          # Serwer deweloperski
npm run build        # Budowanie produkcyjne
npm run start        # Uruchomienie produkcyjne
npm run lint         # Sprawdzenie kodu
npm run test         # Testy jednostkowe
npm run test:e2e     # Testy e2e
```

### Baza danych
```bash
npm run prisma:studio    # Interfejs bazy danych
npm run prisma:migrate   # Migracje
npm run prisma:seed      # Przykładowe dane
```

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź logi w Terminal
2. Upewnij się, że Node.js jest zainstalowany
3. Sprawdź czy port 3000 jest wolny
4. Usuń `node_modules` i uruchom `npm install` ponownie

## 📄 Licencja

Aplikacja BizOps - Wszystkie prawa zastrzeżone.

---

**🎉 Miłego korzystania z BizOps!**
