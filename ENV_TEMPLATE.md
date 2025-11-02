# Environment Variables Configuration

Copy this to your `.env` file and fill in the required values.

```bash
# ========================================
# 🔐 Database Configuration
# ========================================
DATABASE_URL="file:./prisma/dev.db"
# For PostgreSQL production:
# DATABASE_URL="postgresql://user:password@localhost:5432/bizops?schema=public"

# ========================================
# 🔑 NextAuth Configuration
# ========================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# ========================================
# 🏦 Bank API Integration (PSD2)
# ========================================
# Polish Bank APIs - obtain credentials from each bank's developer portal

# mBank (Sandbox: https://developer.api.mbank.pl/)
MBANK_CLIENT_ID=""
MBANK_CLIENT_SECRET=""
MBANK_API_URL="https://api.mbank.pl/sandbox"

# PKO BP (Sandbox: https://developer.pkobp.pl/)
PKO_CLIENT_ID=""
PKO_CLIENT_SECRET=""
PKO_API_URL="https://api.pkobp.pl/sandbox"

# BNP Paribas (Sandbox: https://developer.bnpparibas.pl/)
BNP_CLIENT_ID=""
BNP_CLIENT_SECRET=""
BNP_API_URL="https://api.bnpparibas.pl/sandbox"

# Generic PSD2 settings
PSD2_REDIRECT_URI="http://localhost:3000/api/bank/callback"
PSD2_CONSENT_DAYS=90

# ========================================
# 🔐 Encryption Keys (for storing bank tokens)
# ========================================
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY="your-32-char-encryption-key-here"
ENCRYPTION_IV="your-16-char-iv-here"

# ========================================
# 🤖 AI / OpenAI Configuration
# ========================================
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_MAX_TOKENS=4000

# ========================================
# 📷 OCR Services
# ========================================
# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS="./credentials/google-cloud-vision.json"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# AWS Textract (optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-central-1"

# OpenAI Vision (for hybrid OCR)
OPENAI_VISION_ENABLED="true"

# ========================================
# 📅 Calendar Integration
# ========================================
# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=""
GOOGLE_CALENDAR_CLIENT_SECRET=""
GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:3000/api/calendar/google/callback"

# Outlook Calendar
OUTLOOK_CLIENT_ID=""
OUTLOOK_CLIENT_SECRET=""
OUTLOOK_REDIRECT_URI="http://localhost:3000/api/calendar/outlook/callback"
OUTLOOK_TENANT_ID="common"

# ========================================
# 📧 Email Configuration (for notifications)
# ========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="BizOps <noreply@bizops.local>"

# ========================================
# 💸 Tax Configuration (Polish specific)
# ========================================
# ZUS rates (2025) - can be updated annually
ZUS_ZDROWOTNA_RATE="0.09"
ZUS_SPOLECZNA_RATE="0.1952"
ZUS_EMERYTALNA="439.34"
ZUS_RENTOWA="180.27"
ZUS_CHOROBOWA="0" # Optional for sole proprietors
ZUS_WYPADKOWA="20.53"
ZUS_FP="33.26"
ZUS_FGSP="4.15"

# PIT rates
PIT_LINEAR_RATE="0.19" # Tax liniowy
PIT_SCALE_THRESHOLD="120000" # Prog podatkowy (PLN)
PIT_SCALE_RATE_1="0.12" # Do progu
PIT_SCALE_RATE_2="0.32" # Powyżej progu
PIT_ALLOWANCE="30000" # Kwota wolna od podatku (PLN)

# VAT rates
VAT_STANDARD="0.23"
VAT_REDUCED_1="0.08"
VAT_REDUCED_2="0.05"
VAT_EXEMPT="0.00"

# ========================================
# 📊 Analytics & Forecasting
# ========================================
# Enable ML-based cashflow forecasting
ENABLE_CASHFLOW_FORECAST="true"
FORECAST_CONFIDENCE_THRESHOLD="0.70"
FORECAST_HORIZON_MONTHS="3"

# Enable AI insights
ENABLE_AI_INSIGHTS="true"
AI_INSIGHT_FREQUENCY="daily" # daily, weekly, manual

# ========================================
# 🔔 Notifications
# ========================================
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_PUSH_NOTIFICATIONS="false"
NOTIFICATION_REMINDER_DAYS="3,1" # Days before deadline

# ========================================
# 🚀 Application Settings
# ========================================
NODE_ENV="development" # development, production
PORT="3000"
LOG_LEVEL="info" # debug, info, warn, error

# Background job processing
ENABLE_BACKGROUND_JOBS="true"
BANK_SYNC_CRON="0 6 * * *" # Daily at 6 AM
KPI_CALCULATION_CRON="0 0 * * *" # Daily at midnight
AI_INSIGHTS_CRON="0 7 * * *" # Daily at 7 AM

# ========================================
# 🧪 Testing & Development
# ========================================
MOCK_BANK_API="false" # Use mock bank API for testing
MOCK_AI_API="false" # Use mock AI responses for testing
```

## 🔑 How to Get API Credentials

### OpenAI API Key
1. Go to https://platform.openai.com/
2. Create account or login
3. Navigate to API Keys section
4. Create new secret key

### Google Cloud Vision
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Cloud Vision API
4. Create service account and download JSON key
5. Place JSON file in `./credentials/google-cloud-vision.json`

### Google Calendar API
1. Go to https://console.cloud.google.com/
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/calendar/google/callback`

### Outlook Calendar API
1. Go to https://portal.azure.com/
2. Register new application
3. Add Microsoft Graph API permissions (Calendars.ReadWrite)
4. Create client secret

### Polish Bank PSD2 APIs
1. **mBank**: https://developer.api.mbank.pl/
2. **PKO BP**: https://developer.pkobp.pl/
3. **BNP Paribas**: https://developer.bnpparibas.pl/

Register as a TPP (Third Party Provider) and obtain sandbox credentials.

## 🔐 Security Best Practices

1. **Never commit `.env` file to version control**
2. **Use strong encryption keys** - generate with `openssl rand -base64 32`
3. **Rotate API keys regularly** - especially in production
4. **Use different credentials** for development and production
5. **Enable 2FA** on all API provider accounts
6. **Monitor API usage** to detect anomalies
7. **Use environment-specific variables** for different deployment stages








