'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { slugify } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

const ICONS = [
  'Rocket', 'Folder', 'Briefcase', 'Target', 'Lightbulb', 'Code', 'Palette', 'Music',
  'Camera', 'Book', 'Gamepad2', 'Heart', 'Star', 'Zap', 'Shield', 'Globe'
]

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#eab308'
]

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Rocket',
    color: '#3b82f6',
    deadline: '',
    priority: '1',
    notesMd: '',
  })

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          priority: parseInt(formData.priority),
        }),
      })

      if (response.ok) {
        const project = await response.json()
        toast({
          title: 'Utworzono',
          description: 'Projekt został utworzony',
        })
        router.push(`/projects/${project.slug}`)
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się utworzyć projektu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const SelectedIcon = LucideIcons[formData.icon as keyof typeof LucideIcons] as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nowy projekt</h1>
        <p className="text-muted-foreground">Utwórz nowy projekt z tablicą Kanban</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa projektu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generowany"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="icon">Ikona</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((icon) => {
                      const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as any
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {icon}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Kolor</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                          {color}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorytet</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Niski</SelectItem>
                    <SelectItem value="2">Średni</SelectItem>
                    <SelectItem value="3">Wysoki</SelectItem>
                    <SelectItem value="4">Krytyczny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notesMd">Notatki (Markdown)</Label>
              <textarea
                id="notesMd"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.notesMd}
                onChange={(e) => setFormData({ ...formData, notesMd: e.target.value })}
                placeholder="# Witaj w projekcie!&#10;&#10;Tutaj możesz dodać notatki w formacie Markdown..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Podgląd */}
        <Card>
          <CardHeader>
            <CardTitle>Podgląd projektu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {SelectedIcon && (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: formData.color }}
                >
                  <SelectedIcon className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{formData.name || 'Nazwa projektu'}</div>
                <div className="text-sm text-muted-foreground">
                  {formData.description || 'Opis projektu'}
                </div>
                {formData.deadline && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Deadline: {new Date(formData.deadline).toLocaleDateString('pl-PL')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Utwórz projekt'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  )
}