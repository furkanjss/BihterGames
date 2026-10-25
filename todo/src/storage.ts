import type { AppData, FinanceEntry, Project, Task } from './types'

const KEY = 'bihter-studio-todos-v1'

function uid() {
  return crypto.randomUUID()
}

export function createDefaultData(): AppData {
  const personalId = uid()
  const gameId = uid()
  const now = new Date().toISOString()
  const month = now.slice(0, 7)

  const projects: Project[] = [
    {
      id: personalId,
      name: 'Kişisel',
      kind: 'personal',
      createdAt: now,
      status: 'production',
      description: 'Kişisel işler ve günlük planlar.',
    },
    {
      id: gameId,
      name: 'Yeni Oyun',
      kind: 'game',
      createdAt: now,
      status: 'preprod',
      engine: 'Unity',
      platforms: ['PC', 'Steam'],
      genre: 'Macera',
      description: 'İlk dikey dilim.',
      startDate: now.slice(0, 10),
      budgetAmount: 50000,
      budgetCurrency: 'TRY',
    },
  ]

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const tasks: Task[] = [
    {
      id: uid(),
      projectId: gameId,
      title: 'Dikey dilim tasarım dokümanı yaz',
      area: 'design',
      priority: 'high',
      done: false,
      createdAt: now,
      dueDate: now.slice(0, 10),
    },
    {
      id: uid(),
      projectId: gameId,
      title: 'Karakter hareketi prototipi',
      area: 'code',
      priority: 'high',
      done: false,
      createdAt: now,
      dueDate: tomorrow.toISOString().slice(0, 10),
    },
    {
      id: uid(),
      projectId: gameId,
      title: 'İlk seviye blockout',
      area: 'art',
      priority: 'medium',
      done: false,
      createdAt: now,
      dueDate: nextWeek.toISOString().slice(0, 10),
    },
    {
      id: uid(),
      projectId: personalId,
      title: 'Haftalık planı çıkar',
      area: 'personal',
      priority: 'medium',
      done: false,
      createdAt: now,
      dueDate: now.slice(0, 10),
    },
  ]

  const finance: FinanceEntry[] = [
    {
      id: uid(),
      type: 'budget',
      label: 'Aylık stüdyo bütçesi',
      amount: 80000,
      currency: 'TRY',
      date: `${month}-01`,
      month,
      category: 'Bütçe',
      createdAt: now,
    },
    {
      id: uid(),
      type: 'payroll',
      label: 'Çekirdek ekip maaşı',
      amount: 45000,
      currency: 'TRY',
      date: `${month}-01`,
      month,
      category: 'Maaş',
      recurring: true,
      createdAt: now,
    },
    {
      id: uid(),
      type: 'expense',
      label: 'Unity / araçlar',
      amount: 120,
      currency: 'USD',
      date: `${month}-05`,
      month,
      category: 'Yazılım',
      recurring: true,
      createdAt: now,
    },
  ]

  return { version: 2, projects, tasks, finance }
}

function migrate(raw: unknown): AppData {
  const data = raw as Partial<AppData> & { version?: number }
  if (!data?.projects || !data?.tasks) throw new Error('bad data')

  const projects = data.projects.map((p) => ({
    ...p,
    status: p.status ?? (p.kind === 'game' ? 'preprod' : 'production'),
    platforms: p.platforms ?? [],
    budgetCurrency: p.budgetCurrency ?? 'TRY',
  }))

  return {
    version: 2,
    projects,
    tasks: data.tasks,
    finance: Array.isArray(data.finance) ? data.finance : [],
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const data = createDefaultData()
      saveData(data)
      return data
    }
    return migrate(JSON.parse(raw))
  } catch {
    const data = createDefaultData()
    saveData(data)
    return data
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify({ ...data, version: 2 }))
}

export { uid }
