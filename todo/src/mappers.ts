import type { Document, Idea, Profile, Project, Task } from './types'

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
    area: (row.area as Task['area']) ?? 'design',
    priority: (row.priority as Task['priority']) ?? 'medium',
    status: (row.status as Task['status']) ?? 'todo',
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    createdAt: String(row.created_at ?? ''),
    dueDate: row.due_date ? String(row.due_date) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
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
