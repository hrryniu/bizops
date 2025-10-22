# Funkcjonalność Logo na Fakturach - Dokumentacja

## ✅ Zaimplementowane

### 1. Schemat bazy danych
W `prisma/schema.prisma` dodano pola w modelu `Settings`:
- `companyLogo`: String? - Ścieżka do pliku logo lub dane base64
- `showLogoOnInvoices`: Boolean @default(true) - Czy wyświetlać logo na fakturach

### 2. Generator PDF (`src/lib/pdf-generator.ts`)
Dodano funkcjonalność renderowania logo na fakturach PDF:

#### Obsługiwane formaty:
- **Base64**: Logo zapisane jako data URL (np. `data:image/png;base64,iVBOR...`)
- **Plik z systemu**: Logo zapisane w folderze `public/` (np. `logo.png`)

#### Obsługiwane typy obrazów:
- PNG (.png)
- JPEG (.jpg, .jpeg)

#### Implementacja:
1. Logo jest wczytywane z ustawień użytkownika
2. Jeśli `showLogoOnInvoices` jest `true`, logo jest renderowane
3. Logo jest skalowane do maksymalnej wysokości 40px z zachowaniem proporcji
4. Logo jest renderowane w lewym górnym rogu faktury

#### Szablony z logo:
Wszystkie 4 szablony faktur obsługują logo:

1. **Classic** - Logo zastępuje placeholder "afaktury.pl"
2. **Professional** - Logo zastępuje placeholder "CARGOLINK" 
3. **Modern** - Logo renderowane po lewej stronie z przesunięciem nagłówka
4. **Minimal** - Logo renderowane na górze z przesunięciem całej zawartości

### 3. Interfejs użytkownika

#### Formularz danych firmy (`src/components/settings/settings-company-form.tsx`)
- Upload logo (drag & drop lub wybór pliku)
- Podgląd logo na żywo
- Usuwanie logo
- Walidacja: max 5MB, tylko pliki graficzne
- Logo jest konwertowane na base64 przed zapisaniem

#### Formularz ustawień faktur (`src/components/settings/settings-invoice-form.tsx`)
- Checkbox "Dodaj logo do wystawianych faktur"
- Wybór szablonu faktury (4 opcje z podglądem)

### 4. API Endpoint (`src/app/api/settings/route.ts`)
Obsługuje zapisywanie:
- `companyLogo` w sekcji 'company'
- `showLogoOnInvoices` w sekcji 'invoice'

### 5. Seed bazy danych (`prisma/seed.ts`)
Domyślne ustawienia:
```typescript
companyLogo: 'logo.png'
showLogoOnInvoices: true
```

## 🧪 Testowanie

### Krok 1: Zaloguj się do aplikacji
```
Email: admin@bizops.local
Hasło: admin123
```

### Krok 2: Przejdź do Ustawień > Dane firmy
1. Kliknij "Wybierz plik" w sekcji "Logotyp firmy"
2. Wybierz plik PNG lub JPG (max 5MB)
3. Podgląd logo powinien się pojawić
4. Kliknij "Zapisz ustawienia"

### Krok 3: Przejdź do Ustawień > Faktury
1. Upewnij się że checkbox "Dodaj logo do wystawianych faktur" jest zaznaczony
2. Wybierz szablon faktury
3. Kliknij "Zapisz ustawienia"

### Krok 4: Generuj fakturę PDF
1. Przejdź do Faktury
2. Wybierz fakturę z listy
3. Kliknij przycisk "Pobierz PDF"
4. Otwórz wygenerowany PDF - logo powinno być widoczne

## 🔧 Rozwiązywanie problemów

### Logo nie pojawia się na fakturze
1. Sprawdź czy `showLogoOnInvoices` jest `true` w ustawieniach
2. Sprawdź czy `companyLogo` nie jest `null` w bazie danych
3. Sprawdź logi konsoli przeglądarki i serwera
4. Sprawdź czy plik logo ma prawidłowy format (PNG/JPG)

### Logo jest zniekształcone
- Logo jest automatycznie skalowane do max wysokości 40px z zachowaniem proporcji
- Zalecane proporcje: 16:9 lub 4:3
- Zalecana rozdzielczość: co najmniej 200x50px

### Logo nie ładuje się w formularzu
1. Sprawdź rozmiar pliku (max 5MB)
2. Sprawdź format pliku (tylko PNG, JPG, JPEG)
3. Sprawdź logi konsoli przeglądarki

## 📝 Przykładowy kod

### Ręczne testowanie w API
```javascript
// Test zapisywania logo
fetch('/api/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'company',
    data: {
      companyLogo: 'data:image/png;base64,iVBOR...',
      companyName: 'Moja Firma',
      companyNIP: '123-456-78-90',
      companyAddress: 'ul. Przykładowa 1, 00-000 Warszawa'
    }
  })
})

// Test włączania/wyłączania logo
fetch('/api/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'invoice',
    data: {
      showLogoOnInvoices: true,
      invoiceTemplate: 'modern'
    }
  })
})
```

## 🎯 Przyszłe usprawnienia

Możliwe rozszerzenia funkcjonalności:
- [ ] Obsługa SVG
- [ ] Opcje pozycjonowania logo (lewo/środek/prawo)
- [ ] Opcje rozmiaru logo (mały/średni/duży)
- [ ] Upload logo bezpośrednio na serwer (zamiast base64)
- [ ] Galeria predefiniowanych logo
- [ ] Watermark na fakturach

## 📚 Technologie

- **pdf-lib**: Generowanie i edycja PDF
- **Buffer**: Konwersja base64 na binarne dane obrazu
- **FileReader API**: Odczyt plików w przeglądarce
- **Prisma ORM**: Zarządzanie bazą danych

## ✨ Funkcjonalność działa!

Wszystkie komponenty zostały zaimplementowane i przetestowane. Logo firmy będzie automatycznie pojawiać się na wszystkich generowanych fakturach PDF, jeśli:
1. Logo zostało uploadowane w ustawieniach
2. Opcja "Dodaj logo do wystawianych faktur" jest włączona


