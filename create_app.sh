#!/bin/bash

# Skrypt tworzący aplikację macOS dla BizOps
# Autor: AI Assistant

echo "🔧 Tworzenie aplikacji macOS dla BizOps..."

# Katalog aplikacji
APP_DIR="/Users/hrrniu/Desktop/JIMBO MEDIA/Program/bizops"
APP_NAME="BizOps.app"
APP_PATH="$APP_DIR/$APP_NAME"

# Usuń istniejącą aplikację
if [ -d "$APP_PATH" ]; then
    echo "🗑️  Usuwanie istniejącej aplikacji..."
    rm -rf "$APP_PATH"
fi

# Utwórz strukturę aplikacji
echo "📁 Tworzenie struktury aplikacji..."
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

# Utwórz plik Info.plist
cat > "$APP_PATH/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>BizOps</string>
    <key>CFBundleIdentifier</key>
    <string>com.bizops.app</string>
    <key>CFBundleName</key>
    <string>BizOps</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Utwórz skrypt wykonywalny
cat > "$APP_PATH/Contents/MacOS/BizOps" << 'EOF'
#!/bin/bash

# BizOps - Aplikacja macOS
# Autor: AI Assistant

# Katalog aplikacji
APP_DIR="$(dirname "$0")/../../.."
cd "$APP_DIR"

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    osascript -e 'display dialog "Node.js nie jest zainstalowany! Pobierz Node.js z: https://nodejs.org/" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Sprawdź czy npm jest dostępny
if ! command -v npm &> /dev/null; then
    osascript -e 'display dialog "npm nie jest dostępny!" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Sprawdź czy katalog node_modules istnieje
if [ ! -d "node_modules" ]; then
    osascript -e 'display dialog "Instalowanie zależności... To może potrwać kilka minut." buttons {"OK"} default button "OK" with icon note'
    npm install
    if [ $? -ne 0 ]; then
        osascript -e 'display dialog "Błąd podczas instalacji zależności!" buttons {"OK"} default button "OK" with icon stop'
        exit 1
    fi
fi

# Sprawdź czy baza danych jest skonfigurowana
if [ ! -f "prisma/dev.db" ]; then
    osascript -e 'display dialog "Konfigurowanie bazy danych..." buttons {"OK"} default button "OK" with icon note'
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        osascript -e 'display dialog "Błąd podczas konfiguracji bazy danych!" buttons {"OK"} default button "OK" with icon stop'
        exit 1
    fi
    
    npm run prisma:seed
    if [ $? -ne 0 ]; then
        osascript -e 'display dialog "Ostrzeżenie: Nie udało się dodać przykładowych danych" buttons {"OK"} default button "OK" with icon caution'
    fi
fi

# Uruchom aplikację
osascript -e 'display dialog "Uruchamianie BizOps... Aplikacja będzie dostępna pod adresem: http://localhost:3000" buttons {"OK"} default button "OK" with icon note'

# Otwórz przeglądarkę po 3 sekundach
(sleep 3 && open http://localhost:3000) &

# Uruchom serwer deweloperski
npm run dev
EOF

# Nadaj uprawnienia wykonywania
chmod +x "$APP_PATH/Contents/MacOS/BizOps"

echo "✅ Aplikacja została utworzona: $APP_PATH"
echo "🎉 Możesz teraz uruchomić BizOps podwójnym kliknięciem na aplikację!"
echo ""
echo "📧 Domyślne konto logowania:"
echo "   Email: admin@bizops.pl"
echo "   Hasło: admin123"
echo ""
echo "🌐 Aplikacja będzie dostępna pod adresem: http://localhost:3000"
