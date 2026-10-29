export type ProjectKind = 'game' | 'personal'

export type ProjectStatus =
  | 'idea'
  | 'preprod'
  | 'production'
  | 'polish'
  | 'released'
  | 'on-hold'
  | 'cancelled'

/** Aktif pipeline dışı (yan liste / filtre) */
export const PARKED_PROJECT_STATUSES: ProjectStatus[] = ['on-hold', 'cancelled']

export function isParkedProjectStatus(
  status: ProjectStatus | undefined,
): boolean {
  return status === 'on-hold' || status === 'cancelled'
}

export type GameArea = 'design' | 'art' | 'development' | 'management'

export type Priority = 'low' | 'medium' | 'high'

export type TaskStatus = 'todo' | 'doing' | 'done'

export type UserRole = 'admin' | 'member'

export interface Profile {
  id: string
  displayName: string
  role: UserRole
  createdAt: string
}

export interface Project {
  id: string
  name: string
  kind: ProjectKind
  createdAt: string
  description?: string
  status?: ProjectStatus
  engine?: string
  platforms?: string[]
  genre?: string
  startDate?: string
  targetDate?: string
  teamNotes?: string
  createdBy?: string | null
}

export interface Document {
  id: string
  projectId: string
  title: string
  url: string
  createdAt: string
  createdBy?: string | null
}

export interface Idea {
  id: string
  title: string
  body?: string
  createdAt: string
  createdBy?: string | null
}

export interface ImportantLink {
  id: string
  title: string
  url?: string
  body?: string
  sortOrder: number
  createdAt: string
}

export type FinanceEntryType = 'income' | 'expense' | 'payroll'

export interface FinanceEntry {
  id: string
  entryType: FinanceEntryType
  label: string
  amount: number
  currency: string
  entryDate: string
  category?: string
  notes?: string
  /** If true, amount is applied every month in the 10-month forecast */
  recurring: boolean
  createdAt: string
}

/** Only this account sees Ideas + Yönetim */
export const IDEAS_OWNER_EMAIL = 'info@bihtergames.com'
export const OWNER_EMAIL = IDEAS_OWNER_EMAIL

export const FINANCE_TYPES: { id: FinanceEntryType; label: string }[] = [
  { id: 'income', label: 'Gelir' },
  { id: 'expense', label: 'Gider' },
  { id: 'payroll', label: 'Maaş / ödeme' },
]

export const FINANCE_CATEGORIES = [
  'Yazılım',
  'Donanım',
  'Ofis',
  'Pazarlama',
  'Freelance',
  'Maaş',
  'Vergi',
  'Diğer',
] as const

export interface Task {
  id: string
  projectId: string
  title: string
  area: GameArea
  priority: Priority
  status: TaskStatus
  assigneeId?: string | null
  createdAt: string
  dueDate?: string
  notes?: string
  sortOrder: number
  createdBy?: string | null
}

export const GAME_AREAS: { id: GameArea; label: string }[] = [
  { id: 'design', label: 'Design' },
  { id: 'art', label: 'Art' },
  { id: 'development', label: 'Development' },
  { id: 'management', label: 'Management' },
]

/** Map legacy area strings from older tasks into the 4 current options */
export function normalizeGameArea(raw: unknown): GameArea {
  const v = String(raw ?? 'design')
  if (v === 'art' || v === 'audio') return 'art'
  if (v === 'development' || v === 'code' || v === 'production') return 'development'
  if (v === 'management' || v === 'marketing' || v === 'personal') return 'management'
  return 'design'
}

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Düşük' },
  { id: 'medium', label: 'Orta' },
  { id: 'high', label: 'Yüksek' },
]

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Not started' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: 'idea', label: 'Fikir' },
  { id: 'preprod', label: 'Ön prodüksiyon' },
  { id: 'production', label: 'Prodüksiyon' },
  { id: 'polish', label: 'Cilalama' },
  { id: 'released', label: 'Yayında' },
  { id: 'on-hold', label: 'Beklemede' },
  { id: 'cancelled', label: 'İptal' },
]

export const PLATFORMS = ['PC', 'Steam', 'Mobil', 'Konsol', 'Web', 'VR'] as const

export const ENGINES = ['Unity', 'Unreal', 'Godot', 'Özel', 'Diğer'] as const
