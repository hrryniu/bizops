#!/bin/bash

# Script to create macOS app bundle for BizOps
# Tworzy aplikację macOS z ikonką do docka

APP_NAME="BizOps"
APP_DIR="$HOME/Applications/${APP_NAME}.app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🍎 Tworzenie aplikacji macOS dla BizOps..."

# Usuń istniejącą aplikację jeśli istnieje
if [ -d "$APP_DIR" ]; then
    echo "🗑️  Usuwanie istniejącej aplikacji..."
    rm -rf "$APP_DIR"
fi

# Utwórz strukturę aplikacji macOS
echo "📁 Tworzenie struktury aplikacji..."
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Utwórz plik Info.plist
cat > "$APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>BizOps</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.bizops.app</string>
    <key>CFBundleName</key>
    <string>BizOps</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
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

# Utwórz główny skrypt aplikacji
cat > "$APP_DIR/Contents/MacOS/BizOps" << EOF
#!/bin/bash

# BizOps macOS App Launcher
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
# Bezpośrednia ścieżka do katalogu projektu
PROJECT_DIR="$SCRIPT_DIR/bizops"

echo "🚀 Uruchamianie BizOps..."

# Dodaj typowe ścieżki Node.js do PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:\$PATH"

# Sprawdź czy katalog projektu istnieje
if [ ! -d "$PROJECT_DIR" ]; then
    osascript -e 'display dialog "Nie można znaleźć katalogu BizOps. Upewnij się, że aplikacja została zainstalowana poprawnie." buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Przejdź do katalogu projektu
cd "$PROJECT_DIR"

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    osascript -e 'display dialog "Node.js nie jest zainstalowany. Zainstaluj Node.js z https://nodejs.org" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Sprawdź czy npm jest zainstalowany
if ! command -v npm &> /dev/null; then
    osascript -e 'display dialog "npm nie jest zainstalowany. Zainstaluj Node.js z https://nodejs.org" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Zainstaluj zależności jeśli nie są zainstalowane
if [ ! -d "node_modules" ]; then
    osascript -e 'display dialog "Instalowanie zależności... To może potrwać kilka minut." buttons {"OK"} default button "OK"'
    npm install
fi

# Sprawdź czy baza danych jest zainstalowana
if [ ! -f "prisma/dev.db" ]; then
    osascript -e 'display dialog "Inicjalizacja bazy danych..." buttons {"OK"} default button "OK"'
    npx prisma generate
    npx prisma db push
fi

# Uruchom aplikację
echo "🔧 Uruchamianie serwera deweloperskiego..."
npm run dev &

# Poczekaj na uruchomienie serwera
sleep 8

# Otwórz aplikację w przeglądarce
echo "🌐 Otwieranie BizOps w przeglądarce..."
open http://localhost:3000

# Pokaż powiadomienie
osascript -e 'display notification "BizOps zostało uruchomione!" with title "BizOps" subtitle "Aplikacja jest dostępna pod adresem http://localhost:3000"'
EOF

# Ustaw uprawnienia wykonania dla skryptu
chmod +x "$APP_DIR/Contents/MacOS/BizOps"

# Utwórz ikonkę aplikacji (ICNS)
echo "🎨 Tworzenie ikonki aplikacji..."

# Utwórz tymczasowy plik SVG z większą rozdzielczością
cat > "/tmp/bizops-icon.svg" << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <rect width="512" height="512" rx="96" fill="#0f172a"/>
  
  <!-- Letter B with interconnected nodes and lines -->
  <defs>
    <linearGradient id="bGradient" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Nodes (circles) -->
  <circle cx="128" cy="128" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="128" cy="256" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="128" cy="384" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  
  <!-- Top loop nodes -->
  <circle cx="256" cy="128" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="352" cy="128" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="384" cy="192" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  
  <!-- Bottom loop nodes -->
  <circle cx="256" cy="384" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="352" cy="384" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  <circle cx="384" cy="320" r="40" fill="url(#bGradient)" stroke="url(#bGradient)" stroke-width="8"/>
  
  <!-- Connecting lines -->
  <path d="M168 128 L216 128" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M168 256 L216 256" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M168 384 L216 384" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  
  <!-- Top loop curves -->
  <path d="M296 128 L312 128" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M352 168 L376 180" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M128 168 L256 168" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  
  <!-- Bottom loop curves -->
  <path d="M296 384 L312 384" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M352 344 L376 332" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  <path d="M128 344 L256 344" stroke="url(#bGradient)" stroke-width="48" stroke-linecap="round"/>
  
  <!-- Diagonal connections -->
  <path d="M168 168 L216 216" stroke="url(#bGradient)" stroke-width="32" stroke-linecap="round" opacity="0.7"/>
  <path d="M168 344 L216 296" stroke="url(#bGradient)" stroke-width="32" stroke-linecap="round" opacity="0.7"/>
</svg>
EOF

# Sprawdź czy rsvg-convert jest dostępny (część librsvg)
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 512 -h 512 "/tmp/bizops-icon.svg" -o "/tmp/bizops-icon.png"
elif command -v convert &> /dev/null; then
    # Fallback do ImageMagick
    convert "/tmp/bizops-icon.svg" -resize 512x512 "/tmp/bizops-icon.png"
else
    echo "⚠️  Ostrzeżenie: Nie można znaleźć rsvg-convert ani ImageMagick. Używam domyślnej ikonki."
    # Utwórz prostą ikonkę PNG
    python3 -c "
from PIL import Image, ImageDraw
import sys
try:
    img = Image.new('RGB', (512, 512), color='#0f172a')
    draw = ImageDraw.Draw(img)
    # Rysuj prostą ikonkę B
    draw.rectangle([128, 88, 168, 424], fill='#3b82f6')
    draw.rectangle([168, 88, 352, 168], fill='#3b82f6')
    draw.rectangle([168, 216, 352, 296], fill='#3b82f6')
    draw.rectangle([168, 344, 352, 424], fill='#3b82f6')
    img.save('/tmp/bizops-icon.png')
except ImportError:
    print('PIL nie jest zainstalowany. Używam domyślnej ikonki.')
    sys.exit(1)
" 2>/dev/null || echo "⚠️  Nie można utworzyć ikonki. Używam domyślnej."
fi

# Sprawdź czy ikonka została utworzona
if [ -f "/tmp/bizops-icon.png" ]; then
    # Konwertuj PNG na ICNS (jeśli iconutil jest dostępny)
    if command -v iconutil &> /dev/null; then
        mkdir -p "/tmp/BizOps.iconset"
        
        # Utwórz różne rozmiary ikonki
        sips -z 16 16 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_16x16.png" >/dev/null 2>&1
        sips -z 32 32 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_16x16@2x.png" >/dev/null 2>&1
        sips -z 32 32 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_32x32.png" >/dev/null 2>&1
        sips -z 64 64 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_32x32@2x.png" >/dev/null 2>&1
        sips -z 128 128 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_128x128.png" >/dev/null 2>&1
        sips -z 256 256 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_128x128@2x.png" >/dev/null 2>&1
        sips -z 256 256 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_256x256.png" >/dev/null 2>&1
        sips -z 512 512 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_256x256@2x.png" >/dev/null 2>&1
        sips -z 512 512 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_512x512.png" >/dev/null 2>&1
        sips -z 1024 1024 "/tmp/bizops-icon.png" --out "/tmp/BizOps.iconset/icon_512x512@2x.png" >/dev/null 2>&1
        
        # Utwórz plik ICNS
        iconutil -c icns "/tmp/BizOps.iconset" -o "$APP_DIR/Contents/Resources/AppIcon.icns"
        
        # Usuń tymczasowe pliki
        rm -rf "/tmp/BizOps.iconset"
    else
        # Fallback: skopiuj PNG jako ikonkę
        cp "/tmp/bizops-icon.png" "$APP_DIR/Contents/Resources/AppIcon.png"
    fi
else
    echo "⚠️  Nie można utworzyć ikonki. Aplikacja zostanie utworzona bez niestandardowej ikonki."
fi

# Usuń tymczasowe pliki
rm -f "/tmp/bizops-icon.svg" "/tmp/bizops-icon.png"

echo "✅ Aplikacja BizOps została utworzona!"
echo "📍 Lokalizacja: $APP_DIR"
echo ""
echo "🎯 Aby dodać aplikację do docka:"
echo "   1. Otwórz Finder"
echo "   2. Przejdź do $HOME/Applications/"
echo "   3. Przeciągnij BizOps.app do docka"
echo ""
echo "🚀 Aby uruchomić aplikację:"
echo "   • Kliknij dwukrotnie na BizOps.app"
echo "   • Lub uruchom z terminala: open '$APP_DIR'"

# Otwórz katalog Applications w Finder
open "$HOME/Applications/"
