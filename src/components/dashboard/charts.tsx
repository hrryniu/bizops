'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type MonthlyData = {
  month: string
  revenue: number
  costs: number
  profit: number
}

type CategoryData = {
  name: string
  value: number
  color: string
}

type VatData = {
  name: string
  value: number
  color: string
}

interface ChartsProps {
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
  vatData: VatData[]
  isVatPayer?: boolean
}

export function Charts({ monthlyData, categoryData, vatData, isVatPayer = true }: ChartsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Wykres miesięczny - Przychody vs Koszty */}
      <Card>
        <CardHeader>
          <CardTitle>Przychody vs Koszty (ostatnie 6 miesięcy)</CardTitle>
          <CardDescription>Porównanie miesięcznych przychodów i kosztów</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace(' zł', 'k')} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Przychody" />
              <Bar dataKey="costs" fill="#ef4444" name="Koszty" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Wykres kategorii kosztów */}
      <Card>
        <CardHeader>
          <CardTitle>Koszty według kategorii</CardTitle>
          <CardDescription>Rozkład kosztów w ostatnich 6 miesiącach</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Brak danych o kosztach
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wykres VAT - tylko dla płatników VAT */}
      {isVatPayer && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>VAT - Należny vs Naliczony</CardTitle>
            <CardDescription>Podsumowanie VAT w ostatnich 6 miesiącach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Należny VAT</h4>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(vatData.find(v => v.name === 'Należny')?.value || 0)}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Naliczony VAT</h4>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(vatData.find(v => v.name === 'Naliczony')?.value || 0)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-lg font-medium">
                Do zapłaty: {formatCurrency(
                  (vatData.find(v => v.name === 'Należny')?.value || 0) - 
                  (vatData.find(v => v.name === 'Naliczony')?.value || 0)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}