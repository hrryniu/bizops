# 🚀 BizOps Advanced Features - Implementation Guide

## Overview

This document describes the advanced features added to the BizOps business management application, including Bank API Integration, Tax & ZUS Settlement, AI Financial Assistant, KPI Dashboard, Cashflow Forecasting, and more.

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes  
- **Database**: PostgreSQL (Prisma ORM)
- **AI**: OpenAI GPT-4/Vision API
- **OCR**: Google Cloud Vision, Tesseract.js
- **Calendar**: Google Calendar & Outlook APIs
- **Email**: Nodemailer (SMTP)
- **Background Jobs**: node-cron

### Module Structure
```
src/
├── lib/
│   ├── services/          # Core business logic
│   │   ├── bank-integration.ts
│   │   ├── tax-calculator.ts
│   │   ├── ai-assistant.ts
│   │   ├── kpi-calculator.ts
│   │   ├── cashflow-forecast.ts
│   │   ├── calendar-integration.ts
│   │   ├── notification-service.ts
│   │   ├── enhanced-ocr.ts
│   │   └── background-jobs.ts
│   ├── encryption.ts      # Secure data encryption
│   ├── config.ts          # Configuration management
│   └── db.ts              # Database client
├── app/
│   └── api/               # API endpoints
│       ├── bank/          # Bank integration APIs
│       ├── tax/           # Tax calculation APIs
│       ├── ai/            # AI assistant APIs
│       ├── kpi/           # KPI calculation APIs
│       ├── cashflow/      # Cashflow forecast APIs
│       ├── notifications/ # Notification APIs
│       └── calendar/      # Calendar sync APIs
└── components/
    ├── dashboard/         # Dashboard components (to be created)
    └── ai-assistant/      # AI assistant UI (to be created)
```

---

## 📚 Features Implemented

### 1. 🏦 Bank API Integration (PSD2)

**Location**: `src/lib/services/bank-integration.ts`

**Capabilities**:
- OAuth2 authentication with Polish banks (mBank, PKO BP, BNP Paribas)
- Automatic transaction synchronization
- Payment reconciliation with invoices and expenses
- Secure token encryption
- Mock mode for testing

**API Endpoints**:
```typescript
POST /api/bank/connect        // Initiate bank connection
GET  /api/bank/callback       // OAuth callback
POST /api/bank/sync           // Sync transactions
POST /api/bank/reconcile      // Match transactions
```

**Usage Example**:
```typescript
import { getBankService } from '@/lib/services/bank-integration'

// Connect to bank
const service = getBankService('mbank')
const authUrl = await service.getAuthorizationUrl(userId)

// Sync transactions
const synced = await syncAllUserBankConnections(userId)
```

---

### 2. 💸 Tax & ZUS Calculator

**Location**: `src/lib/services/tax-calculator.ts`

**Capabilities**:
- PIT calculation (linear 19% and progressive scale)
- CIT calculation (9% or 19%)
- ZUS contributions (emerytalna, rentowa, zdrowotna, etc.)
- VAT settlements
- Monthly, quarterly, and annual calculations
- CSV export

**API Endpoints**:
```typescript
POST /api/tax/calculate       // Calculate taxes
GET  /api/tax/calculate       // Get tax summary
GET  /api/tax/export?id=xxx   // Export as CSV
```

**Usage Example**:
```typescript
import { TaxCalculatorService } from '@/lib/services/tax-calculator'

const calculator = new TaxCalculatorService()
const result = await calculator.calculateTaxes({
  userId,
  periodType: 'MONTHLY',
  periodStart: startOfMonth(new Date()),
  periodEnd: endOfMonth(new Date()),
  businessType: 'SOLE_PROPRIETORSHIP',
  taxForm: 'PIT-36L',
})
```

---

### 3. 🤖 AI Financial Assistant

**Location**: `src/lib/services/ai-assistant.ts`

**Capabilities**:
- Natural language financial queries
- Contextual answers based on user data
- Proactive insights and recommendations
- Anomaly detection
- Cost optimization suggestions

**API Endpoints**:
```typescript
POST /api/ai/query            // Ask AI a question
GET  /api/ai/insights         // Get AI insights
POST /api/ai/insights         // Generate new insights
```

**Usage Example**:
```typescript
import { AIAssistantService } from '@/lib/services/ai-assistant'

const assistant = new AIAssistantService()
const response = await assistant.query({
  userId,
  query: "Jaki był mój zysk netto w ostatnim kwartale?"
})

console.log(response.response)
console.log(response.suggestions)
```

---

### 4. 📊 KPI Calculator & Analytics

**Location**: `src/lib/services/kpi-calculator.ts`

**Capabilities**:
- Real-time KPI calculation:
  - Revenue, expenses, net profit
  - Operating cashflow
  - Liquidity ratio
  - Profit margin
  - Average payment days
  - Growth rates
- Historical trend tracking
- Automatic daily/weekly/monthly snapshots

**API Endpoints**:
```typescript
POST /api/kpi/calculate       // Calculate current KPIs
GET  /api/kpi/calculate       // Get KPI snapshot
GET  /api/kpi/trends?months=6 // Get historical data
```

**Usage Example**:
```typescript
import { KPICalculatorService } from '@/lib/services/kpi-calculator'

const calculator = new KPICalculatorService()
const kpis = await calculator.calculateKPIs(userId, 'MONTHLY')

console.log(`Revenue: ${kpis.revenue}`)
console.log(`Profit Margin: ${kpis.profitMargin}%`)
console.log(`Liquidity Ratio: ${kpis.liquidityRatio}`)
```

---

### 5. 💧 Cashflow Forecasting

**Location**: `src/lib/services/cashflow-forecast.ts`

**Capabilities**:
- Predictive cashflow modeling (3-6 months ahead)
- Statistical methods:
  - Linear regression
  - Moving averages
  - Seasonal decomposition
- Liquidity alerts
- Confidence scoring
- Actual vs. predicted tracking

**API Endpoints**:
```typescript
POST /api/cashflow/forecast   // Generate forecast
GET  /api/cashflow/forecast   // Get existing forecast
```

**Usage Example**:
```typescript
import { CashflowForecastService } from '@/lib/services/cashflow-forecast'

const service = new CashflowForecastService()
const forecast = await service.generateForecast(userId, 3)

console.log(`Minimum Balance: ${forecast.minimumBalance}`)
forecast.alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.message}`)
})
```

---

### 6. 📅 Calendar Integration

**Location**: `src/lib/services/calendar-integration.ts`

**Capabilities**:
- Google Calendar integration
- Outlook Calendar integration
- Automatic event creation:
  - Tax deadlines
  - Invoice due dates
  - Payment reminders
- Configurable reminder notifications

**API Endpoints**:
```typescript
POST /api/calendar/sync       // Sync events to calendar
```

**Usage Example**:
```typescript
import { syncUserCalendar } from '@/lib/services/calendar-integration'

const result = await syncUserCalendar(userId)
console.log(`Synced ${result.total} events`)
```

---

### 7. 🔔 Notification Service

**Location**: `src/lib/services/notification-service.ts`

**Capabilities**:
- In-app notifications
- Email alerts (SMTP)
- Payment reminders
- Tax deadline alerts
- Low cashflow warnings
- AI insights notifications
- Scheduled notifications

**API Endpoints**:
```typescript
GET  /api/notifications       // Get user notifications
POST /api/notifications       // Mark as read
```

**Usage Example**:
```typescript
import { NotificationService } from '@/lib/services/notification-service'

const service = new NotificationService()
await service.createNotification({
  userId,
  type: 'PAYMENT_REMINDER',
  title: 'Przypomnienie o płatności',
  message: 'Faktura FV/01/2025 jest do zapłaty za 3 dni',
  priority: 'HIGH',
})
```

---

### 8. 📷 Enhanced OCR System

**Location**: `src/lib/services/enhanced-ocr.ts`

**Capabilities**:
- Hybrid OCR (OpenAI Vision → Google Cloud Vision → Tesseract)
- Automatic field extraction:
  - Vendor details (name, NIP, address)
  - Document number
  - Dates
  - Amounts (net, VAT, gross)
  - VAT rates
- Auto-categorization
- Direct expense creation

**Usage Example**:
```typescript
import { autoImportExpense } from '@/lib/services/enhanced-ocr'

const expenseId = await autoImportExpense(
  userId,
  '/path/to/invoice.pdf',
  '/uploads/invoice.pdf'
)
```

---

### 9. ⚙️ Background Jobs

**Location**: `src/lib/services/background-jobs.ts`

**Capabilities**:
- Scheduled tasks using node-cron:
  - Bank sync (daily at 6 AM)
  - KPI calculation (daily at midnight)
  - AI insights (daily at 7 AM)
  - Notifications (every 15 minutes)
  - Cashflow forecasting (weekly on Mondays)
  - Daily reminders (9 AM)

**Usage Example**:
```typescript
import { initializeBackgroundJobs } from '@/lib/services/background-jobs'

// In your app startup (e.g., server.ts or instrumentation.ts)
initializeBackgroundJobs()
```

---

## 🔐 Security

### Encryption
All sensitive data is encrypted using AES-256-CBC:
- Bank access tokens
- Bank refresh tokens
- Account numbers
- Calendar tokens

**Implementation**: `src/lib/encryption.ts`

### Environment Variables
All API keys and secrets are stored in environment variables (see `ENV_TEMPLATE.md`)

---

## 📊 Database Schema

### New Models Added to Prisma Schema:

1. **BankConnection** - Bank account connections
2. **BankTransaction** - Transaction history
3. **TaxCalculation** - Tax calculation results
4. **KPISnapshot** - KPI historical data
5. **CashflowForecast** - Cashflow predictions
6. **AIQuery** - AI assistant query history
7. **AIInsight** - AI-generated insights
8. **Notification** - User notifications
9. **CalendarIntegration** - Calendar connections

### Migration Required:
```bash
cd bizops
npm run prisma:migrate
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd bizops
npm install
```

### 2. Configure Environment Variables
Create `.env` file based on `ENV_TEMPLATE.md`:
```bash
# Copy template
cp ENV_TEMPLATE.md .env.local

# Edit and add your API keys
nano .env.local
```

### 3. Run Database Migrations
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Initialize Background Jobs
Background jobs start automatically when the server starts. To manually run a job:
```typescript
import { getBackgroundJobsService } from '@/lib/services/background-jobs'

const service = getBackgroundJobsService()
await service.runJobManually('bank-sync')
```

---

## 🧪 Testing

### Mock Mode
For testing without real API credentials, enable mock mode in `.env`:
```
MOCK_BANK_API=true
MOCK_AI_API=true
```

### Test API Endpoints
```bash
# Test AI assistant
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Jaki był mój przychód w tym miesiącu?"}'

# Test KPI calculation
curl -X POST http://localhost:3000/api/kpi/calculate

# Test tax calculation
curl -X POST http://localhost:3000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "periodType": "MONTHLY",
    "periodStart": "2025-01-01",
    "periodEnd": "2025-01-31",
    "businessType": "SOLE_PROPRIETORSHIP",
    "taxForm": "PIT-36L"
  }'
```

---

## 📈 Future Enhancements

### Phase 2 (Optional):
- [ ] WebSocket real-time notifications
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Advanced ML forecasting models
- [ ] Integration with Polish e-Government (e-Urząd Skarbowy)
- [ ] Automated invoice sending
- [ ] Client portal
- [ ] Multi-user/team support

---

## 📞 Support

For questions or issues:
1. Check environment variables configuration
2. Review API logs in terminal
3. Check Prisma Studio for database state: `npm run prisma:studio`
4. Verify API credentials are valid

---

## 📄 License

BizOps - All rights reserved.

---

**🎉 You're all set! The advanced features are ready to use.**

Next steps:
1. Configure your API keys in `.env`
2. Run database migrations
3. Start building UI components (see UI section below)
4. Test each feature individually

---

## 🎨 UI Components (To Be Created)

### Priority 1: AI Financial Assistant Panel
**Location**: `src/components/ai-assistant/AIAssistantPanel.tsx`

Features:
- Chat interface for natural language queries
- Quick summary cards (today's balance, unpaid invoices, next deadlines)
- AI insights display
- Suggested questions
- Query history

### Priority 2: Enhanced Dashboard
**Location**: `src/components/dashboard/EnhancedDashboard.tsx`

Features:
- Real-time KPI cards
- Revenue vs. Expenses chart (Recharts)
- Cashflow forecast visualization
- Profit margin trend
- Quick actions (sync bank, calculate taxes, etc.)

### Priority 3: Bank Integration UI
**Location**: `src/components/banking/BankIntegration.tsx`

Features:
- Connect bank accounts
- View transactions
- Reconciliation interface
- Transaction filters

### Priority 4: Tax Dashboard
**Location**: `src/components/tax/TaxDashboard.tsx`

Features:
- Current month/quarter/year summary
- Tax liability breakdown
- ZUS contributions
- Export to CSV/PDF

---

**Implementation Status**: ✅ Core services complete | ⏳ UI components pending


