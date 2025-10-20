'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, AlertCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  followUpQuestions?: string[]
}

export default function TaxAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Witam! 👋 Jestem Twoim inteligentnym doradcą podatkowym. Nie jestem zwykłym chatbotem - mam dostęp do Twoich danych finansowych i mogę przeprowadzić szczegółową analizę Twojej sytuacji podatkowej.\n\nMogę:\n• Przeanalizować Twoje przychody, koszty i VAT\n• Oszacować PIT i pomóc w optymalizacji\n• Doradzić w kwestiach faktur i ZUS\n• Przeprowadzić rozmowę i zadawać pytania\n• Udzielić spersonalizowanych porad\n\nZacznijmy! Jak mogę Ci dzisiaj pomóc?',
      timestamp: new Date(),
      followUpQuestions: [
        'Przeanalizuj moją sytuację podatkową',
        'Ile VAT muszę zapłacić?',
        'Jak mogę zoptymalizować koszty?',
      ],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input
    if (!messageToSend.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/tax-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get advice')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp),
        followUpQuestions: data.followUpQuestions || [],
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się uzyskać porady. Spróbuj ponownie.',
        variant: 'destructive',
      })
      
      // Fallback to simple response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd podczas analizy. Spróbuj ponownie lub zadaj inne pytanie.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
      setIsAnalyzing(false)
    }
  }

  const handleFollowUpClick = (question: string) => {
    setInput(question)
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <Bot className="h-8 w-8 text-primary" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          Inteligentny Doradca Podatkowy AI
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Analizuję Twoje dane finansowe i udzielam spersonalizowanych porad
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Inteligentny doradca z kontekstem</p>
                <p>
                  Ten asystent AI ma dostęp do Twoich danych finansowych (faktury, koszty, dane firmy) i może przeprowadzić
                  szczegółową analizę Twojej sytuacji podatkowej. Zadaje pytania, doradza i pomaga optymalizować podatki!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold mb-1">Ważne zastrzeżenie</p>
                <p>
                  Asystent ma charakter informacyjny. Odpowiedzi oparte są na ogólnej wiedzy o polskim prawie podatkowym
                  (październik 2025). W złożonych sprawach konsultuj się z certyfikowanym doradcą podatkowym.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 350px)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Konwersacja
            {isAnalyzing && (
              <Badge variant="secondary" className="animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Analizuję...
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Zadaj pytanie - doradca przeanalizuje Twoją sytuację i udzieli spersonalizowanej porady
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
              
              {/* Follow-up questions */}
              {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                <div className="flex gap-2 flex-wrap ml-11">
                  <p className="text-xs text-muted-foreground w-full mb-1">💡 Sugerowane pytania:</p>
                  {message.followUpQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleFollowUpClick(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    {isAnalyzing ? 'Analizuję Twoje dane finansowe...' : 'Piszę odpowiedź...'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Np. 'Przeanalizuj moją sytuację podatkową' lub 'Ile VAT muszę zapłacić?'"
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Wskazówka: Bądź konkretny w swoich pytaniach. Doradca analizuje Twoje dane i dostosowuje odpowiedzi do Twojej sytuacji.
          </p>
        </div>
      </Card>
    </div>
  )
}

