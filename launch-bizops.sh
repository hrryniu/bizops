#!/bin/bash

# BizOps Launch Script
# Uruchamia aplikację Next.js i otwiera ją w przeglądarce

echo "🚀 Uruchamianie BizOps..."

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "package.json" ]; then
    echo "❌ Błąd: Uruchom skrypt z katalogu bizops/"
    exit 1
fi

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Błąd: Node.js nie jest zainstalowany"
    exit 1
fi

# Sprawdź czy npm jest zainstalowany
if ! command -v npm &> /dev/null; then
    echo "❌ Błąd: npm nie jest zainstalowany"
    exit 1
fi

# Zainstaluj zależności jeśli nie są zainstalowane
if [ ! -d "node_modules" ]; then
    echo "📦 Instalowanie zależności..."
    npm install
fi

# Sprawdź czy baza danych jest zainstalowana
if [ ! -f "dev.db" ]; then
    echo "🗄️  Inicjalizacja bazy danych..."
    npx prisma generate
    npx prisma db push
fi

# Uruchom aplikację w tle
echo "🔧 Uruchamianie serwera deweloperskiego..."
npm run dev &
DEV_PID=$!

# Poczekaj chwilę na uruchomienie serwera
sleep 5

# Sprawdź czy serwer się uruchomił
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⏳ Czekam na uruchomienie serwera..."
    sleep 5
fi

# Otwórz aplikację w przeglądarce
echo "🌐 Otwieranie BizOps w przeglądarce..."
open http://localhost:3000

echo "✅ BizOps uruchomione!"
echo "📍 URL: http://localhost:3000"
echo "🔄 PID serwera: $DEV_PID"
echo ""
echo "Aby zatrzymać aplikację, naciśnij Ctrl+C"

# Funkcja cleanup przy zamykaniu
cleanup() {
    echo ""
    echo "🛑 Zatrzymywanie BizOps..."
    kill $DEV_PID 2>/dev/null
    echo "✅ Aplikacja zatrzymana"
    exit 0
}

# Przechwytuj sygnał przerwania
trap cleanup SIGINT SIGTERM

# Czekaj na zakończenie procesu
wait $DEV_PID
