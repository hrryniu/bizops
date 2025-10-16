'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, X } from 'lucide-react'

interface TemplatePreviewDialogProps {
  template: 'modern' | 'classic' | 'minimal'
  isOpen: boolean
  onClose: () => void
}

export function TemplatePreviewDialog({ template, isOpen, onClose }: TemplatePreviewDialogProps) {
  const [zoom, setZoom] = useState(1)

  const getTemplatePreview = () => {
    const baseStyles = "w-full transition-transform rounded-lg shadow-lg bg-white p-6"
    
    switch (template) {
      case 'modern':
        return (
          <div className={baseStyles} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="space-y-4">
              <div className="flex justify-between items-start bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div>
                  <h1 className="text-2xl font-bold">FAKTURA VAT</h1>
                  <p className="text-sm">Nr FV/2025/001</p>
                </div>
                <div className="text-right text-sm">
                  <p>Data wystawienia: 15.10.2025</p>
                  <p>Data sprzedaży: 15.10.2025</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-bold text-blue-600 mb-2">Sprzedawca:</h3>
                  <p className="font-semibold">Twoja Firma Sp. z o.o.</p>
                  <p className="text-gray-600">NIP: 123-456-78-90</p>
                  <p className="text-gray-600">ul. Przykładowa 1</p>
                  <p className="text-gray-600">00-001 Warszawa</p>
                </div>
                <div>
                  <h3 className="font-bold text-blue-600 mb-2">Nabywca:</h3>
                  <p className="font-semibold">Klient Sp. z o.o.</p>
                  <p className="text-gray-600">NIP: 987-654-32-10</p>
                  <p className="text-gray-600">ul. Testowa 2</p>
                  <p className="text-gray-600">00-002 Kraków</p>
                </div>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-blue-200 p-2 text-left">Lp.</th>
                    <th className="border border-blue-200 p-2 text-left">Nazwa</th>
                    <th className="border border-blue-200 p-2 text-right">Ilość</th>
                    <th className="border border-blue-200 p-2 text-right">Cena netto</th>
                    <th className="border border-blue-200 p-2 text-right">VAT</th>
                    <th className="border border-blue-200 p-2 text-right">Wartość brutto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2">1</td>
                    <td className="border border-gray-200 p-2">Usługa projektowa</td>
                    <td className="border border-gray-200 p-2 text-right">1 szt</td>
                    <td className="border border-gray-200 p-2 text-right">5,000.00 zł</td>
                    <td className="border border-gray-200 p-2 text-right">23%</td>
                    <td className="border border-gray-200 p-2 text-right">6,150.00 zł</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-1 text-sm">
                  <div className="flex justify-between border-t pt-2">
                    <span>Razem netto:</span>
                    <span className="font-semibold">5,000.00 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (23%):</span>
                    <span className="font-semibold">1,150.00 zł</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-blue-600 pt-2 text-lg font-bold text-blue-600">
                    <span>Razem brutto:</span>
                    <span>6,150.00 zł</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'classic':
        return (
          <div className={baseStyles} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="space-y-4 border-4 border-gray-800 p-6">
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">FAKTURA VAT</h1>
                <p className="text-lg mt-2">Nr FV/2025/001</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-gray-400 p-3">
                  <h3 className="font-bold mb-2 underline">Sprzedawca:</h3>
                  <p className="font-semibold">Twoja Firma Sp. z o.o.</p>
                  <p>NIP: 123-456-78-90</p>
                  <p>ul. Przykładowa 1</p>
                  <p>00-001 Warszawa</p>
                </div>
                <div className="border border-gray-400 p-3">
                  <h3 className="font-bold mb-2 underline">Nabywca:</h3>
                  <p className="font-semibold">Klient Sp. z o.o.</p>
                  <p>NIP: 987-654-32-10</p>
                  <p>ul. Testowa 2</p>
                  <p>00-002 Kraków</p>
                </div>
              </div>

              <div className="text-sm space-y-1 bg-gray-100 p-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Data wystawienia:</span>
                  <span>15.10.2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Data sprzedaży:</span>
                  <span>15.10.2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Termin płatności:</span>
                  <span>29.10.2025</span>
                </div>
              </div>

              <table className="w-full border-2 border-gray-800 text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="border border-gray-600 p-2 text-left">Lp.</th>
                    <th className="border border-gray-600 p-2 text-left">Nazwa</th>
                    <th className="border border-gray-600 p-2 text-right">Ilość</th>
                    <th className="border border-gray-600 p-2 text-right">Cena netto</th>
                    <th className="border border-gray-600 p-2 text-right">VAT</th>
                    <th className="border border-gray-600 p-2 text-right">Wartość brutto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2">1</td>
                    <td className="border border-gray-400 p-2">Usługa projektowa</td>
                    <td className="border border-gray-400 p-2 text-right">1 szt</td>
                    <td className="border border-gray-400 p-2 text-right">5,000.00 zł</td>
                    <td className="border border-gray-400 p-2 text-right">23%</td>
                    <td className="border border-gray-400 p-2 text-right">6,150.00 zł</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-1 text-sm border-2 border-gray-800 p-3 bg-gray-50">
                  <div className="flex justify-between">
                    <span className="font-semibold">Razem netto:</span>
                    <span>5,000.00 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">VAT (23%):</span>
                    <span>1,150.00 zł</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-lg font-bold">
                    <span>Razem brutto:</span>
                    <span>6,150.00 zł</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'minimal':
        return (
          <div className={baseStyles} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-light text-gray-900">FAKTURA</h1>
                  <p className="text-sm text-gray-500 mt-1">FV/2025/001</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>15.10.2025</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">OD:</h3>
                  <p className="font-medium text-gray-900">Twoja Firma Sp. z o.o.</p>
                  <p className="text-gray-600">NIP: 123-456-78-90</p>
                  <p className="text-gray-600">ul. Przykładowa 1</p>
                  <p className="text-gray-600">00-001 Warszawa</p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">DLA:</h3>
                  <p className="font-medium text-gray-900">Klient Sp. z o.o.</p>
                  <p className="text-gray-600">NIP: 987-654-32-10</p>
                  <p className="text-gray-600">ul. Testowa 2</p>
                  <p className="text-gray-600">00-002 Kraków</p>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase">
                      <th className="pb-2">Usługa</th>
                      <th className="pb-2 text-right">Ilość</th>
                      <th className="pb-2 text-right">Cena</th>
                      <th className="pb-2 text-right">VAT</th>
                      <th className="pb-2 text-right">Suma</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="py-3 font-medium">Usługa projektowa</td>
                      <td className="py-3 text-right">1 szt</td>
                      <td className="py-3 text-right">5,000.00 zł</td>
                      <td className="py-3 text-right">23%</td>
                      <td className="py-3 text-right font-semibold">6,150.00 zł</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-1/2 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Netto:</span>
                    <span>5,000.00 zł</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>VAT:</span>
                    <span>1,150.00 zł</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-green-600 text-lg font-semibold text-green-600">
                    <span>DO ZAPŁATY</span>
                    <span>6,150.00 zł</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const handleZoomIn = () => {
    if (zoom < 2) setZoom(prev => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    if (zoom > 0.5) setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              Podgląd szablonu: {template === 'modern' ? 'Modern' : template === 'classic' ? 'Classic' : 'Minimal'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 2}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-auto max-h-[70vh] p-4">
          {getTemplatePreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

