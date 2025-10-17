'use client'

import { useState } from 'react'
import { Settings, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DashboardSection {
  id: string
  title: string
  order: number
  visible: boolean
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'stats', title: 'Statystyki', order: 0, visible: true },
  { id: 'tax-events', title: 'Terminy podatkowe', order: 1, visible: true },
  { id: 'invoices', title: 'Ostatnie faktury', order: 2, visible: true },
  { id: 'expenses', title: 'Ostatnie koszty', order: 3, visible: true },
  { id: 'charts', title: 'Wykresy', order: 4, visible: true },
]

interface EditableDashboardProps {
  children: React.ReactNode[]
}

export function EditableDashboard({ children }: EditableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [sections, setSections] = useState<DashboardSection[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-layout')
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS
    }
    return DEFAULT_SECTIONS
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedItem(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    
    if (draggedItem && draggedItem !== targetId) {
      const draggedIndex = sections.findIndex(s => s.id === draggedItem)
      const targetIndex = sections.findIndex(s => s.id === targetId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newSections = [...sections]
        const [removed] = newSections.splice(draggedIndex, 1)
        newSections.splice(targetIndex, 0, removed)
        
        // Update order
        newSections.forEach((section, index) => {
          section.order = index
        })
        
        setSections(newSections)
      }
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const toggleVisibility = (sectionId: string) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    )
    setSections(newSections)
  }

  const saveLayout = () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(sections))
    setIsEditMode(false)
  }

  const resetLayout = () => {
    setSections(DEFAULT_SECTIONS)
    localStorage.removeItem('dashboard-layout')
  }

  // Map children to sections
  const sectionComponents: Record<string, React.ReactNode> = {
    'stats': children[0],
    'tax-events': children[1],
    'invoices': children[2],
    'expenses': children[3],
    'charts': children[4],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditMode(!isEditMode)}
              title={isEditMode ? 'Zakończ edycję' : 'Edytuj układ'}
            >
              <Settings className={`h-5 w-5 ${isEditMode ? 'text-blue-500 animate-spin-slow' : ''}`} />
            </Button>
          </div>
          <p className="text-muted-foreground">
            {isEditMode ? 'Przeciągnij panele, aby zmienić układ' : 'Witaj w BizOps! Oto przegląd Twojej działalności.'}
          </p>
        </div>
        
        {isEditMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetLayout}>
              Przywróć domyślne
            </Button>
            <Button onClick={saveLayout}>
              Zapisz układ
            </Button>
          </div>
        )}
      </div>

      {isEditMode ? (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Zarządzaj panelami</h3>
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                  draggedItem === section.id ? 'opacity-50' : ''
                } ${section.visible ? 'bg-card' : 'bg-muted'}`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{section.title}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVisibility(section.id)}
                >
                  {section.visible ? 'Ukryj' : 'Pokaż'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Render sections in order */}
      {sections
        .filter(section => section.visible)
        .sort((a, b) => a.order - b.order)
        .map(section => (
          <div key={section.id}>
            {sectionComponents[section.id]}
          </div>
        ))}
    </div>
  )
}

