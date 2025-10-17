#!/bin/bash

# Simple BizOps starter script
# Prosty skrypt do uruchamiania BizOps

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 BizOps - Zarządzanie działalnością"
echo "======================================"
echo ""
echo "Wybierz opcję:"
echo "1) Uruchom aplikację (launch-bizops.sh)"
echo "2) Utwórz aplikację macOS (create-macos-app.sh)"
echo "3) Wyjście"
echo ""

read -p "Twój wybór (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Uruchamianie BizOps..."
        exec "$SCRIPT_DIR/launch-bizops.sh"
        ;;
    2)
        echo ""
        echo "🍎 Tworzenie aplikacji macOS..."
        exec "$SCRIPT_DIR/create-macos-app.sh"
        ;;
    3)
        echo "👋 Do widzenia!"
        exit 0
        ;;
    *)
        echo "❌ Nieprawidłowy wybór. Wybierz 1, 2 lub 3."
        exit 1
        ;;
esac