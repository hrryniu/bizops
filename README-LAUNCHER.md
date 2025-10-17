# 🚀 BizOps Launcher

Skrypty do uruchamiania BizOps i tworzenia aplikacji macOS.

## 📁 Pliki

- **`start.sh`** - Główny skrypt z menu wyboru
- **`launch-bizops.sh`** - Uruchamia aplikację i otwiera przeglądarkę
- **`create-macos-app.sh`** - Tworzy aplikację macOS z ikonką do docka
- **`public/favicon.svg`** - Ikonka aplikacji (32x32)

## 🚀 Szybkie uruchomienie

### Opcja 1: Prosty skrypt
```bash
./start.sh
```

### Opcja 2: Bezpośrednie uruchomienie
```bash
# Uruchom aplikację
./launch-bizops.sh

# Utwórz aplikację macOS
./create-macos-app.sh
```

## 🍎 Tworzenie aplikacji macOS

1. **Uruchom skrypt tworzenia:**
   ```bash
   ./create-macos-app.sh
   ```

2. **Dodaj do docka:**
   - Otwórz Finder
   - Przejdź do `~/Applications/`
   - Przeciągnij `BizOps.app` do docka

3. **Uruchom aplikację:**
   - Kliknij dwukrotnie na `BizOps.app`
   - Aplikacja automatycznie uruchomi serwer i otworzy przeglądarkę

## 🎨 Ikonka

Ikonka jest inspirowana załączonym obrazkiem:
- **Design:** Litera "B" z połączonymi węzłami i liniami
- **Kolory:** Gradient niebieski (od ciemnego do jasnego)
- **Tło:** Ciemne
- **Styl:** Nowoczesny, sieciowy, technologiczny

## ⚙️ Wymagania

### Podstawowe:
- **macOS** 10.15 lub nowszy
- **Node.js** (https://nodejs.org)
- **npm** (zawarty z Node.js)

### Opcjonalne (dla lepszej ikonki):
- **rsvg-convert** (librsvg): `brew install librsvg`
- **ImageMagick**: `brew install imagemagick`
- **Python PIL**: `pip install Pillow`

## 🔧 Co robią skrypty

### `launch-bizops.sh`
- Sprawdza wymagania (Node.js, npm)
- Instaluje zależności jeśli potrzeba
- Inicjalizuje bazę danych jeśli potrzeba
- Uruchamia serwer deweloperski
- Otwiera aplikację w przeglądarce
- Obsługuje Ctrl+C do zatrzymania

### `create-macos-app.sh`
- Tworzy strukturę aplikacji macOS
- Generuje plik Info.plist
- Tworzy ikonkę z SVG na ICNS
- Ustawia uprawnienia wykonania
- Otwiera katalog Applications w Finder

## 📍 Lokalizacje

- **Aplikacja macOS:** `~/Applications/BizOps.app`
- **Serwer:** `http://localhost:3000`
- **Katalog projektu:** Katalog gdzie są skrypty

## 🛠️ Rozwiązywanie problemów

### "Node.js nie jest zainstalowany"
```bash
# Zainstaluj Node.js z oficjalnej strony
open https://nodejs.org
```

### "npm nie jest zainstalowany"
- npm jest zawarty z Node.js
- Zainstaluj ponownie Node.js

### "Nie można znaleźć katalogu BizOps"
- Uruchom skrypty z katalogu `bizops/`
- Sprawdź ścieżkę w skrypcie

### Ikonka nie wyświetla się
- macOS może potrzebować czasu na aktualizację cache
- Uruchom: `sudo killall Dock`
- Lub usuń aplikację z docka i dodaj ponownie

## 🎯 Funkcje

### Automatyczne:
- ✅ Instalacja zależności
- ✅ Inicjalizacja bazy danych
- ✅ Uruchomienie serwera
- ✅ Otwarcie przeglądarki
- ✅ Obsługa błędów
- ✅ Powiadomienia systemowe

### macOS App:
- ✅ Ikona w docku
- ✅ Autostart z docka
- ✅ Powiadomienia systemowe
- ✅ Obsługa błędów z dialogami
- ✅ Wysokiej rozdzielczości ikonka

## 📝 Uwagi

- Aplikacja uruchamia serwer deweloperski (nie produkcyjny)
- Port 3000 musi być wolny
- Pierwsze uruchomienie może potrwać dłużej (instalacja zależności)
- Aplikacja macOS automatycznie otwiera przeglądarkę po uruchomieniu

## 🔄 Aktualizacje

Aby zaktualizować aplikację macOS:
1. Usuń starą wersję z `~/Applications/`
2. Uruchom ponownie `./create-macos-app.sh`
3. Dodaj nową wersję do docka
