import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Domyślny użytkownik testowy
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@bizops.local' },
    update: {},
    create: {
      email: 'admin@bizops.local',
      passwordHash: hashedPassword,
      name: 'Administrator',
    },
  })

  console.log('✅ User created:', user.email)

  // Domyślne ustawienia z szablonami kalendarza podatkowego
  const calendarTemplates = [
    {
      key: 'VAT_JPK',
      title: 'VAT JPK_V7',
      description: 'Deklaracja VAT-7/JPK_V7 za miesiąc poprzedni',
      rule: {
        freq: 'monthly',
        dayOfMonth: 25,
        offsetMonths: 1,
      },
    },
    {
      key: 'ZUS',
      title: 'ZUS Składki',
      description: 'Opłacenie składek ZUS za miesiąc bieżący',
      rule: {
        freq: 'monthly',
        dayOfMonth: 20,
        offsetMonths: 0,
      },
    },
    {
      key: 'PIT',
      title: 'Zaliczka PIT',
      description: 'Zaliczka na podatek dochodowy za miesiąc poprzedni',
      rule: {
        freq: 'monthly',
        dayOfMonth: 20,
        offsetMonths: 1,
      },
    },
  ]

  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: 'Moja Firma Sp. z o.o.',
      companyNIP: '1234567890',
      companyAddress: 'ul. Przykładowa 1, 00-000 Warszawa',
      companyBankAccount: '12 3456 7890 1234 5678 9012 3456',
      invoiceNumbering: 'FV/{{MM}}/{{YYYY}}/{{NR}}',
      taxFormLabel: 'Podatek liniowy 19%',
      defaultVatRates: JSON.stringify(['23', '8', '5', '0', 'zw']),
      calendarTemplates: JSON.stringify(calendarTemplates),
      locale: 'pl-PL',
      darkMode: 'system',
    },
  })

  console.log('✅ Settings created for user')

  // Przykładowe projekty z domyślnymi kolumnami Kanban
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'Projekt Startowy',
      slug: 'projekt-startowy',
      color: '#3b82f6',
      icon: 'Rocket',
      description: 'Przykładowy projekt do rozpoczęcia pracy',
      priority: 1,
      status: 'active',
      notesMd: '# Witaj w BizOps!\n\nTo jest przykładowy projekt.',
      columns: {
        create: [
          { name: 'Backlog', order: 0 },
          { name: 'W trakcie', order: 1 },
          { name: 'Przegląd', order: 2 },
          { name: 'Zrobione', order: 3 },
        ],
      },
    },
    include: { columns: true },
  })

  console.log('✅ Project created:', project.name)

  // Przykładowe zadanie
  await prisma.task.create({
    data: {
      projectId: project.id,
      columnId: project.columns[0].id,
      title: 'Zapoznaj się z aplikacją',
      description: 'Przejrzyj wszystkie moduły: faktury, koszty, kalendarz, projekty',
      priority: 1,
      checklist: JSON.stringify([
        { text: 'Otwórz moduł Faktur', done: false },
        { text: 'Sprawdź Kalendarz podatkowy', done: false },
        { text: 'Dodaj pierwszy koszt', done: false },
      ]),
      tags: JSON.stringify(['onboarding']),
    },
  })

  console.log('✅ Task created')

  // Generuj zdarzenia podatkowe na najbliższe 6 miesięcy
  const today = new Date()
  const futureMonths = 6

  for (let month = 0; month < futureMonths; month++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + month, 1)

    for (const template of calendarTemplates) {
      const rule = template.rule as any
      const eventMonth = rule.offsetMonths
        ? targetDate.getMonth() - rule.offsetMonths
        : targetDate.getMonth()
      const eventYear = targetDate.getFullYear()

      const dueDate = new Date(eventYear, eventMonth, rule.dayOfMonth)

      // Tylko przyszłe zdarzenia
      if (dueDate > today) {
        await prisma.taxEvent.create({
          data: {
            userId: user.id,
            templateKey: template.key,
            title: template.title,
            description: template.description,
            dueDate: dueDate,
            status: 'PENDING',
          },
        })
      }
    }
  }

  console.log('✅ Tax events generated')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




