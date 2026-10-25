import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadData, saveData, uid } from './storage'
import type {
  FinanceEntry,
  FinanceType,
  GameArea,
  Priority,
  Project,
  Task,
} from './types'

export type ProjectInput = Omit<Project, 'id' | 'createdAt'> & {
  id?: string
}

export function useStudio() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [finance, setFinance] = useState<FinanceEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const data = loadData()
    setProjects(data.projects)
    setTasks(data.tasks)
    setFinance(data.finance)
    setActiveProjectId(data.projects[0]?.id ?? '')
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveData({ version: 2, projects, tasks, finance })
  }, [projects, tasks, finance, ready])

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === activeProjectId),
    [tasks, activeProjectId],
  )

  const addProject = useCallback((input: ProjectInput) => {
    const project: Project = {
      id: uid(),
      createdAt: new Date().toISOString(),
      name: input.name.trim() || (input.kind === 'game' ? 'Adsız Oyun' : 'Kişisel'),
      kind: input.kind,
      description: input.description,
      status: input.status ?? (input.kind === 'game' ? 'idea' : 'production'),
      engine: input.engine,
      platforms: input.platforms ?? [],
      genre: input.genre,
      startDate: input.startDate,
      targetDate: input.targetDate,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency ?? 'TRY',
      teamNotes: input.teamNotes,
    }
    setProjects((prev) => [...prev, project])
    setActiveProjectId(project.id)
    return project.id
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              name: patch.name?.trim() ? patch.name.trim() : p.name,
            }
          : p,
      ),
    )
  }, [])

  const renameProject = useCallback(
    (id: string, name: string) => updateProject(id, { name }),
    [updateProject],
  )

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      setActiveProjectId((current) =>
        current === id ? (next[0]?.id ?? '') : current,
      )
      return next
    })
    setTasks((prev) => prev.filter((t) => t.projectId !== id))
    setFinance((prev) => prev.filter((f) => f.projectId !== id))
  }, [])

  const addTask = useCallback(
    (input: {
      title: string
      area: GameArea
      priority: Priority
      dueDate?: string
      notes?: string
      projectId?: string
    }) => {
      const projectId = input.projectId ?? activeProjectId
      if (!projectId || !input.title.trim()) return
      const task: Task = {
        id: uid(),
        projectId,
        title: input.title.trim(),
        area: input.area,
        priority: input.priority,
        done: false,
        createdAt: new Date().toISOString(),
        dueDate: input.dueDate || undefined,
        notes: input.notes,
      }
      setTasks((prev) => [task, ...prev])
    },
    [activeProjectId],
  )

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setTasks((prev) =>
      prev.filter((t) => !(t.projectId === activeProjectId && t.done)),
    )
  }, [activeProjectId])

  const addFinance = useCallback(
    (input: {
      type: FinanceType
      label: string
      amount: number
      currency: FinanceEntry['currency']
      date: string
      category?: string
      recurring?: boolean
      projectId?: string
      notes?: string
    }) => {
      if (!input.label.trim() || !input.amount) return
      const entry: FinanceEntry = {
        id: uid(),
        type: input.type,
        label: input.label.trim(),
        amount: Number(input.amount),
        currency: input.currency,
        date: input.date,
        month: input.date.slice(0, 7),
        category: input.category,
        recurring: input.recurring,
        projectId: input.projectId,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      }
      setFinance((prev) => [entry, ...prev])
    },
    [],
  )

  const deleteFinance = useCallback((id: string) => {
    setFinance((prev) => prev.filter((f) => f.id !== id))
  }, [])

  return {
    ready,
    projects,
    tasks,
    finance,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    projectTasks,
    addProject,
    updateProject,
    renameProject,
    deleteProject,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    clearDone,
    addFinance,
    deleteFinance,
  }
}

export type StudioApi = ReturnType<typeof useStudio>
