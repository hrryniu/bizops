#!/bin/bash

# BizOps - Startup Script
# This script sets up environment variables and starts the application

echo "🚀 Starting BizOps Application..."
echo "================================"

# Set environment variables
export DATABASE_URL="file:./dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
export NODE_ENV="development"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📥 Download Node.js from: https://nodejs.org/"
    echo "💡 Or install via Homebrew: brew install node"
    read -p "Press Enter to continue..."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error installing dependencies!"
        read -p "Press Enter to continue..."
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check if database exists
if [ ! -f "dev.db" ]; then
    echo "🗄️  Setting up database..."
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo "❌ Error setting up database!"
        read -p "Press Enter to continue..."
        exit 1
    fi
    
    echo "🌱 Adding sample data..."
    npm run prisma:seed
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Could not add sample data"
    fi
    echo "✅ Database setup complete"
fi

echo ""
echo "🎉 Everything ready! Starting application..."
echo "🌐 Application will be available at: http://localhost:3000"
echo "📧 Default account: admin@bizops.local / password: admin123"
echo ""
echo "⏹️  To stop the application, press Ctrl+C"
echo "================================"

# Start the application
npm run dev

