import { useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { LoginView } from './LoginView'
import { ProjectModal, type ProjectFormValue } from './ProjectModal'
import {
  GAME_AREAS,
  PERSONAL_AREA,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  type GameArea,
  type Priority,
  type ProjectKind,
  type TaskStatus,
} from './types'
import { useAuth } from './useAuth'
import { useStudio } from './useStudio'

type View = 'dashboard' | 'tasks' | 'projects' | 'docs'

function App() {
  const auth = useAuth()
  const studio = useStudio(auth.user?.id)
  const [view, setView] = useState<View>('dashboard')
  const [mineOnly, setMineOnly] = useState(false)
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all')
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<GameArea>('design')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalKind, setModalKind] = useState<ProjectKind>('game')

  const myTasks = useMemo(() => {
    if (!auth.user) return []
    return studio.tasks.filter(
      (t) => t.assigneeId === auth.user!.id && t.status !== 'done',
    )
  }, [studio.tasks, auth.user])

  const boardTasks = useMemo(() => {
    return studio.tasks.filter((t) => {
      if (mineOnly && auth.user && t.assigneeId !== auth.user.id) return false
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false
      return true
    })
  }, [studio.tasks, mineOnly, projectFilter, auth.user])

  const columns = useMemo(() => {
    return TASK_STATUSES.map((col) => ({
      ...col,
      tasks: boardTasks.filter((t) => t.status === col.id),
    }))
  }, [boardTasks])

  if (auth.loading) {
    return <div className="boot">Stüdyo yükleniyor…</div>
  }

  if (!auth.session) {
    return (
      <LoginView
        configured={auth.configured}
        error={auth.error}
        onSubmit={auth.signIn}
      />
    )
  }

  if (!studio.ready) {
    return <div className="boot">Veriler yükleniyor…</div>
  }

  function openCreate(kind: ProjectKind) {
    setModalKind(kind)
    setModalMode('create')
    setModalOpen(true)
  }

  async function handleProjectSubmit(form: ProjectFormValue) {
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
      teamNotes: form.teamNotes || undefined,
    }
    if (modalMode === 'edit' && studio.activeProject) {
      await studio.updateProject(studio.activeProject.id, payload)
    } else {
      await studio.addProject(payload)
      setView('projects')
    }
    setModalOpen(false)
  }

  async function submitTask(e: FormEvent) {
    e.preventDefault()
    const projectId =
      projectFilter === 'all' ? studio.activeProjectId : projectFilter
    if (!projectId) return
    await studio.addTask({
      title,
      area,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || undefined,
      projectId,
    })
    setTitle('')
    setDueDate('')
  }

  async function submitDoc(e: FormEvent) {
    e.preventDefault()
    const projectId = studio.activeProjectId
    if (!projectId) return
    await studio.addDocument(projectId, docTitle, docUrl)
    setDocTitle('')
    setDocUrl('')
  }

  const gameProjects = studio.projects.filter((p) => p.kind === 'game')
  const otherProjects = studio.projects.filter((p) => p.kind !== 'game')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img
            src={`${import.meta.env.BASE_URL}logos/logo-lime.png`}
            alt="Bihter Games"
            width={52}
            height={56}
          />
          <div>
            <p className="brand__name">Bihter Games</p>
            <p className="brand__sub">Studio Hub</p>
          </div>
        </div>

        <nav className="view-nav">
          {(
            [
              ['dashboard', 'Dashboard'],
              ['tasks', 'Görevler'],
              ['projects', 'Projeler'],
              ['docs', 'Dökümanlar'],
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
            <span>Oyunlar</span>
            <button
              type="button"
              className="chip"
              onClick={() => openCreate('game')}
              title="Yeni proje"
            >
              +
            </button>
          </div>
          <ul className="project-list">
            {gameProjects.map((p) => {
              const open = studio.tasks.filter(
                (t) => t.projectId === p.id && t.status !== 'done',
              ).length
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project ${studio.activeProjectId === p.id ? 'is-active' : ''}`}
                    onClick={() => {
                      studio.setActiveProjectId(p.id)
                      setProjectFilter(p.id)
                      setView('tasks')
                    }}
                  >
                    <span className="project__dot" />
                    <span className="project__name">{p.name}</span>
                    <span className="project__count">{open}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {otherProjects.length > 0 && (
          <div className="sidebar__block">
            <div className="sidebar__head">
              <span>Diğer</span>
            </div>
            <ul className="project-list">
              {otherProjects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project ${studio.activeProjectId === p.id ? 'is-active' : ''}`}
                    onClick={() => {
                      studio.setActiveProjectId(p.id)
                      setView('docs')
                    }}
                  >
                    <span className="project__dot project__dot--muted" />
                    <span className="project__name">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sidebar__foot">
          <p className="sidebar__user">
            {auth.profile?.displayName || auth.user?.email}
          </p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={auth.signOut}>
            Çıkış
          </button>
        </div>
      </aside>

      <main className="main">
        {(auth.error || studio.error) && (
          <p className="banner-error">{auth.error || studio.error}</p>
        )}

        {view === 'dashboard' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <p className="eyebrow">Studio HQ</p>
                <h1>Bihter Games — Dashboard</h1>
              </div>
            </header>

            <section className="dash-grid">
              <button
                type="button"
                className="dash-card"
                onClick={() => {
                  setMineOnly(true)
                  setProjectFilter('all')
                  setView('tasks')
                }}
              >
                <p className="dash-card__tag">Hızlı erişim</p>
                <h2>Görevlerim</h2>
                <p>{myTasks.length} açık görev sana atanmış</p>
              </button>

              <button
                type="button"
                className="dash-card"
                onClick={() => setView('projects')}
              >
                <p className="dash-card__tag">Projeler</p>
                <h2>{studio.projects.length} proje</h2>
                <p>Blind Taxi, Frostline ve diğerleri</p>
              </button>

              <button
                type="button"
                className="dash-card"
                onClick={() => setView('docs')}
              >
                <p className="dash-card__tag">Dökümanlar</p>
                <h2>{studio.documents.length} link</h2>
                <p>GDD, tasarım ve referanslar</p>
              </button>
            </section>

            <section className="dash-section">
              <h2>Bana atanan</h2>
              <ul className="dash-list">
                {myTasks.length === 0 && (
                  <li className="muted">Sana atanmış açık görev yok.</li>
                )}
                {myTasks.slice(0, 8).map((t) => {
                  const proj = studio.projects.find((p) => p.id === t.projectId)
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="dash-list__item"
                        onClick={() => {
                          studio.setActiveProjectId(t.projectId)
                          setProjectFilter(t.projectId)
                          setMineOnly(true)
                          setView('tasks')
                        }}
                      >
                        <span>{t.title}</span>
                        <span className="tag">{proj?.name ?? 'Proje'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="dash-section">
              <h2>Projeler</h2>
              <div className="dash-projects">
                {studio.projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="dash-project"
                    onClick={() => {
                      studio.setActiveProjectId(p.id)
                      setView('projects')
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span>
                      {PROJECT_STATUSES.find((s) => s.id === p.status)?.label ??
                        p.status}
                    </span>
                  </button>
                ))}
                {studio.projects.length === 0 && (
                  <p className="muted">Henüz proje yok — soldan ekle.</p>
                )}
              </div>
            </section>
          </>
        )}

        {view === 'tasks' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <p className="eyebrow">Board</p>
                <h1>Görevler</h1>
              </div>
              <div className="topbar__actions">
                <button
                  type="button"
                  className={`pill ${mineOnly ? 'is-active' : ''}`}
                  onClick={() => setMineOnly((v) => !v)}
                >
                  Bana atanan
                </button>
              </div>
            </header>

            <div className="filters">
              <select
                value={projectFilter}
                onChange={(e) => {
                  const v = e.target.value
                  setProjectFilter(v)
                  if (v !== 'all') studio.setActiveProjectId(v)
                }}
                aria-label="Proje filtresi"
              >
                <option value="all">Tüm projeler</option>
                {studio.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <form className="composer" onSubmit={submitTask}>
              <input
                className="composer__title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Yeni görev…"
                required
              />
              <div className="composer__row">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as GameArea)}
                >
                  {[...GAME_AREAS, PERSONAL_AREA].map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Atanmamış</option>
                  {studio.profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <button type="submit" className="btn btn--lime">
                  Ekle
                </button>
              </div>
            </form>

            <div className="kanban">
              {columns.map((col) => (
                <section key={col.id} className="kanban__col">
                  <header className="kanban__head">
                    <h2>{col.label}</h2>
                    <span>{col.tasks.length}</span>
                  </header>
                  <ul className="kanban__list">
                    {col.tasks.map((task) => {
                      const proj = studio.projects.find(
                        (p) => p.id === task.projectId,
                      )
                      const areaLabel =
                        [...GAME_AREAS, PERSONAL_AREA].find(
                          (a) => a.id === task.area,
                        )?.label ?? task.area
                      return (
                        <li key={task.id} className="kcard">
                          <p className="kcard__title">{task.title}</p>
                          <div className="kcard__meta">
                            <span className="tag">{proj?.name}</span>
                            <span className="tag">{areaLabel}</span>
                            <span className={`prio prio--${task.priority}`}>
                              {
                                PRIORITIES.find((p) => p.id === task.priority)
                                  ?.label
                              }
                            </span>
                          </div>
                          <div className="kcard__foot">
                            <span className="kcard__who">
                              {studio.profileName(task.assigneeId)}
                            </span>
                            <div className="kcard__moves">
                              {TASK_STATUSES.filter((s) => s.id !== task.status).map(
                                (s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="chip"
                                    title={s.label}
                                    onClick={() =>
                                      void studio.updateTask(task.id, {
                                        status: s.id as TaskStatus,
                                      })
                                    }
                                  >
                                    {s.id === 'todo'
                                      ? 'Todo'
                                      : s.id === 'doing'
                                        ? 'Doing'
                                        : 'Done'}
                                  </button>
                                ),
                              )}
                              <button
                                type="button"
                                className="chip chip--danger"
                                onClick={() => void studio.deleteTask(task.id)}
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}

        {view === 'projects' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <p className="eyebrow">Projects</p>
                <h1>Projeler</h1>
              </div>
              <button
                type="button"
                className="btn btn--lime"
                onClick={() => openCreate('game')}
              >
                Yeni proje
              </button>
            </header>

            <div className="project-grid">
              {studio.projects.map((p) => {
                const open = studio.tasks.filter(
                  (t) => t.projectId === p.id && t.status !== 'done',
                ).length
                const docs = studio.documents.filter((d) => d.projectId === p.id)
                return (
                  <article key={p.id} className="project-card">
                    <div className="project-card__top">
                      <h2>{p.name}</h2>
                      <span className="tag">
                        {PROJECT_STATUSES.find((s) => s.id === p.status)?.label}
                      </span>
                    </div>
                    {p.description && <p>{p.description}</p>}
                    <div className="project-card__meta">
                      <span>{open} açık görev</span>
                      <span>{docs.length} döküman</span>
                      {p.engine && <span>{p.engine}</span>}
                    </div>
                    <div className="project-card__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          studio.setActiveProjectId(p.id)
                          setProjectFilter(p.id)
                          setView('tasks')
                        }}
                      >
                        Görevler
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          studio.setActiveProjectId(p.id)
                          setView('docs')
                        }}
                      >
                        Dökümanlar
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          studio.setActiveProjectId(p.id)
                          setModalMode('edit')
                          setModalOpen(true)
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => {
                          if (
                            confirm(`“${p.name}” ve tüm görevleri silinsin mi?`)
                          ) {
                            void studio.deleteProject(p.id)
                          }
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        {view === 'docs' && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <p className="eyebrow">Docs</p>
                <h1>Dökümanlar</h1>
              </div>
            </header>

            <div className="filters">
              <select
                value={studio.activeProjectId}
                onChange={(e) => studio.setActiveProjectId(e.target.value)}
              >
                {studio.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {!studio.activeProject ? (
              <p className="muted pad">Önce bir proje oluştur.</p>
            ) : (
              <>
                <form className="composer" onSubmit={submitDoc}>
                  <input
                    className="composer__title"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Döküman adı (GDD, art bible…)"
                    required
                  />
                  <div className="composer__row">
                    <input
                      className="composer__grow"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://…"
                      type="url"
                      required
                    />
                    <button type="submit" className="btn btn--lime">
                      Link ekle
                    </button>
                  </div>
                </form>

                <ul className="doc-list">
                  {studio.projectDocuments.length === 0 && (
                    <li className="muted">Bu projede döküman yok.</li>
                  )}
                  {studio.projectDocuments.map((d) => (
                    <li key={d.id} className="doc-row">
                      <a href={d.url} target="_blank" rel="noopener noreferrer">
                        {d.title}
                      </a>
                      <button
                        type="button"
                        className="chip chip--danger"
                        onClick={() => void studio.deleteDocument(d.id)}
                      >
                        Sil
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </main>

      <ProjectModal
        open={modalOpen}
        mode={modalMode}
        initial={modalMode === 'edit' ? studio.activeProject : null}
        defaultKind={modalKind}
        onClose={() => setModalOpen(false)}
        onSubmit={(v) => void handleProjectSubmit(v)}
      />
    </div>
  )
}

export default App
