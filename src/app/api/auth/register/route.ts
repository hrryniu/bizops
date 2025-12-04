import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body ?? {}

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Nieprawidłowe dane wejściowe' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Użytkownik z takim adresem email już istnieje' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: typeof name === 'string' && name.trim().length > 0 ? name.trim() : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Nie udało się utworzyć konta. Spróbuj ponownie później.' },
      { status: 500 }
    )
  }
}


