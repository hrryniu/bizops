/**
 * 🤖 AI Financial Assistant Panel
 * 
 * Interactive AI assistant for natural language financial queries
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, TrendingUp, DollarSign, AlertCircle, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickSummary {
  label: string
  value: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<QuickSummary[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load initial summary and suggestions
  useEffect(() => {
    loadQuickSummary()
    loadSuggestions()
  }, [])

  const loadQuickSummary = async () => {
    try {
      const response = await fetch('/api/kpi/calculate')
      if (response.ok) {
        const kpis = await response.json()
        
        setSummary([
          {
            label: 'Zysk netto',
            value: `${kpis.netProfit?.toFixed(2) || 0} PLN`,
            icon: <TrendingUp className="w-5 h-5" />,
            trend: kpis.netProfit > 0 ? 'up' : 'down',
          },
          {
            label: 'Nieopłacone faktury',
            value: `${kpis.outstandingInvoices || 0}`,
            icon: <DollarSign className="w-5 h-5" />,
            trend: 'neutral',
          },
          {
            label: 'Marża zysku',
            value: `${kpis.profitMargin?.toFixed(1) || 0}%`,
            icon: <Sparkles className="w-5 h-5" />,
            trend: kpis.profitMargin > 20 ? 'up' : kpis.profitMargin < 10 ? 'down' : 'neutral',
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  const loadSuggestions = () => {
    setSuggestions([
      'Jaki był mój przychód w tym miesiącu?',
      'Ile wynoszą moje zobowiązania podatkowe?',
      'Porównaj moje koszty z ostatnich 3 miesięcy',
      'Czy wystarczy mi gotówki na koniec miesiąca?',
      'W których kategoriach najwięcej wydaję?',
    ])
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('AI query error:', error)
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania zapytania. Spróbuj ponownie.',
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Quick Summary Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Szybkie podsumowanie
          </h3>
          
          <div className="space-y-4">
            {summary.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  {item.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </span>
                  {item.trend === 'up' && (
                    <span className="text-green-600 text-sm">▲</span>
                  )}
                  {item.trend === 'down' && (
                    <span className="text-red-600 text-sm">▼</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-1">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Rekomendacje AI
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900">
                Wysokie koszty transportu
              </p>
              <p className="text-xs text-orange-700 mt-1">
                W tym miesiącu wydałeś 20% więcej na transport niż zwykle
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Dobra marża zysku
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Twoja marża zysku (22%) jest wyższa niż średnia branżowa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Asystent Finansowy AI
          </h2>
          <p className="text-gray-600 mt-2">
            Zapytaj mnie o cokolwiek dotyczącego Twoich finansów
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Witaj! Jestem Twoim asystentem finansowym
                </h3>
                <p className="text-gray-600 mb-6">
                  Mogę odpowiedzieć na pytania o Twoje przychody, koszty, podatki i wiele więcej.
                  Spróbuj zadać jedno z poniższych pytań:
                </p>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-purple-900">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={message.role === 'user' ? 'text-white' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">Ty</span>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-gray-600">Myślę...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions */}
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Sugerowane pytania:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs hover:bg-purple-50 hover:border-purple-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Zadaj pytanie o swoje finanse..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


