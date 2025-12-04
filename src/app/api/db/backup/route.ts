import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Aplikacja korzysta z pliku prisma/prisma/dev.db (sprawdzone przez PRAGMA database_list)
    const dbPath = join(process.cwd(), 'prisma', 'prisma', 'dev.db')
    const fileBuffer = await fs.readFile(dbPath)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `bizops-database-backup-${timestamp}.db`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Database backup error:', error)
    return NextResponse.json(
      { error: 'Nie udało się wyeksportować bazy danych' },
      { status: 500 }
    )
  }
}


