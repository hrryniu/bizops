# 🚀 BizOps Setup Instructions

## Quick Start Guide

Follow these steps to set up and run the enhanced BizOps application with all advanced features.

---

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v14 or higher (or SQLite for development)
- **API Keys**: OpenAI, Google Cloud Vision (optional), Bank APIs (optional)

---

## Step 1: Install Dependencies

```bash
cd /Users/hrrniu/Desktop/JIMBO\ MEDIA/Program/bizops
npm install
```

This will install all required packages including:
- Next.js 14
- OpenAI SDK
- Google Cloud Vision
- Microsoft Graph Client
- Nodemailer
- Recharts
- And many more...

---

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `bizops` directory:

```bash
cp ENV_TEMPLATE.md .env.local
```

Then edit `.env.local` and add your API keys:

### Required for Basic Functionality:
```bash
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Required for AI Features:
```bash
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4-turbo-preview"
```

### Optional (for full functionality):
```bash
# Google Cloud Vision (for OCR)
GOOGLE_APPLICATION_CREDENTIALS="./credentials/google-cloud-vision.json"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Calendar integration
GOOGLE_CALENDAR_CLIENT_ID="your-google-client-id"
GOOGLE_CALENDAR_CLIENT_SECRET="your-google-client-secret"

# Bank API (for production)
MBANK_CLIENT_ID=""
MBANK_CLIENT_SECRET=""
```

### For Testing Without API Keys:
```bash
MOCK_BANK_API=true
MOCK_AI_API=true
```

---

## Step 3: Generate Encryption Keys

Generate secure encryption keys for sensitive data:

```bash
# Generate encryption key (32 characters)
openssl rand -base64 32

# Generate IV (16 characters)
openssl rand -base64 16
```

Add these to `.env.local`:
```bash
ENCRYPTION_KEY="your-generated-32-char-key"
ENCRYPTION_IV="your-generated-16-char-iv"
```

---

## Step 4: Set Up Database

### Run Migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Seed Database (optional):
```bash
npm run prisma:seed
```

This will create:
- Default admin user (admin@bizops.local / admin123)
- Sample data for testing

---

## Step 5: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Step 6: Test Features

### Login:
- Email: `admin@bizops.local`
- Password: `admin123`

### Test AI Assistant:
1. Navigate to `/ai-assistant` (or access via dashboard)
2. Ask: "Jaki był mój przychód w tym miesiącu?"
3. The AI should respond with data from your account

### Test KPI Dashboard:
1. Navigate to `/dashboard`
2. You should see KPI cards with metrics
3. Click "Generuj prognozę" to create cashflow forecast

### Test Tax Calculator:
```bash
# Via API
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

## Step 7: Enable Background Jobs

Background jobs are automatically started when the server starts. They run:
- **Bank sync**: Daily at 6 AM
- **KPI calculation**: Daily at midnight
- **AI insights**: Daily at 7 AM
- **Notifications**: Every 15 minutes
- **Cashflow forecast**: Weekly on Mondays

To manually trigger a job:
```typescript
import { getBackgroundJobsService } from '@/lib/services/background-jobs'

const service = getBackgroundJobsService()
await service.runJobManually('kpi-calculation')
```

---

## Step 8: Configure External Services (Optional)

### Google Cloud Vision (for OCR):
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Cloud Vision API
4. Create service account
5. Download JSON key file
6. Place in `./credentials/google-cloud-vision.json`

### OpenAI API:
1. Go to https://platform.openai.com/
2. Create account or login
3. Navigate to API Keys
4. Create new secret key
5. Add to `.env.local` as `OPENAI_API_KEY`

### Google Calendar:
1. Go to https://console.cloud.google.com/
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/calendar/google/callback`
5. Add credentials to `.env.local`

### Polish Bank APIs:
1. **mBank**: https://developer.api.mbank.pl/
2. **PKO BP**: https://developer.pkobp.pl/
3. **BNP Paribas**: https://developer.bnpparibas.pl/

Register as TPP (Third Party Provider) for sandbox access.

---

## Folder Structure

```
bizops/
├── src/
│   ├── app/
│   │   ├── api/                  # API routes
│   │   │   ├── bank/             # Bank integration
│   │   │   ├── tax/              # Tax calculator
│   │   │   ├── ai/               # AI assistant
│   │   │   ├── kpi/              # KPI metrics
│   │   │   └── cashflow/         # Cashflow forecast
│   │   └── (dashboard)/          # Dashboard pages
│   ├── components/
│   │   ├── ai-assistant/         # AI assistant UI
│   │   │   └── AIAssistantPanel.tsx
│   │   └── dashboard/            # Dashboard UI
│   │       └── EnhancedDashboard.tsx
│   └── lib/
│       ├── services/             # Business logic
│       │   ├── bank-integration.ts
│       │   ├── tax-calculator.ts
│       │   ├── ai-assistant.ts
│       │   ├── kpi-calculator.ts
│       │   ├── cashflow-forecast.ts
│       │   ├── calendar-integration.ts
│       │   ├── notification-service.ts
│       │   ├── enhanced-ocr.ts
│       │   └── background-jobs.ts
│       ├── config.ts
│       ├── encryption.ts
│       └── db.ts
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── dev.db                    # SQLite database (dev)
├── .env.local                    # Your environment variables
├── ENV_TEMPLATE.md               # Template for environment variables
├── IMPLEMENTATION_GUIDE.md       # Feature documentation
└── SETUP_INSTRUCTIONS.md         # This file
```

---

## Common Issues & Solutions

### Issue: "Module not found" errors
**Solution**: Run `npm install` again and restart the dev server

### Issue: Database errors
**Solution**: 
```bash
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Issue: AI responses not working
**Solution**: 
1. Check `OPENAI_API_KEY` in `.env.local`
2. Or enable mock mode: `MOCK_AI_API=true`

### Issue: Bank sync failing
**Solution**: Enable mock mode for testing: `MOCK_BANK_API=true`

### Issue: TypeScript errors
**Solution**: 
```bash
npm run prisma:generate
# Restart your IDE
```

---

## Production Deployment

### 1. Use PostgreSQL instead of SQLite

Update `.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bizops"
```

Run migrations:
```bash
npm run prisma:migrate
```

### 2. Build for Production

```bash
npm run build
npm run start
```

### 3. Environment Variables

Ensure all production API keys are set:
- Real bank API credentials
- Production OpenAI API key
- SMTP credentials for email
- Calendar API credentials

### 4. Security

- Use strong `NEXTAUTH_SECRET`
- Use strong `ENCRYPTION_KEY`
- Enable HTTPS
- Set proper CORS policies
- Regular security audits

---

## Monitoring & Logs

### View Background Job Status:
```typescript
import { getBackgroundJobsService } from '@/lib/services/background-jobs'

const service = getBackgroundJobsService()
const status = service.getStatus()
console.log(status)
```

### View Database:
```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Check Logs:
- Console output in terminal
- API logs in browser Network tab
- Database queries via Prisma logging

---

## Next Steps

1. ✅ Complete setup steps above
2. 📝 Add your invoices and expenses
3. 🏦 Connect bank account (optional)
4. 🤖 Try AI assistant
5. 📊 View KPI dashboard
6. 💧 Generate cashflow forecast
7. 💸 Calculate taxes

---

## Support

If you encounter issues:
1. Check this guide
2. Review `IMPLEMENTATION_GUIDE.md`
3. Check console logs
4. Verify environment variables
5. Ensure all dependencies are installed

---

**🎉 Congratulations! Your BizOps system is ready to use!**











