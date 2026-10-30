import {
  normalizeGameArea,
  type Document,
  type FinanceEntry,
  type Idea,
  type ImportantLink,
  type Profile,
  type Project,
  type Task,
  type WorkLog,
} from './types'

export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ''),
    role: (row.role as Profile['role']) ?? 'member',
    createdAt: String(row.created_at ?? ''),
  }
}

export function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    kind: (row.kind as Project['kind']) ?? 'game',
    createdAt: String(row.created_at ?? ''),
    description: row.description ? String(row.description) : undefined,
    status: (row.status as Project['status']) ?? undefined,
    engine: row.engine ? String(row.engine) : undefined,
    platforms: Array.isArray(row.platforms)
      ? (row.platforms as string[])
      : [],
    genre: row.genre ? String(row.genre) : undefined,
    startDate: row.start_date ? String(row.start_date) : undefined,
    targetDate: row.target_date ? String(row.target_date) : undefined,
    teamNotes: row.team_notes ? String(row.team_notes) : undefined,
    createdBy: row.created_by ? String(row.created_by) : null,
  }
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    area: normalizeGameArea(row.area),
    priority: (row.priority as Task['priority']) ?? 'medium',
    status: (row.status as Task['status']) ?? 'todo',
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    createdAt: String(row.created_at ?? ''),
    dueDate: row.due_date ? String(row.due_date) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    createdBy: row.created_by ? String(row.created_by) : null,
  }
}

export function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    url: String(row.url),
    createdAt: String(row.created_at ?? ''),
    createdBy: row.created_by ? String(row.created_by) : null,
  }
}

export function mapIdea(row: Record<string, unknown>): Idea {
  return {
    id: String(row.id),
    title: String(row.title),
    body: row.body ? String(row.body) : undefined,
    createdAt: String(row.created_at ?? ''),
    createdBy: row.created_by ? String(row.created_by) : null,
  }
}

export function mapImportantLink(row: Record<string, unknown>): ImportantLink {
  return {
    id: String(row.id),
    title: String(row.title),
    url: row.url ? String(row.url) : undefined,
    body: row.body ? String(row.body) : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ''),
  }
}

export function mapFinanceEntry(row: Record<string, unknown>): FinanceEntry {
  return {
    id: String(row.id),
    entryType: (row.entry_type as FinanceEntry['entryType']) ?? 'expense',
    label: String(row.label),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? 'TRY'),
    entryDate: String(row.entry_date ?? ''),
    category: row.category ? String(row.category) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    recurring: Boolean(row.recurring),
    createdAt: String(row.created_at ?? ''),
  }
}

export function mapWorkLog(row: Record<string, unknown>): WorkLog {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workDate: String(row.work_date ?? ''),
    hours: Number(row.hours ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? ''),
  }
}
