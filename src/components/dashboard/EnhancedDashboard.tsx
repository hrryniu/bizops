/**
 * 📊 Enhanced Dashboard Component
 * 
 * Advanced financial dashboard with KPIs, trends, and cashflow forecast
 */

'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface KPICard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: string
}

export function EnhancedDashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load current KPIs
      const kpiResponse = await fetch('/api/kpi/calculate')
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json()
        setKpis(kpiData)
      }

      // Load historical trends
      const trendsResponse = await fetch('/api/kpi/trends?months=6')
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrends(trendsData)
      }

      // Load cashflow forecast
      const forecastResponse = await fetch('/api/cashflow/forecast')
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecast(forecastData)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const handleGenerateForecast = async () => {
    try {
      await fetch('/api/cashflow/forecast', { method: 'POST' })
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to generate forecast:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    )
  }

  const kpiCards: KPICard[] = kpis ? [
    {
      label: 'Przychody',
      value: `${kpis.revenue?.toFixed(0) || 0} PLN`,
      change: kpis.revenueGrowth,
      trend: kpis.revenueGrowth > 0 ? 'up' : kpis.revenueGrowth < 0 ? 'down' : 'neutral',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      label: 'Koszty',
      value: `${kpis.expenses?.toFixed(0) || 0} PLN`,
      change: kpis.expenseGrowth,
      trend: kpis.expenseGrowth > 0 ? 'down' : kpis.expenseGrowth < 0 ? 'up' : 'neutral',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-red-500',
    },
    {
      label: 'Zysk netto',
      value: `${kpis.netProfit?.toFixed(0) || 0} PLN`,
      change: kpis.profitMargin,
      trend: kpis.netProfit > 0 ? 'up' : 'down',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Marża zysku',
      value: `${kpis.profitMargin?.toFixed(1) || 0}%`,
      trend: kpis.profitMargin > 20 ? 'up' : kpis.profitMargin < 10 ? 'down' : 'neutral',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      label: 'Cashflow operacyjny',
      value: `${kpis.operatingCashflow?.toFixed(0) || 0} PLN`,
      trend: kpis.operatingCashflow > 0 ? 'up' : 'down',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-teal-500',
    },
    {
      label: 'Wskaźnik płynności',
      value: kpis.liquidityRatio?.toFixed(2) || '0.00',
      trend: kpis.liquidityRatio > 1.5 ? 'up' : kpis.liquidityRatio < 1 ? 'down' : 'neutral',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
    {
      label: 'Nieopłacone faktury',
      value: kpis.outstandingInvoices || 0,
      trend: 'neutral',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
    {
      label: 'Średni czas płatności',
      value: `${kpis.avgPaymentDays?.toFixed(0) || 0} dni`,
      trend: 'neutral',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-indigo-500',
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Finansowy</h1>
          <p className="text-gray-600 mt-1">Przegląd kluczowych wskaźników i prognoz</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </button>
          <button
            onClick={handleGenerateForecast}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generuj prognozę
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                {card.icon}
              </div>
              {card.trend && card.trend !== 'neutral' && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    card.trend === 'up'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {card.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {card.change ? `${Math.abs(card.change).toFixed(1)}%` : ''}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Revenue vs Expenses & Profit Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Przychody vs. Koszty</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(0)} PLN`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Przychody" />
              <Bar dataKey="expenses" fill="#ef4444" name="Koszty" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Trend zysku</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(0)} PLN`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Zysk netto"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Cashflow & Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Forecast */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Prognoza cashflow</h3>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `${value?.toFixed(0) || 0} PLN`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="Prognozowany"
                />
                {forecast.some(f => f.actual !== null) && (
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    fill="#6ee7b7"
                    name="Rzeczywisty"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Brak danych prognozy. Kliknij "Generuj prognozę"</p>
            </div>
          )}
        </div>

        {/* Profitability Indicators */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Wskaźniki rentowności</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => `${value?.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="profitMargin"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Marża zysku (%)"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      {kpis && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alerty i rekomendacje
          </h3>
          <div className="space-y-3">
            {kpis.liquidityRatio < 1 && (
              <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                <p className="font-medium text-red-900">⚠️ Niski wskaźnik płynności</p>
                <p className="text-sm text-red-700 mt-1">
                  Twój wskaźnik płynności wynosi {kpis.liquidityRatio.toFixed(2)}. 
                  Zalecana wartość to minimum 1.0. Rozważ zwiększenie rezerw gotówkowych.
                </p>
              </div>
            )}
            {kpis.outstandingInvoices > 5 && (
              <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-900">💰 Wiele nieopłaconych faktur</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Masz {kpis.outstandingInvoices} nieopłaconych faktur. 
                  Wyślij przypomnienia do klientów o zaległych płatnościach.
                </p>
              </div>
            )}
            {kpis.profitMargin > 20 && (
              <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                <p className="font-medium text-green-900">✅ Doskonała marża zysku</p>
                <p className="text-sm text-green-700 mt-1">
                  Twoja marża zysku wynosi {kpis.profitMargin.toFixed(1)}%, 
                  co jest bardzo dobrym wynikiem. Kontynuuj obecną strategię!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


