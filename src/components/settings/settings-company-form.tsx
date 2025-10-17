'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Save, Building2, MapPin, CreditCard, Upload, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

interface BankAccount {
  name: string
  accountNumber: string
  isDefault: boolean
  isForeign: boolean
  bicSwift?: string
  correspondentBankBic?: string
  correspondentBankAddress?: string
  currency?: string
}

interface Settings {
  id?: string
  companyName?: string | null
  companyNIP?: string | null
  companyAddress?: string | null
  companyBankAccount?: string | null
  companyLogo?: string | null
  invoiceNumbering?: string | null
  bankAccounts?: string | null
}

interface SettingsCompanyFormProps {
  settings?: Settings | null
}

export function SettingsCompanyForm({ settings }: SettingsCompanyFormProps) {
  // Parse bank accounts from JSON string
  const parseBankAccounts = (bankAccountsJson: string | null): BankAccount[] => {
    if (!bankAccountsJson) return []
    try {
      return JSON.parse(bankAccountsJson)
    } catch {
      return []
    }
  }

  const initialBankAccounts = parseBankAccounts(settings?.bankAccounts || null)
  
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || '',
    companyNIP: settings?.companyNIP || '',
    companyAddress: settings?.companyAddress || '',
    companyBankAccount: settings?.companyBankAccount || '',
    invoiceNumbering: settings?.invoiceNumbering || 'NR/{{MM}}/{{YYYY}}',
  })
  const [companyLogo, setCompanyLogo] = useState<string | null>(settings?.companyLogo || null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const { toast } = useToast()

  // Update logo when settings change
  useEffect(() => {
    if (settings?.companyLogo) {
      console.log('Loading company logo from settings:', settings.companyLogo.substring(0, 50))
      setCompanyLogo(settings.companyLogo)
    }
  }, [settings?.companyLogo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'company',
          data: {
            ...formData,
            companyLogo,
            bankAccounts: JSON.stringify(bankAccounts),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania ustawień')
      }

      toast({
        title: 'Ustawienia zapisane',
        description: 'Dane firmy zostały pomyślnie zaktualizowane.',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać ustawień. Spróbuj ponownie.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Błąd',
        description: 'Wybierz plik graficzny (JPG, PNG, GIF)',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Błąd',
        description: 'Rozmiar pliku nie może przekraczać 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingLogo(true)

    try {
      // Konwertuj plik na base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setCompanyLogo(base64)
        toast({
          title: 'Logotyp załadowany',
          description: 'Logotyp został pomyślnie załadowany.',
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować logotypu.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setCompanyLogo(null)
    toast({
      title: 'Logotyp usunięty',
      description: 'Logotyp został usunięty.',
    })
  }

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { 
      name: '', 
      accountNumber: '', 
      isDefault: prev.length === 0,
      isForeign: false,
      bicSwift: '',
      correspondentBankBic: '',
      correspondentBankAddress: '',
      currency: 'PLN'
    }])
  }

  const removeBankAccount = (index: number) => {
    setBankAccounts(prev => {
      const newAccounts = prev.filter((_, i) => i !== index)
      // If we removed the default account, make the first one default
      if (newAccounts.length > 0 && !newAccounts.some(acc => acc.isDefault)) {
        newAccounts[0].isDefault = true
      }
      return newAccounts
    })
  }

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string | boolean) => {
    setBankAccounts(prev => {
      const newAccounts = [...prev]
      newAccounts[index] = { ...newAccounts[index], [field]: value }
      
      // If setting as default, unset all others
      if (field === 'isDefault' && value === true) {
        newAccounts.forEach((acc, i) => {
          if (i !== index) acc.isDefault = false
        })
      }
      
      // If switching to foreign account, set default currency to EUR
      if (field === 'isForeign' && value === true) {
        newAccounts[index].currency = 'EUR'
      }
      
      // If switching to domestic account, clear foreign fields
      if (field === 'isForeign' && value === false) {
        newAccounts[index].bicSwift = ''
        newAccounts[index].correspondentBankBic = ''
        newAccounts[index].correspondentBankAddress = ''
        newAccounts[index].currency = 'PLN'
      }
      
      return newAccounts
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Logotyp firmy */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Logotyp firmy
          </Label>
          <div className="space-y-3">
            {companyLogo ? (
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-48 h-36 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-50 p-4 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src={companyLogo || ''}
                      alt="Logotyp firmy"
                      className="max-w-full max-h-full object-contain"
                      style={{ display: companyLogo ? 'block' : 'none' }}
                      onLoad={() => console.log('Logo loaded successfully')}
                      onError={(e) => {
                        console.error('Error loading logo. Logo data:', companyLogo?.substring(0, 100))
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {!companyLogo && (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Brak logo</p>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveLogo}
                    title="Usuń logo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <p className="text-sm font-medium">Logotyp załadowany</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Najedź na logo aby zobaczyć opcję usunięcia</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload-replace"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload-replace')?.click()}
                    disabled={isUploadingLogo}
                    className="flex items-center gap-2 mt-2 w-fit"
                  >
                    <Upload className="h-3 w-3" />
                    Zmień logo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Brak logotypu</p>
                <p className="text-xs text-gray-500 mb-3">Zalecany format: PNG, JPG (max 5MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploadingLogo ? 'Ładowanie...' : 'Wybierz plik'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Nazwa firmy
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Nazwa Twojej firmy"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyNIP">NIP</Label>
          <Input
            id="companyNIP"
            value={formData.companyNIP}
            onChange={(e) => handleChange('companyNIP', e.target.value)}
            placeholder="000-000-00-00"
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{2}"
          />
          <p className="text-xs text-muted-foreground">
            Format: 000-000-00-00 (10 cyfr z myślnikami)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adres firmy
          </Label>
          <Input
            id="companyAddress"
            value={formData.companyAddress}
            onChange={(e) => handleChange('companyAddress', e.target.value)}
            placeholder="Ulica, kod pocztowy, miasto"
          />
        </div>

        {/* Konta bankowe */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Konta bankowe
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBankAccount}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Dodaj konto
            </Button>
          </div>
          
          {bankAccounts.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Brak kont bankowych</p>
              <p className="text-xs text-gray-500 mb-3">Dodaj konta bankowe dla swojej firmy</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBankAccount}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Dodaj pierwsze konto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
                        {bankAccounts.map((account, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={account.isDefault}
                                    onChange={(e) => updateBankAccount(index, 'isDefault', e.target.checked)}
                                    className="rounded"
                                  />
                                  <Label className="text-sm font-medium">
                                    {account.isDefault ? 'Konto domyślne' : 'Konto dodatkowe'}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={account.isForeign}
                                    onChange={(e) => updateBankAccount(index, 'isForeign', e.target.checked)}
                                    className="rounded"
                                  />
                                  <Label className="text-sm font-medium">
                                    Konto walutowe
                                  </Label>
                                </div>
                              </div>
                              {bankAccounts.length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeBankAccount(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`account-name-${index}`}>Nazwa konta</Label>
                                <Input
                                  id={`account-name-${index}`}
                                  value={account.name}
                                  onChange={(e) => updateBankAccount(index, 'name', e.target.value)}
                                  placeholder="np. Konto operacyjne, Konto inwestycyjne"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`account-number-${index}`}>Numer konta</Label>
                                <Input
                                  id={`account-number-${index}`}
                                  value={account.accountNumber}
                                  onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                                  placeholder={account.isForeign ? "IBAN: XX XX XXXX XXXX XXXX XXXX XXXX" : "XX XXXX XXXX XXXX XXXX XXXX XXXX"}
                                  required
                                />
                              </div>
                            </div>

                            {/* Foreign account fields */}
                            {account.isForeign && (
                              <div className="space-y-3 border-t pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label htmlFor={`bic-swift-${index}`}>Kod BIC/SWIFT</Label>
                                    <Input
                                      id={`bic-swift-${index}`}
                                      value={account.bicSwift || ''}
                                      onChange={(e) => updateBankAccount(index, 'bicSwift', e.target.value)}
                                      placeholder="np. DEUTDEFF"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`currency-${index}`}>Waluta</Label>
                                    <select
                                      id={`currency-${index}`}
                                      value={account.currency || 'EUR'}
                                      onChange={(e) => updateBankAccount(index, 'currency', e.target.value)}
                                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                      required
                                    >
                                      <option value="EUR">EUR - Euro</option>
                                      <option value="USD">USD - Dolar amerykański</option>
                                      <option value="GBP">GBP - Funt brytyjski</option>
                                      <option value="CHF">CHF - Frank szwajcarski</option>
                                      <option value="CZK">CZK - Korona czeska</option>
                                      <option value="SEK">SEK - Korona szwedzka</option>
                                      <option value="NOK">NOK - Korona norweska</option>
                                      <option value="DKK">DKK - Korona duńska</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`correspondent-bic-${index}`}>BIC banku korespondenta</Label>
                                  <Input
                                    id={`correspondent-bic-${index}`}
                                    value={account.correspondentBankBic || ''}
                                    onChange={(e) => updateBankAccount(index, 'correspondentBankBic', e.target.value)}
                                    placeholder="np. CHASUS33"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`correspondent-address-${index}`}>Adres banku korespondenta</Label>
                                  <textarea
                                    id={`correspondent-address-${index}`}
                                    value={account.correspondentBankAddress || ''}
                                    onChange={(e) => updateBankAccount(index, 'correspondentBankAddress', e.target.value)}
                                    placeholder="Pełny adres banku korespondenta"
                                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
            </div>
          )}
          
          {/* Legacy single bank account field - hidden but kept for backward compatibility */}
          <Input
            id="companyBankAccount"
            value={formData.companyBankAccount}
            onChange={(e) => handleChange('companyBankAccount', e.target.value)}
            placeholder="XX XXXX XXXX XXXX XXXX XXXX XXXX"
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumbering">Wzorzec numeracji faktur</Label>
          <Input
            id="invoiceNumbering"
            value={formData.invoiceNumbering}
            onChange={(e) => handleChange('invoiceNumbering', e.target.value)}
            placeholder="NR/{{MM}}/{{YYYY}}"
          />
          <p className="text-xs text-muted-foreground">
            Dostępne zmienne: {'{{MM}}'} (miesiąc), {'{{YYYY}}'} (rok), {'{{DD}}'} (dzień)
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
      </Button>
    </form>
  )
}
