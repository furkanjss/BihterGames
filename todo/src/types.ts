export type ProjectKind = 'game' | 'personal'

export type ProjectStatus =
  | 'idea'
  | 'preprod'
  | 'production'
  | 'polish'
  | 'released'
  | 'on-hold'

export type GameArea =
  | 'design'
  | 'code'
  | 'art'
  | 'audio'
  | 'narrative'
  | 'playtest'
  | 'marketing'
  | 'production'
  | 'personal'

export type Priority = 'low' | 'medium' | 'high'

export type FinanceType = 'income' | 'expense' | 'payroll' | 'budget'

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP'

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
  budgetAmount?: number
  budgetCurrency?: CurrencyCode
  teamNotes?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  area: GameArea
  priority: Priority
  done: boolean
  createdAt: string
  dueDate?: string
  notes?: string
}

export interface FinanceEntry {
  id: string
  type: FinanceType
  label: string
  amount: number
  currency: CurrencyCode
  date: string
  month: string
  category?: string
  recurring?: boolean
  projectId?: string
  notes?: string
  createdAt: string
}

export interface AppData {
  version: 2
  projects: Project[]
  tasks: Task[]
  finance: FinanceEntry[]
}

export const GAME_AREAS: { id: GameArea; label: string }[] = [
  { id: 'design', label: 'Tasarım' },
  { id: 'code', label: 'Kod' },
  { id: 'art', label: 'Sanat' },
  { id: 'audio', label: 'Ses' },
  { id: 'narrative', label: 'Hikâye' },
  { id: 'playtest', label: 'Playtest' },
  { id: 'marketing', label: 'Pazarlama' },
  { id: 'production', label: 'Prodüksiyon' },
]

export const PERSONAL_AREA = { id: 'personal' as const, label: 'Kişisel' }

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Düşük' },
  { id: 'medium', label: 'Orta' },
  { id: 'high', label: 'Yüksek' },
]

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: 'idea', label: 'Fikir' },
  { id: 'preprod', label: 'Ön prodüksiyon' },
  { id: 'production', label: 'Prodüksiyon' },
  { id: 'polish', label: 'Cilalama' },
  { id: 'released', label: 'Yayında' },
  { id: 'on-hold', label: 'Beklemede' },
]

export const PLATFORMS = ['PC', 'Steam', 'Mobil', 'Konsol', 'Web', 'VR'] as const

export const ENGINES = ['Unity', 'Unreal', 'Godot', 'Özel', 'Diğer'] as const

export const CURRENCIES: CurrencyCode[] = ['TRY', 'USD', 'EUR', 'GBP']

export const FINANCE_TYPES: { id: FinanceType; label: string }[] = [
  { id: 'income', label: 'Gelir' },
  { id: 'expense', label: 'Gider' },
  { id: 'payroll', label: 'Maaş / personel' },
  { id: 'budget', label: 'Bütçe girişi' },
]

export const EXPENSE_CATEGORIES = [
  'Yazılım',
  'Donanım',
  'Ofis',
  'Pazarlama',
  'Seyahat',
  'Freelance',
  'Vergi',
  'Diğer',
]

export const PAYROLL_CATEGORIES = [
  'Maaş',
  'Freelance',
  'Prim',
  'Yan haklar',
  'Diğer',
]

export const STATUS_FILTERS: { id: 'open' | 'done' | 'all'; label: string }[] = [
  { id: 'open', label: 'Açık' },
  { id: 'done', label: 'Biten' },
  { id: 'all', label: 'Tümü' },
]
