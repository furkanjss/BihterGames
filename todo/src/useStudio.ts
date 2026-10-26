import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  mapDocument,
  mapFinanceEntry,
  mapIdea,
  mapImportantLink,
  mapProfile,
  mapProject,
  mapTask,
} from './mappers'
import { supabase } from './supabase'
import type {
  Document,
  FinanceEntry,
  FinanceEntryType,
  GameArea,
  Idea,
  ImportantLink,
  Priority,
  Profile,
  Project,
  ProjectKind,
  ProjectStatus,
  Task,
  TaskStatus,
} from './types'

export type ProjectInput = {
  name: string
  kind: ProjectKind
  description?: string
  status?: ProjectStatus
  engine?: string
  platforms?: string[]
  genre?: string
  startDate?: string
  targetDate?: string
  teamNotes?: string
}

export type TaskInput = {
  title: string
  area: GameArea
  priority: Priority
  status?: TaskStatus
  assigneeId?: string | null
  dueDate?: string
  notes?: string
  projectId?: string
}

export function useStudio(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [links, setLinks] = useState<ImportantLink[]>([])
  const [finance, setFinance] = useState<FinanceEntry[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase || !userId) return
    setError(null)
    const [pRes, tRes, dRes, prRes, iRes, lRes, fRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('display_name', { ascending: true }),
      supabase.from('ideas').select('*').order('created_at', { ascending: false }),
      supabase
        .from('important_links')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('finance_entries')
        .select('*')
        .order('entry_date', { ascending: false }),
    ])

    if (pRes.error || tRes.error || dRes.error || prRes.error) {
      setError(
        pRes.error?.message ||
          tRes.error?.message ||
          dRes.error?.message ||
          prRes.error?.message ||
          'Veri yüklenemedi',
      )
      setReady(true)
      return
    }

    const nextProjects = (pRes.data ?? []).map((r) =>
      mapProject(r as Record<string, unknown>),
    )
    setProjects(nextProjects)
    setTasks((tRes.data ?? []).map((r) => mapTask(r as Record<string, unknown>)))
    setDocuments(
      (dRes.data ?? []).map((r) => mapDocument(r as Record<string, unknown>)),
    )
    setProfiles(
      (prRes.data ?? []).map((r) => mapProfile(r as Record<string, unknown>)),
    )
    setIdeas(
      iRes.error
        ? []
        : (iRes.data ?? []).map((r) => mapIdea(r as Record<string, unknown>)),
    )
    setLinks(
      lRes.error
        ? []
        : (lRes.data ?? []).map((r) =>
            mapImportantLink(r as Record<string, unknown>),
          ),
    )
    setFinance(
      fRes.error
        ? []
        : (fRes.data ?? []).map((r) =>
            mapFinanceEntry(r as Record<string, unknown>),
          ),
    )
    setActiveProjectId((prev) => prev || nextProjects[0]?.id || '')
    setReady(true)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setProjects([])
      setTasks([])
      setDocuments([])
      setIdeas([])
      setLinks([])
      setFinance([])
      setProfiles([])
      setReady(false)
      return
    }
    void refresh()
  }, [userId, refresh])

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === activeProjectId),
    [tasks, activeProjectId],
  )

  const projectDocuments = useMemo(
    () => documents.filter((d) => d.projectId === activeProjectId),
    [documents, activeProjectId],
  )

  const addProject = useCallback(
    async (input: ProjectInput): Promise<Project | null> => {
      if (!supabase || !userId) return null
      const { data, error: err } = await supabase
        .from('projects')
        .insert({
          name: input.name.trim() || 'Adsız proje',
          kind: input.kind,
          description: input.description || null,
          status: input.status ?? (input.kind === 'game' ? 'idea' : 'production'),
          engine: input.engine || null,
          platforms: input.platforms ?? [],
          genre: input.genre || null,
          start_date: input.startDate || null,
          target_date: input.targetDate || null,
          team_notes: input.teamNotes || null,
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return null
      }
      const project = mapProject(data as Record<string, unknown>)
      setProjects((prev) => [...prev, project])
      setActiveProjectId(project.id)
      return project
    },
    [userId],
  )

  const updateProject = useCallback(
    async (id: string, input: Partial<ProjectInput>) => {
      if (!supabase) return
      const patch: Record<string, unknown> = {}
      if (input.name !== undefined) patch.name = input.name.trim()
      if (input.kind !== undefined) patch.kind = input.kind
      if (input.description !== undefined)
        patch.description = input.description || null
      if (input.status !== undefined) patch.status = input.status
      if (input.engine !== undefined) patch.engine = input.engine || null
      if (input.platforms !== undefined) patch.platforms = input.platforms
      if (input.genre !== undefined) patch.genre = input.genre || null
      if (input.startDate !== undefined) patch.start_date = input.startDate || null
      if (input.targetDate !== undefined)
        patch.target_date = input.targetDate || null
      if (input.teamNotes !== undefined)
        patch.team_notes = input.teamNotes || null

      const { data, error: err } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      const mapped = mapProject(data as Record<string, unknown>)
      setProjects((prev) => prev.map((p) => (p.id === id ? mapped : p)))
    },
    [],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      if (!supabase) return
      const { error: err } = await supabase.from('projects').delete().eq('id', id)
      if (err) {
        setError(err.message)
        return
      }
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setTasks((prev) => prev.filter((t) => t.projectId !== id))
      setDocuments((prev) => prev.filter((d) => d.projectId !== id))
      setActiveProjectId((prev) => (prev === id ? '' : prev))
    },
    [],
  )

  const addTask = useCallback(
    async (input: TaskInput) => {
      if (!supabase || !userId) return
      const projectId = input.projectId || activeProjectId
      if (!projectId || !input.title.trim()) return
      const status = input.status ?? 'todo'
      const minOrder = tasks
        .filter((t) => t.status === status)
        .reduce((m, t) => Math.min(m, t.sortOrder), 0)
      const { data, error: err } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: input.title.trim(),
          area: input.area,
          priority: input.priority,
          status,
          assignee_id: input.assigneeId ?? null,
          due_date: input.dueDate || null,
          notes: input.notes || null,
          sort_order: minOrder - 1,
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      const task = mapTask(data as Record<string, unknown>)
      setTasks((prev) => [task, ...prev])
    },
    [userId, activeProjectId, tasks],
  )

  const addTasksBulk = useCallback(
    async (
      projectId: string,
      lines: { title: string; area?: GameArea; priority?: Priority }[],
    ): Promise<{ count: number; error?: string }> => {
      if (!supabase || !userId) {
        return { count: 0, error: 'Oturum veya Supabase yok.' }
      }
      if (!projectId) {
        return { count: 0, error: 'Proje seçilmedi.' }
      }
      const rows = lines
        .map((l) => ({
          project_id: projectId,
          title: l.title.trim(),
          area: l.area ?? 'design',
          priority: l.priority ?? 'medium',
          status: 'todo' as const,
          created_by: userId,
        }))
        .filter((r) => r.title)
      if (rows.length === 0) {
        return { count: 0, error: 'Eklenecek satır yok.' }
      }

      // Don't chain .select() — RLS can return empty data even after a good insert
      const { error: err } = await supabase.from('tasks').insert(rows)
      if (err) {
        setError(err.message)
        return { count: 0, error: err.message }
      }

      const { data, error: loadErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (!loadErr && data) {
        setTasks((prev) => {
          const others = prev.filter((t) => t.projectId !== projectId)
          const mapped = data.map((r) => mapTask(r as Record<string, unknown>))
          return [...mapped, ...others]
        })
      } else {
        await refresh()
      }
      return { count: rows.length }
    },
    [userId, refresh],
  )

  const updateTask = useCallback(
    async (
      id: string,
      patch: Partial<{
        title: string
        area: GameArea
        priority: Priority
        status: TaskStatus
        assigneeId: string | null
        dueDate: string | null
        notes: string | null
        projectId: string
        sortOrder: number
      }>,
    ) => {
      if (!supabase) return
      const row: Record<string, unknown> = {}
      if (patch.title !== undefined) row.title = patch.title
      if (patch.area !== undefined) row.area = patch.area
      if (patch.priority !== undefined) row.priority = patch.priority
      if (patch.status !== undefined) row.status = patch.status
      if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId
      if (patch.dueDate !== undefined) row.due_date = patch.dueDate
      if (patch.notes !== undefined) row.notes = patch.notes
      if (patch.projectId !== undefined) row.project_id = patch.projectId
      if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder

      const { data, error: err } = await supabase
        .from('tasks')
        .update(row)
        .eq('id', id)
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      const mapped = mapTask(data as Record<string, unknown>)
      setTasks((prev) => prev.map((t) => (t.id === id ? mapped : t)))
    },
    [],
  )

  /**
   * Move task into toStatus at toIndex within the visible column order.
   * visibleIds = board column task ids in current display order (may include id).
   */
  const moveTask = useCallback(
    async (
      id: string,
      toStatus: TaskStatus,
      toIndex: number,
      visibleIds: string[],
    ) => {
      const client = supabase
      if (!client) return
      const moving = tasks.find((t) => t.id === id)
      if (!moving) return

      const without = visibleIds.filter((vid) => vid !== id)
      const clamped = Math.max(0, Math.min(toIndex, without.length))
      const visibleOrder = [...without]
      visibleOrder.splice(clamped, 0, id)

      const visibleSet = new Set(visibleOrder)
      const hiddenInTarget = tasks
        .filter(
          (t) =>
            t.status === toStatus && t.id !== id && !visibleSet.has(t.id),
        )
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t) => t.id)

      const targetOrder = [...visibleOrder, ...hiddenInTarget]

      const updates: { id: string; status: TaskStatus; sortOrder: number }[] =
        targetOrder.map((tid, i) => ({
          id: tid,
          status: toStatus,
          sortOrder: i,
        }))

      if (moving.status !== toStatus) {
        const oldRemaining = tasks
          .filter((t) => t.status === moving.status && t.id !== id)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
        oldRemaining.forEach((t, i) => {
          updates.push({
            id: t.id,
            status: moving.status,
            sortOrder: i,
          })
        })
      }

      const byId = new Map(updates.map((u) => [u.id, u]))
      setTasks((prev) =>
        prev.map((t) => {
          const u = byId.get(t.id)
          return u ? { ...t, status: u.status, sortOrder: u.sortOrder } : t
        }),
      )

      const results = await Promise.all(
        updates.map(async (u) => {
          const { error: err } = await client
            .from('tasks')
            .update({ status: u.status, sort_order: u.sortOrder })
            .eq('id', u.id)
          return err
        }),
      )
      const failed = results.find((err) => err != null)
      if (failed) {
        setError(failed.message || 'Sıra kaydedilemedi')
        await refresh()
      }
    },
    [tasks, refresh],
  )

  const deleteTask = useCallback(async (id: string) => {
    if (!supabase) return
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addDocument = useCallback(
    async (projectId: string, title: string, url: string) => {
      if (!supabase || !userId || !title.trim() || !url.trim()) return
      const { data, error: err } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          title: title.trim(),
          url: url.trim(),
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      const doc = mapDocument(data as Record<string, unknown>)
      setDocuments((prev) => [doc, ...prev])
    },
    [userId],
  )

  const deleteDocument = useCallback(async (id: string) => {
    if (!supabase) return
    const { error: err } = await supabase.from('documents').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const addIdea = useCallback(
    async (title: string, body?: string) => {
      if (!supabase || !userId || !title.trim()) return
      const { data, error: err } = await supabase
        .from('ideas')
        .insert({
          title: title.trim(),
          body: body?.trim() || null,
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      setIdeas((prev) => [mapIdea(data as Record<string, unknown>), ...prev])
    },
    [userId],
  )

  const deleteIdea = useCallback(async (id: string) => {
    if (!supabase) return
    const { error: err } = await supabase.from('ideas').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const addLink = useCallback(
    async (title: string, url?: string, body?: string) => {
      if (!supabase || !userId || !title.trim()) return
      const { data, error: err } = await supabase
        .from('important_links')
        .insert({
          title: title.trim(),
          url: url?.trim() || null,
          body: body?.trim() || null,
          sort_order: links.length,
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      setLinks((prev) => [
        ...prev,
        mapImportantLink(data as Record<string, unknown>),
      ])
    },
    [userId, links.length],
  )

  const deleteLink = useCallback(async (id: string) => {
    if (!supabase) return
    const { error: err } = await supabase
      .from('important_links')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const addFinance = useCallback(
    async (input: {
      entryType: FinanceEntryType
      label: string
      amount: number
      entryDate: string
      category?: string
      notes?: string
      currency?: string
      recurring?: boolean
    }) => {
      if (!supabase || !userId || !input.label.trim() || input.amount < 0) return
      const { data, error: err } = await supabase
        .from('finance_entries')
        .insert({
          entry_type: input.entryType,
          label: input.label.trim(),
          amount: input.amount,
          currency: input.currency ?? 'TRY',
          entry_date: input.entryDate,
          category: input.category || null,
          notes: input.notes || null,
          recurring: Boolean(input.recurring),
          created_by: userId,
        })
        .select('*')
        .single()
      if (err) {
        setError(err.message)
        return
      }
      setFinance((prev) => [
        mapFinanceEntry(data as Record<string, unknown>),
        ...prev,
      ])
    },
    [userId],
  )

  const deleteFinance = useCallback(async (id: string) => {
    if (!supabase) return
    const { error: err } = await supabase
      .from('finance_entries')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setFinance((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const profileName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return 'Atanmamış'
      return profiles.find((p) => p.id === id)?.displayName || 'Üye'
    },
    [profiles],
  )

  return {
    ready,
    error,
    projects,
    tasks,
    documents,
    ideas,
    links,
    finance,
    profiles,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    projectTasks,
    projectDocuments,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    addTasksBulk,
    updateTask,
    moveTask,
    deleteTask,
    addDocument,
    deleteDocument,
    addIdea,
    deleteIdea,
    addLink,
    deleteLink,
    addFinance,
    deleteFinance,
    profileName,
    refresh,
  }
}
