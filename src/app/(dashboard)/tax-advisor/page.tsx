'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Bot, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function TaxAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Witam! Jestem Twoim wirtualnym doradcą podatkowym. Posiadam wiedzę o polskim prawie podatkowym i mogę pomóc w kwestiach księgowych. Zadaj mi pytanie dotyczące podatków, faktur, VAT, PIT lub innych kwestii związanych z prowadzeniem działalności gospodarczej w Polsce.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getTaxAdvice = (question: string): string => {
    const lowerQuestion = question.toLowerCase()

    // VAT-related questions
    if (lowerQuestion.includes('vat') || lowerQuestion.includes('podatek vat')) {
      if (lowerQuestion.includes('stawka') || lowerQuestion.includes('procent')) {
        return 'W Polsce obowiązują następujące stawki VAT:\n\n• 23% - stawka podstawowa (większość towarów i usług)\n• 8% - stawka obniżona (m.in. niektóre produkty spożywcze, usługi transportowe)\n• 5% - stawka obniżona (m.in. podstawowe produkty spożywcze, książki, prasa)\n• 0% - stawka dla eksportu towarów\n• ZW - zwolnienie z VAT (np. usługi edukacyjne, medyczne)\n\nPamiętaj, że szczegółowe zastosowanie stawek reguluje Ustawa o VAT.'
      }
      if (lowerQuestion.includes('jpk') || lowerQuestion.includes('deklaracja')) {
        return 'Deklaracje VAT i JPK_VAT należy składać:\n\n• Przedsiębiorcy rozliczający się miesięcznie: do 25. dnia miesiąca następującego po miesiącu, w którym powstał obowiązek podatkowy\n• Przedsiębiorcy rozliczający się kwartalnie: do 25. dnia miesiąca następującego po kwartale\n\nStruktura JPK_VAT zawiera:\n- Część ewidencyjna (wszystkie faktury sprzedaży i zakupu)\n- Część deklaracyjna (podsumowanie VAT do zapłaty/zwrotu)\n\nPamiętaj o terminowym składaniu deklaracji, aby uniknąć sankcji!'
      }
      return 'VAT (podatek od towarów i usług) to podatek konsumpcyjny, który płacą finalnie konsumenci, ale rozliczają go przedsiębiorcy. Podstawowa stawka VAT w Polsce wynosi 23%. Przedsiębiorcy rozliczają VAT najczęściej miesięcznie lub kwartalnie poprzez system JPK_VAT. Czy masz konkretne pytanie dotyczące VAT?'
    }

    // PIT-related questions
    if (lowerQuestion.includes('pit') || lowerQuestion.includes('podatek dochodowy')) {
      if (lowerQuestion.includes('skala') || lowerQuestion.includes('liniowy')) {
        return 'W Polsce przedsiębiorcy mogą wybrać jedną z form opodatkowania:\n\n1. **Skala podatkowa** (12% i 32%):\n   - 12% do kwoty 120,000 zł\n   - 32% powyżej 120,000 zł\n   - Kwota wolna od podatku: 30,000 zł rocznie\n\n2. **Podatek liniowy** (19%):\n   - Stała stawka 19%\n   - Brak kwoty wolnej\n   - Korzystny dla wyższych dochodów\n\n3. **Ryczałt ewidencjonowany**:\n   - Stawki od 2% do 17% w zależności od rodzaju działalności\n\nWybór formy opodatkowania deklaruje się raz w roku i obowiązuje przez cały rok podatkowy.'
      }
      return 'PIT (podatek dochodowy od osób fizycznych) jest podatkiem, który płacą osoby fizyczne prowadzące działalność gospodarczą. Możesz wybrać między skalą podatkową (12% i 32%), podatkiem liniowym (19%) lub ryczałtem. Rozliczenie PIT składa się do końca kwietnia za poprzedni rok podatkowy. Czy chciałbyś poznać szczegóły poszczególnych form opodatkowania?'
    }

    // Invoice-related questions
    if (lowerQuestion.includes('faktura') || lowerQuestion.includes('faktur')) {
      if (lowerQuestion.includes('wystawić') || lowerQuestion.includes('termin')) {
        return 'Termin wystawienia faktury:\n\n• Dla dostawy towarów: do 15. dnia miesiąca następującego po miesiącu dostawy\n• Dla usług: do 15. dnia miesiąca następującego po wykonaniu usługi\n• Przy otrzymaniu całości lub części zapłaty przed dostawą/usługą: fakturę wystawia się nie później niż 15. dnia miesiąca następującego po otrzymaniu zapłaty\n\nObowiązkowe elementy faktury:\n- Numer faktury\n- Data wystawienia i data sprzedaży\n- Dane sprzedawcy i nabywcy (NIP, adres)\n- Nazwa towaru/usługi\n- Ilość, cena netto, stawka VAT, kwota VAT\n- Wartość brutto\n- Forma płatności'
      }
      if (lowerQuestion.includes('korekta') || lowerQuestion.includes('błąd')) {
        return 'Faktura korygująca:\n\nWystawia się ją w przypadku:\n• Błędów w danych na fakturze\n• Zmiany ceny\n• Zwrotu towaru\n• Udzielenia rabatu po wystawieniu faktury\n\nFaktura korygująca powinna zawierać:\n- Numer i datę faktury korygowanej\n- Numer i datę faktury korygującej\n- Przyczyny korekty\n- Prawidłowe dane\n\nPamiętaj, że nabywca musi potwierdzić otrzymanie faktury korygującej!'
      }
      return 'Faktura to dokument potwierdzający sprzedaż towaru lub wykonanie usługi. Jest podstawą do rozliczenia VAT i kosztów podatkowych. Faktury należy przechowywać przez 5 lat. Czy potrzebujesz informacji o konkretnym aspekcie faktur?'
    }

    // ZUS and social security
    if (lowerQuestion.includes('zus') || lowerQuestion.includes('składka')) {
      return 'Składki ZUS dla przedsiębiorców:\n\n**Przedsiębiorca na pełnych składkach** płaci miesięcznie (2025):\n• Składka emerytalna: ~1,100 zł\n• Składka rentowa: ~368 zł\n• Składka chorobowa (dobrowolna): ~271 zł\n• Składka wypadkowa: ~73 zł\n• Składka zdrowotna: zależna od dochodu\n\n**Ulga na start** (pierwsze 6 miesięcy):\n- Zwolnienie ze wszystkich składek ZUS\n\n**Preferencyjne składki ZUS** (małe składki, do 24 miesięcy):\n- Około 30% niższe składki społeczne\n\nSkładki ZUS należy opłacać do 10. dnia następnego miesiąca.\n\nUwaga: To informacje ogólne, konkretne kwoty mogą się różnić w zależności od sytuacji.'
    }

    // Costs and expenses
    if (lowerQuestion.includes('koszt') || lowerQuestion.includes('wydatek')) {
      return 'Koszty uzyskania przychodu:\n\n**Koszty podatkowe** to wydatki, które:\n• Są związane z prowadzoną działalnością\n• Służą osiągnięciu, zachowaniu lub zabezpieczeniu przychodów\n• Są udokumentowane (fakturami, rachunkami)\n• Nie są wymienione w katalogu kosztów nieuznawanych\n\n**Przykłady kosztów:**\n- Zakup towarów i materiałów\n- Wynajem biura\n- Media (prąd, internet, telefon)\n- Oprogramowanie i licencje\n- Koszty transportu\n- Delegacje służbowe\n- Amortyzacja środków trwałych\n\n**Nie są kosztem:**\n- Wydatki prywatne (niepowiązane z działalnością)\n- Kary i mandaty\n- Wydatki powyżej limitów ustawowych\n\nPamiętaj o prawidłowej ewidencji wszystkich kosztów!'
    }

    // KSeF - electronic invoicing
    if (lowerQuestion.includes('ksef') || lowerQuestion.includes('faktura elektroniczna')) {
      return 'KSeF (Krajowy System e-Faktur):\n\nTo obligatoryjny system faktur elektronicznych w Polsce. Ważne informacje:\n\n**Terminy wdrożenia:**\n• Dla dużych przedsiębiorców: 1 lipca 2024\n• Dla pozostałych: 1 stycznia 2025 (planowane)\n\n**Kluczowe cechy:**\n- Faktury wystawiane przez system e-Urząd Skarbowy\n- Otrzymują unikalny numer KSeF\n- Automatyczna integracja z systemami księgowymi\n- Faktury dostępne online 24/7\n\n**Korzyści:**\n- Uproszczone rozliczenia VAT\n- Automatyczna weryfikacja faktur\n- Mniejsze ryzyko błędów\n- Oszczędność czasu\n\nPrzejście na KSeF to istotna zmiana, warto się do niej przygotować!'
    }

    // Book keeping and records
    if (lowerQuestion.includes('księgow') || lowerQuestion.includes('ewidencja')) {
      return 'Formy ewidencji w działalności gospodarczej:\n\n**1. Pełna księgowość:**\n- Obowiązkowa dla spółek kapitałowych\n- Wymaga prowadzenia przez księgowego\n- Najbardziej szczegółowa forma\n\n**2. Księga przychodów i rozchodów (KPiR):**\n- Dla osób fizycznych na skali lub podatku liniowym\n- Prostsze niż pełna księgowość\n- Można prowadzić samodzielnie lub przez biuro rachunkowe\n\n**3. Ryczałt ewidencjonowany:**\n- Najprostsza forma\n- Wystarczy ewidencja przychodów\n- Nie trzeba dokumentować kosztów\n- Ograniczenia co do rodzajów działalności\n\nWybór formy zależy od typu działalności, obrotu i struktury kosztów.\n\nPolecam konsultację z księgowym przed wyborem formy rozliczeń!'
    }

    // Default response with suggestions
    return `Dziękuję za pytanie! Mogę pomóc w następujących obszarach:\n\n📋 **VAT**: Stawki, deklaracje, JPK_VAT\n💰 **PIT**: Formy opodatkowania, rozliczenia roczne\n📄 **Faktury**: Wystawianie, korekty, terminy, KSeF\n💼 **Koszty**: Koszty uzyskania przychodu\n🏦 **ZUS**: Składki, ulgi, terminy płatności\n📚 **Księgowość**: Formy ewidencji, prowadzenie ksiąg\n\nZadaj konkretne pytanie, a postaram się pomóc! Pamiętaj jednak, że jestem asystentem AI i moje odpowiedzi mają charakter informacyjny. W skomplikowanych sprawach zawsze konsultuj się z certyfikowanym doradcą podatkowym lub księgowym.`
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate thinking time
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getTaxAdvice(input),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          Doradca Podatkowy AI
        </h1>
        <p className="text-muted-foreground">
          Wirtualny asystent znający polskie prawo podatkowe i księgowe
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">Ważne zastrzeżenie:</p>
              <p>
                Ten asystent AI ma charakter wyłącznie informacyjny i edukacyjny. Odpowiedzi są oparte na ogólnej wiedzy
                o polskim prawie podatkowym według stanu na październik 2025. W przypadku konkretnych, złożonych spraw
                podatkowych lub księgowych zawsze konsultuj się z certyfikowanym doradcą podatkowym lub księgowym.
                Prawo podatkowe często się zmienia i każda sytuacja biznesowa może wymagać indywidualnego podejścia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 350px)' }}>
        <CardHeader>
          <CardTitle>Konwersacja</CardTitle>
          <CardDescription>
            Zadaj pytanie dotyczące podatków, księgowości lub prowadzenia działalności w Polsce
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
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
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-4">
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
              placeholder="Zadaj pytanie o podatki, VAT, faktury, ZUS..."
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

