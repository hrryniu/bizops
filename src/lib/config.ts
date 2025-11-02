/**
 * ⚙️ Application Configuration
 * 
 * Centralized configuration management for all services and integrations.
 */

// ========================================
// 🏦 Bank API Configuration
// ========================================
export const BANK_CONFIG = {
  mbank: {
    clientId: process.env.MBANK_CLIENT_ID || '',
    clientSecret: process.env.MBANK_CLIENT_SECRET || '',
    apiUrl: process.env.MBANK_API_URL || 'https://api.mbank.pl/sandbox',
  },
  pko: {
    clientId: process.env.PKO_CLIENT_ID || '',
    clientSecret: process.env.PKO_CLIENT_SECRET || '',
    apiUrl: process.env.PKO_API_URL || 'https://api.pkobp.pl/sandbox',
  },
  bnp: {
    clientId: process.env.BNP_CLIENT_ID || '',
    clientSecret: process.env.BNP_CLIENT_SECRET || '',
    apiUrl: process.env.BNP_API_URL || 'https://api.bnpparibas.pl/sandbox',
  },
  psd2: {
    redirectUri: process.env.PSD2_REDIRECT_URI || 'http://localhost:3000/api/bank/callback',
    consentDays: parseInt(process.env.PSD2_CONSENT_DAYS || '90'),
  },
}

// ========================================
// 🤖 AI Configuration
// ========================================
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
  },
  insights: {
    enabled: process.env.ENABLE_AI_INSIGHTS === 'true',
    frequency: process.env.AI_INSIGHT_FREQUENCY || 'daily',
  },
}

// ========================================
// 📷 OCR Configuration
// ========================================
export const OCR_CONFIG = {
  googleCloud: {
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'eu-central-1',
  },
  openaiVision: {
    enabled: process.env.OPENAI_VISION_ENABLED === 'true',
  },
}

// ========================================
// 📅 Calendar Configuration
// ========================================
export const CALENDAR_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback',
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID || '',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
    redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/api/calendar/outlook/callback',
    tenantId: process.env.OUTLOOK_TENANT_ID || 'common',
  },
}

// ========================================
// 📧 Email Configuration
// ========================================
export const EMAIL_CONFIG = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'BizOps <noreply@bizops.local>',
  },
  notifications: {
    enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    reminderDays: (process.env.NOTIFICATION_REMINDER_DAYS || '3,1')
      .split(',')
      .map(d => parseInt(d.trim())),
  },
}

// ========================================
// 💸 Tax Configuration (Polish)
// ========================================
export const TAX_CONFIG = {
  zus: {
    zdrowotnaRate: parseFloat(process.env.ZUS_ZDROWOTNA_RATE || '0.09'),
    spolecznaRate: parseFloat(process.env.ZUS_SPOLECZNA_RATE || '0.1952'),
    emerytalna: parseFloat(process.env.ZUS_EMERYTALNA || '439.34'),
    rentowa: parseFloat(process.env.ZUS_RENTOWA || '180.27'),
    chorobowa: parseFloat(process.env.ZUS_CHOROBOWA || '0'),
    wypadkowa: parseFloat(process.env.ZUS_WYPADKOWA || '20.53'),
    fp: parseFloat(process.env.ZUS_FP || '33.26'),
    fgsp: parseFloat(process.env.ZUS_FGSP || '4.15'),
  },
  pit: {
    linearRate: parseFloat(process.env.PIT_LINEAR_RATE || '0.19'),
    scaleThreshold: parseFloat(process.env.PIT_SCALE_THRESHOLD || '120000'),
    scaleRate1: parseFloat(process.env.PIT_SCALE_RATE_1 || '0.12'),
    scaleRate2: parseFloat(process.env.PIT_SCALE_RATE_2 || '0.32'),
    allowance: parseFloat(process.env.PIT_ALLOWANCE || '30000'),
  },
  vat: {
    standard: parseFloat(process.env.VAT_STANDARD || '0.23'),
    reduced1: parseFloat(process.env.VAT_REDUCED_1 || '0.08'),
    reduced2: parseFloat(process.env.VAT_REDUCED_2 || '0.05'),
    exempt: parseFloat(process.env.VAT_EXEMPT || '0.00'),
  },
}

// ========================================
// 📊 Analytics Configuration
// ========================================
export const ANALYTICS_CONFIG = {
  cashflowForecast: {
    enabled: process.env.ENABLE_CASHFLOW_FORECAST === 'true',
    confidenceThreshold: parseFloat(process.env.FORECAST_CONFIDENCE_THRESHOLD || '0.70'),
    horizonMonths: parseInt(process.env.FORECAST_HORIZON_MONTHS || '3'),
  },
}

// ========================================
// 🚀 Application Configuration
// ========================================
export const APP_CONFIG = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  logLevel: process.env.LOG_LEVEL || 'info',
  backgroundJobs: {
    enabled: process.env.ENABLE_BACKGROUND_JOBS === 'true',
    bankSyncCron: process.env.BANK_SYNC_CRON || '0 6 * * *',
    kpiCalculationCron: process.env.KPI_CALCULATION_CRON || '0 0 * * *',
    aiInsightsCron: process.env.AI_INSIGHTS_CRON || '0 7 * * *',
  },
  mock: {
    bankApi: process.env.MOCK_BANK_API === 'true',
    aiApi: process.env.MOCK_AI_API === 'true',
  },
}

// ========================================
// 🔐 Encryption Configuration
// ========================================
export const ENCRYPTION_CONFIG = {
  key: process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32',
  iv: process.env.ENCRYPTION_IV || 'default-iv-16ch',
}

// ========================================
// Validation
// ========================================
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check critical configurations
  if (!process.env.NEXTAUTH_SECRET && APP_CONFIG.env === 'production') {
    errors.push('NEXTAUTH_SECRET is required in production')
  }

  if (!AI_CONFIG.openai.apiKey && AI_CONFIG.insights.enabled) {
    errors.push('OPENAI_API_KEY is required when AI insights are enabled')
  }

  if (ENCRYPTION_CONFIG.key.length < 32 && APP_CONFIG.env === 'production') {
    errors.push('ENCRYPTION_KEY must be at least 32 characters')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Run validation on import
if (APP_CONFIG.env === 'production') {
  const validation = validateConfig()
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
  }
}








