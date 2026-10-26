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
  createdBy?: string | null
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
]

export const PLATFORMS = ['PC', 'Steam', 'Mobil', 'Konsol', 'Web', 'VR'] as const

export const ENGINES = ['Unity', 'Unreal', 'Godot', 'Özel', 'Diğer'] as const
