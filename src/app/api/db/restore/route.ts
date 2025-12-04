import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nie przesłano pliku' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const prismaRoot = join(process.cwd(), 'prisma')
    const mainDbPath = join(prismaRoot, 'prisma', 'dev.db')
    const altDbPath = join(prismaRoot, 'dev.db')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // Utwórz kopie zapasowe istniejących baz (jeśli są)
    try {
      await fs.copyFile(mainDbPath, `${mainDbPath}.bak-${timestamp}`)
    } catch {
      // ignore if file does not exist
    }

    try {
      await fs.copyFile(altDbPath, `${altDbPath}.bak-${timestamp}`)
    } catch {
      // ignore if file does not exist
    }

    // Nadpisz obie lokalizacje tą samą bazą
    await fs.writeFile(mainDbPath, buffer)
    await fs.writeFile(altDbPath, buffer)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Database restore error:', error)
    return NextResponse.json(
      { error: 'Nie udało się zaimportować bazy danych' },
      { status: 500 }
    )
  }
}


