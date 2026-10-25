import { useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { CalendarView } from './CalendarView'
import { FinanceView } from './FinanceView'
import { NotionView } from './NotionView'
import { ProjectModal, type ProjectFormValue } from './ProjectModal'
import {
  GAME_AREAS,
  PERSONAL_AREA,
  PRIORITIES,
  PROJECT_STATUSES,
  STATUS_FILTERS,
  type GameArea,
  type Priority,
  type ProjectKind,
} from './types'
import { useStudio } from './useStudio'

type StatusFilter = 'open' | 'done' | 'all'
type View = 'tasks' | 'calendar' | 'finance' | 'notion'

function App() {
  const studio = useStudio()
  const [view, setView] = useState<View>('tasks')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [areaFilter, setAreaFilter] = useState<GameArea | 'all'>('all')
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<GameArea>('design')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalKind, setModalKind] = useState<ProjectKind>('game')

  const isPersonal = studio.activeProject?.kind === 'personal'
  const areas = isPersonal ? [PERSONAL_AREA] : GAME_AREAS

  const filtered = useMemo(() => {
    return studio.projectTasks
      .filter((t) => {
        if (status === 'open' && t.done) return false
        if (status === 'done' && !t.done) return false
        if (areaFilter !== 'all' && t.area !== areaFilter) return false
        if (query.trim()) {
          return t.title.toLowerCase().includes(query.trim().toLowerCase())
        }
        return true
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        const rank = { high: 0, medium: 1, low: 2 }
        return rank[a.priority] - rank[b.priority]
      })
  }, [studio.projectTasks, status, areaFilter, query])

  const stats = useMemo(() => {
    const total = studio.projectTasks.length
    const done = studio.projectTasks.filter((t) => t.done).length
    const open = total - done
    const pct = total ? Math.round((done / total) * 100) : 0
    return { total, done, open, pct }
  }, [studio.projectTasks])

  const gameProjects = studio.projects.filter((p) => p.kind === 'game')
  const personalProjects = studio.projects.filter((p) => p.kind === 'personal')

  function submitTask(e: FormEvent) {
    e.preventDefault()
    studio.addTask({
      title,
      area: isPersonal ? 'personal' : area,
      priority,
      dueDate: dueDate || undefined,
    })
    setTitle('')
    setDueDate('')
  }

  function openCreate(kind: ProjectKind) {
    setModalKind(kind)
    setModalMode('create')
    setModalOpen(true)
  }

  function openEdit() {
    setModalMode('edit')
    setModalOpen(true)
  }

  function handleProjectSubmit(form: ProjectFormValue) {
    const payload = {
      name: form.name,
      kind: form.kind,
      description: form.description || undefined,
      status: form.status,
      engine: form.engine || undefined,
      platforms: form.platforms,
      genre: form.genre || undefined,
      startDate: form.startDate || undefined,
      targetDate: form.targetDate || undefined,
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
      budgetCurrency: form.budgetCurrency,
      teamNotes: form.teamNotes || undefined,
    }

    if (modalMode === 'edit' && studio.activeProject) {
      studio.updateProject(studio.activeProject.id, payload)
    } else {
      studio.addProject(payload)
      setArea(form.kind === 'personal' ? 'personal' : 'design')
      setAreaFilter('all')
      setView('tasks')
    }
    setModalOpen(false)
  }

  if (!studio.ready) {
    return <div className="boot">Stüdyo yükleniyor…</div>
  }

  const statusLabel =
    PROJECT_STATUSES.find((s) => s.id === studio.activeProject?.status)?.label ??
    ''

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img
            src="/logos/logo-lime.png"
            alt="Bihter Games"
            width={56}
            height={60}
          />
          <div>
            <p className="brand__name">Bihter Games</p>
            <p className="brand__sub">Stüdyo</p>
          </div>
        </div>

        <nav className="view-nav view-nav--4">
          {(
            [
              ['tasks', 'Görevler'],
              ['calendar', 'Takvim'],
              ['finance', 'Muhasebe'],
              ['notion', 'Notion'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`view-nav__btn ${view === id ? 'is-active' : ''}`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar__block">
          <div className="sidebar__head">
            <span>Oyun projeleri</span>
            <button
              type="button"
              className="chip"
              onClick={() => openCreate('game')}
              title="Yeni oyun projesi"
            >
              +
            </button>
          </div>
          <ul className="project-list">
            {gameProjects.map((p) => {
              const open = studio.tasks.filter(
                (t) => t.projectId === p.id && !t.done,
              ).length
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project ${studio.activeProjectId === p.id ? 'is-active' : ''}`}
                    onClick={() => {
                      studio.setActiveProjectId(p.id)
                      setAreaFilter('all')
                      setArea('design')
                      setView('tasks')
                    }}
                  >
                    <span className="project__dot project__dot--game" />
                    <span className="project__name">{p.name}</span>
                    <span className="project__count">{open}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="sidebar__block">
          <div className="sidebar__head">
            <span>Kişisel</span>
            <button
              type="button"
              className="chip"
              onClick={() => openCreate('personal')}
              title="Yeni kişisel liste"
            >
              +
            </button>
          </div>
          <ul className="project-list">
            {personalProjects.map((p) => {
              const open = studio.tasks.filter(
                (t) => t.projectId === p.id && !t.done,
              ).length
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project ${studio.activeProjectId === p.id ? 'is-active' : ''}`}
                    onClick={() => {
                      studio.setActiveProjectId(p.id)
                      setAreaFilter('all')
                      setArea('personal')
                      setView('tasks')
                    }}
                  >
                    <span className="project__dot project__dot--personal" />
                    <span className="project__name">{p.name}</span>
                    <span className="project__count">{open}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <button
          type="button"
          className="btn btn--lime"
          onClick={() => openCreate('game')}
        >
          Yeni proje
        </button>

        <p className="sidebar__hint">Veriler bu tarayıcıda saklanır.</p>
      </aside>

      <main className="main">
        {view === 'calendar' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <h1>Takvim</h1>
              </div>
            </header>
            <CalendarView
              tasks={studio.tasks}
              projects={studio.projects}
              onToggle={studio.toggleTask}
            />
          </>
        )}

        {view === 'finance' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <h1>Muhasebe</h1>
              </div>
            </header>
            <FinanceView
              finance={studio.finance}
              projects={studio.projects}
              onAdd={studio.addFinance}
              onDelete={studio.deleteFinance}
            />
          </>
        )}

        {view === 'notion' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <h1>Notion</h1>
              </div>
            </header>
            <NotionView
              projects={studio.projects}
              tasks={studio.tasks}
              finance={studio.finance}
            />
          </>
        )}

        {view === 'tasks' &&
          (!studio.activeProject ? (
            <div className="empty">Başlamak için bir proje oluştur.</div>
          ) : (
            <>
              <header className="topbar">
                <div className="topbar__title">
                  <h1>{studio.activeProject.name}</h1>
                  <span
                    className={`badge ${isPersonal ? 'badge--personal' : 'badge--game'}`}
                  >
                    {isPersonal ? 'Kişisel' : 'Oyun'}
                  </span>
                  {statusLabel && <span className="badge">{statusLabel}</span>}
                </div>

                <div className="topbar__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={openEdit}
                  >
                    Detayları düzenle
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      if (
                        confirm(
                          `“${studio.activeProject?.name}” ve tüm görevleri silinsin mi?`,
                        )
                      ) {
                        studio.deleteProject(studio.activeProject!.id)
                      }
                    }}
                  >
                    Sil
                  </button>
                </div>
              </header>

              {(studio.activeProject.description ||
                studio.activeProject.engine ||
                studio.activeProject.platforms?.length ||
                studio.activeProject.targetDate) && (
                <section className="project-meta">
                  {studio.activeProject.description && (
                    <p>{studio.activeProject.description}</p>
                  )}
                  <div className="project-meta__tags">
                    {studio.activeProject.engine && (
                      <span className="tag">{studio.activeProject.engine}</span>
                    )}
                    {studio.activeProject.genre && (
                      <span className="tag">{studio.activeProject.genre}</span>
                    )}
                    {studio.activeProject.platforms?.map((p) => (
                      <span key={p} className="tag">
                        {p}
                      </span>
                    ))}
                    {studio.activeProject.startDate && (
                      <span className="tag">
                        başlangıç {studio.activeProject.startDate}
                      </span>
                    )}
                    {studio.activeProject.targetDate && (
                      <span className="tag">
                        hedef {studio.activeProject.targetDate}
                      </span>
                    )}
                    {studio.activeProject.budgetAmount != null && (
                      <span className="tag">
                        bütçe {studio.activeProject.budgetAmount}{' '}
                        {studio.activeProject.budgetCurrency}
                      </span>
                    )}
                  </div>
                </section>
              )}

              <section className="progress">
                <div className="progress__meta">
                  <span>
                    {stats.done}/{stats.total} bitti
                  </span>
                  <span>{stats.open} açık</span>
                  <span>{stats.pct}%</span>
                </div>
                <div className="progress__bar" aria-hidden="true">
                  <div style={{ width: `${stats.pct}%` }} />
                </div>
              </section>

              <form className="composer" onSubmit={submitTask}>
                <input
                  className="composer__title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isPersonal
                      ? 'Kişisel görev ekle…'
                      : 'Oyun görevi ekle — tasarım, kod, sanat…'
                  }
                  aria-label="Görev başlığı"
                />
                <div className="composer__row">
                  {!isPersonal && (
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value as GameArea)}
                      aria-label="Alan"
                    >
                      {GAME_AREAS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    aria-label="Öncelik"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    aria-label="Son tarih"
                  />
                  <button type="submit" className="btn btn--lime">
                    Ekle
                  </button>
                </div>
              </form>

              <div className="filters">
                <div className="filters__group">
                  {STATUS_FILTERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`pill ${status === s.id ? 'is-active' : ''}`}
                      onClick={() => setStatus(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="filters__group filters__scroll">
                  <button
                    type="button"
                    className={`pill ${areaFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setAreaFilter('all')}
                  >
                    Tüm alanlar
                  </button>
                  {areas.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`pill ${areaFilter === a.id ? 'is-active' : ''}`}
                      onClick={() => setAreaFilter(a.id)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <input
                  className="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara…"
                  aria-label="Görev ara"
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={studio.clearDone}
                >
                  Bitenleri temizle
                </button>
              </div>

              <ul className="tasks">
                {filtered.length === 0 && (
                  <li className="tasks__empty">Henüz görev yok.</li>
                )}
                {filtered.map((task) => {
                  const areaLabel =
                    [...GAME_AREAS, PERSONAL_AREA].find((a) => a.id === task.area)
                      ?.label ?? task.area
                  const priorityLabel =
                    PRIORITIES.find((p) => p.id === task.priority)?.label ??
                    task.priority
                  return (
                    <li
                      key={task.id}
                      className={`task ${task.done ? 'is-done' : ''}`}
                    >
                      <button
                        type="button"
                        className="task__check"
                        aria-label={task.done ? 'Açık işaretle' : 'Bitti işaretle'}
                        onClick={() => studio.toggleTask(task.id)}
                      >
                        <span />
                      </button>
                      <div className="task__body">
                        <p className="task__title">{task.title}</p>
                        <div className="task__meta">
                          <span className="tag">{areaLabel}</span>
                          <span className={`prio prio--${task.priority}`}>
                            {priorityLabel}
                          </span>
                          {task.dueDate && (
                            <span className="due">
                              son{' '}
                              {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="task__delete"
                        aria-label="Görevi sil"
                        onClick={() => studio.deleteTask(task.id)}
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ))}
      </main>

      <ProjectModal
        open={modalOpen}
        mode={modalMode}
        initial={modalMode === 'edit' ? studio.activeProject : null}
        defaultKind={modalKind}
        onClose={() => setModalOpen(false)}
        onSubmit={handleProjectSubmit}
      />
    </div>
  )
}

export default App
