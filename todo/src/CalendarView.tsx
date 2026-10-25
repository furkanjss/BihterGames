import { useMemo, useState } from 'react'
import type { Project, Task } from './types'
import { GAME_AREAS, PERSONAL_AREA } from './types'

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

type RangeMode = 'week' | '2weeks'

export function CalendarView({
  tasks,
  projects,
  onToggle,
}: {
  tasks: Task[]
  projects: Project[]
  onToggle: (id: string) => void
}) {
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()))
  const [mode, setMode] = useState<RangeMode>('2weeks')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const dayCount = mode === 'week' ? 7 : 14

  const days = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => addDays(anchor, i))
  }, [anchor, dayCount])

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) =>
      projectFilter === 'all' ? true : t.projectId === projectFilter,
    )
  }, [tasks, projectFilter])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const day of days) map.set(toISODate(day), [])
    for (const task of visibleTasks) {
      if (!task.dueDate) continue
      const list = map.get(task.dueDate)
      if (list) list.push(task)
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        const rank = { high: 0, medium: 1, low: 2 }
        return rank[a.priority] - rank[b.priority]
      })
    }
    return map
  }, [days, visibleTasks])

  const undated = visibleTasks.filter((t) => !t.dueDate && !t.done)

  const today = toISODate(new Date())
  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? 'Proje'

  const areaLabel = (area: Task['area']) =>
    [...GAME_AREAS, PERSONAL_AREA].find((a) => a.id === area)?.label ?? area

  return (
    <div className="cal">
      <div className="cal__toolbar">
        <div className="cal__nav">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setAnchor(addDays(anchor, -dayCount))}
          >
            ← Önceki
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setAnchor(startOfWeek(new Date()))}
          >
            Bu hafta
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setAnchor(addDays(anchor, dayCount))}
          >
            Sonraki →
          </button>
        </div>

        <div className="filters__group">
          <button
            type="button"
            className={`pill ${mode === 'week' ? 'is-active' : ''}`}
            onClick={() => setMode('week')}
          >
            1 hafta
          </button>
          <button
            type="button"
            className={`pill ${mode === '2weeks' ? 'is-active' : ''}`}
            onClick={() => setMode('2weeks')}
          >
            2 hafta
          </button>
        </div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="Projeye göre filtrele"
        >
          <option value="all">Tüm projeler</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`cal__grid cal__grid--${mode}`}>
        {days.map((day) => {
          const key = toISODate(day)
          const list = byDay.get(key) ?? []
          const isToday = key === today
          return (
            <section
              key={key}
              className={`cal__day ${isToday ? 'is-today' : ''}`}
            >
              <header>
                <strong>
                  {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </strong>
                <span>
                  {day.toLocaleDateString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </header>
              <ul>
                {list.length === 0 && <li className="cal__empty">—</li>}
                {list.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className={`cal__task ${task.done ? 'is-done' : ''} prio-border--${task.priority}`}
                      onClick={() => onToggle(task.id)}
                      title={`${projectName(task.projectId)} · ${areaLabel(task.area)}`}
                    >
                      <span className="cal__task-title">{task.title}</span>
                      <span className="cal__task-meta">
                        {projectName(task.projectId)} · {areaLabel(task.area)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {undated.length > 0 && (
        <section className="cal__undated">
          <h3>Tarihsiz</h3>
          <ul>
            {undated.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className="cal__task"
                  onClick={() => onToggle(task.id)}
                >
                  <span className="cal__task-title">{task.title}</span>
                  <span className="cal__task-meta">
                    {projectName(task.projectId)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
