#!/bin/bash

# BizOps - Skrypt uruchamiający aplikację
# Autor: AI Assistant
# Data: $(date)

echo "🚀 Uruchamianie BizOps..."
echo "================================"

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany!"
    echo "📥 Pobierz Node.js z: https://nodejs.org/"
    echo "💡 Lub zainstaluj przez Homebrew: brew install node"
    read -p "Naciśnij Enter aby kontynuować..."
    exit 1
fi

# Sprawdź czy npm jest dostępny
if ! command -v npm &> /dev/null; then
    echo "❌ npm nie jest dostępny!"
    read -p "Naciśnij Enter aby kontynuować..."
    exit 1
fi

echo "✅ Node.js $(node --version) jest zainstalowany"
echo "✅ npm $(npm --version) jest dostępny"

# Przejdź do katalogu aplikacji
cd "$(dirname "$0")"

# Sprawdź czy katalog node_modules istnieje
if [ ! -d "node_modules" ]; then
    echo "📦 Instalowanie zależności..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Błąd podczas instalacji zależności!"
        read -p "Naciśnij Enter aby kontynuować..."
        exit 1
    fi
    echo "✅ Zależności zainstalowane"
fi

# Sprawdź czy baza danych jest skonfigurowana
if [ ! -f "prisma/dev.db" ]; then
    echo "🗄️  Konfigurowanie bazy danych..."
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo "❌ Błąd podczas konfiguracji bazy danych!"
        read -p "Naciśnij Enter aby kontynuować..."
        exit 1
    fi
    
    echo "🌱 Dodawanie przykładowych danych..."
    npm run prisma:seed
    if [ $? -ne 0 ]; then
        echo "⚠️  Ostrzeżenie: Nie udało się dodać przykładowych danych"
    fi
    echo "✅ Baza danych skonfigurowana"
fi

echo ""
echo "🎉 Wszystko gotowe! Uruchamianie aplikacji..."
echo "🌐 Aplikacja będzie dostępna pod adresem: http://localhost:3000"
echo "📧 Domyślne konto: admin@bizops.pl / hasło: admin123"
echo ""
echo "⏹️  Aby zatrzymać aplikację, naciśnij Ctrl+C"
echo "================================"

# Uruchom aplikację
npm run dev
