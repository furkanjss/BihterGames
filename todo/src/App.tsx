import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react'
import './App.css'
import { LoginView } from './LoginView'
import { ManagementView } from './ManagementView'
import { ProjectModal, type ProjectFormValue } from './ProjectModal'
import { TaskModal, type TaskFormValue } from './TaskModal'
import type { ProjectStatus, Task } from './types'
import {
  GAME_AREAS,
  isParkedProjectStatus,
  OWNER_EMAIL,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  type GameArea,
  type Priority,
  type ProjectKind,
  type TaskStatus,
} from './types'

type ProjectListFilter = 'active' | 'on-hold' | 'cancelled' | 'all'
import { useAuth } from './useAuth'
import { useStudio } from './useStudio'

type View = 'dashboard' | 'tasks' | 'projects' | 'docs' | 'ideas' | 'management'

function App() {
  const auth = useAuth()
  const studio = useStudio(auth.user?.id)
  const [view, setView] = useState<View>('dashboard')
  const [mineOnly, setMineOnly] = useState(false)
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all')
  const [projectListFilter, setProjectListFilter] =
    useState<ProjectListFilter>('active')
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<GameArea>('design')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaBody, setIdeaBody] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkBody, setLinkBody] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dropTargetRef = useRef<{ status: TaskStatus; index: number } | null>(
    null,
  )
  const didDrag = useRef(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalKind, setModalKind] = useState<ProjectKind>('game')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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
      tasks: boardTasks
        .filter((t) => t.status === col.id)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
  }, [boardTasks])

  const filteredProjects = useMemo(() => {
    return studio.projects.filter((p) => {
      if (projectListFilter === 'all') return true
      if (projectListFilter === 'active') return !isParkedProjectStatus(p.status)
      return p.status === projectListFilter
    })
  }, [studio.projects, projectListFilter])

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

  function clearDropTarget() {
    dropTargetRef.current = null
    setDragOverCol(null)
    setDropIndex(null)
  }

  function indexFromPointer(listEl: HTMLElement, clientY: number): number {
    const cards = [
      ...listEl.querySelectorAll<HTMLElement>('[data-task-id]'),
    ]
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return cards.length
  }

  function previewDrop(status: TaskStatus, listEl: HTMLElement, clientY: number) {
    const index = indexFromPointer(listEl, clientY)
    dropTargetRef.current = { status, index }
    setDragOverCol(status)
    setDropIndex(index)
  }

  function onDragStart(e: DragEvent, taskId: string) {
    setDraggingId(taskId)
    didDrag.current = true
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnd() {
    setDraggingId(null)
    clearDropTarget()
  }

  function onListDragOver(e: DragEvent, status: TaskStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    previewDrop(status, e.currentTarget as HTMLElement, e.clientY)
  }

  function onListDragLeave(e: DragEvent) {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    clearDropTarget()
  }

  async function onListDrop(e: DragEvent, status: TaskStatus) {
    e.preventDefault()
    e.stopPropagation()
    const listEl = e.currentTarget as HTMLElement
    const id =
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('text') ||
      draggingId
    const dropAt = indexFromPointer(listEl, e.clientY)

    setDraggingId(null)
    clearDropTarget()
    if (!id) return

    const visibleIds = [
      ...listEl.querySelectorAll<HTMLElement>('[data-task-id]'),
    ].map((el) => el.dataset.taskId!)

    const fromIndex = visibleIds.indexOf(id)
    let toIndex = dropAt
    if (fromIndex >= 0) {
      if (toIndex === fromIndex || toIndex === fromIndex + 1) return
      if (toIndex > fromIndex) toIndex -= 1
    }

    await studio.moveTask(id, status, toIndex, visibleIds)
  }

  async function saveName() {
    const ok = await auth.updateDisplayName(nameDraft)
    if (ok) {
      setEditingName(false)
      await studio.refresh()
    }
  }

  const isOwner =
    (auth.user?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase()

  const gameProjects = studio.projects.filter((p) => p.kind === 'game')
  const otherProjects = studio.projects.filter((p) => p.kind !== 'game')

  async function setProjectStatus(id: string, status: ProjectStatus) {
    await studio.updateProject(id, { status })
    if (status === 'on-hold' || status === 'cancelled') {
      setProjectListFilter(status)
    } else if (projectListFilter !== 'all') {
      setProjectListFilter('active')
    }
  }

  async function submitIdea(e: FormEvent) {
    e.preventDefault()
    if (!ideaTitle.trim()) return
    await studio.addIdea(ideaTitle, ideaBody)
    setIdeaTitle('')
    setIdeaBody('')
  }

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
            ] as [View, string][]
          )
            .concat(
              isOwner
                ? [
                    ['ideas', 'Fikirler'],
                    ['management', 'Yönetim'],
                  ]
                : [],
            )
            .map(([id, label]) => (
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
              const parked = isParkedProjectStatus(p.status)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project ${studio.activeProjectId === p.id ? 'is-active' : ''} ${parked ? 'is-parked' : ''}`}
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
          {editingName ? (
            <div className="name-edit">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Görünen ad"
                aria-label="Görünen ad"
              />
              <div className="name-edit__row">
                <button type="button" className="btn btn--lime btn--sm" onClick={() => void saveName()}>
                  Kaydet
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditingName(false)}
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="sidebar__user">
                {auth.profile?.displayName || auth.user?.email}
              </p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setNameDraft(auth.profile?.displayName || '')
                  setEditingName(true)
                }}
              >
                İsmi değiştir
              </button>
            </>
          )}
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
                {studio.projects
                  .filter((p) => !isParkedProjectStatus(p.status))
                  .map((p) => (
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
                        {PROJECT_STATUSES.find((s) => s.id === p.status)
                          ?.label ?? p.status}
                      </span>
                    </button>
                  ))}
                {studio.projects.filter((p) => !isParkedProjectStatus(p.status))
                  .length === 0 && (
                  <p className="muted">Henüz aktif proje yok — soldan ekle.</p>
                )}
              </div>
            </section>

            <section className="dash-section">
              <div className="dash-section__head">
                <h2>Önemli linkler</h2>
              </div>
              <ul className="links-list">
                {studio.links.length === 0 && (
                  <li className="muted">
                    Henüz link yok. Aşağıdan GitHub kuralları vb. ekleyebilirsin.
                  </li>
                )}
                {studio.links.map((l) => (
                  <li key={l.id} className="link-card">
                    <div className="link-card__top">
                      {l.url ? (
                        <a href={l.url} target="_blank" rel="noopener noreferrer">
                          {l.title}
                        </a>
                      ) : (
                        <strong>{l.title}</strong>
                      )}
                      <button
                        type="button"
                        className="chip chip--danger"
                        onClick={() => void studio.deleteLink(l.id)}
                      >
                        Sil
                      </button>
                    </div>
                    {l.body && <pre className="link-card__body">{l.body}</pre>}
                  </li>
                ))}
              </ul>
              <form
                className="composer composer--compact"
                onSubmit={(e) => {
                  e.preventDefault()
                  void studio.addLink(linkTitle, linkUrl, linkBody).then(() => {
                    setLinkTitle('')
                    setLinkUrl('')
                    setLinkBody('')
                  })
                }}
              >
                <input
                  className="composer__title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Başlık (örn. GitHub push kuralları)"
                  required
                />
                <input
                  className="composer__title"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL (opsiyonel)"
                />
                <textarea
                  className="ideas__body"
                  value={linkBody}
                  onChange={(e) => setLinkBody(e.target.value)}
                  rows={3}
                  placeholder="Kurallar / not (opsiyonel)"
                />
                <div className="composer__row">
                  <button type="submit" className="btn btn--lime btn--sm">
                    Link / kural ekle
                  </button>
                </div>
              </form>
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
              <span className="muted filters__hint">
                Kartları sürükleyip sütunlara bırak
              </span>
            </div>

            <form className="composer composer--compact" onSubmit={submitTask}>
              <input
                className="composer__title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tek görev…"
              />
              <div className="composer__row">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as GameArea)}
                >
                  {GAME_AREAS.map((a) => (
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
                      {p.displayName || p.id.slice(0, 6)}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <button type="submit" className="btn btn--lime btn--sm">
                  Ekle
                </button>
              </div>
            </form>

            <div className="kanban">
              {columns.map((col) => (
                <section
                  key={col.id}
                  className={`kanban__col ${dragOverCol === col.id ? 'is-drop' : ''}`}
                >
                  <header className="kanban__head">
                    <h2>{col.label}</h2>
                    <span>{col.tasks.length}</span>
                  </header>
                  <ul
                    className="kanban__list"
                    onDragOver={(e) => onListDragOver(e, col.id)}
                    onDragLeave={onListDragLeave}
                    onDrop={(e) => void onListDrop(e, col.id)}
                  >
                    {col.tasks.map((task, index) => {
                      const proj = studio.projects.find(
                        (p) => p.id === task.projectId,
                      )
                      const areaLabel =
                        GAME_AREAS.find((a) => a.id === task.area)?.label ??
                        task.area
                      const who = studio.profileName(task.assigneeId)
                      const showBefore =
                        dragOverCol === col.id &&
                        dropIndex === index &&
                        draggingId !== task.id
                      return (
                        <li
                          key={task.id}
                          data-task-id={task.id}
                          className={`kcard kcard--mini${showBefore ? ' is-drop-before' : ''}${draggingId === task.id ? ' is-dragging' : ''}`}
                          draggable
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onDragEnd={onDragEnd}
                          onClick={() => {
                            if (didDrag.current) {
                              didDrag.current = false
                              return
                            }
                            setEditingTask(task)
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setEditingTask(task)
                            }
                          }}
                        >
                          <div className="kcard__row">
                            <p className="kcard__title">{task.title}</p>
                            <button
                              type="button"
                              className="kcard__x"
                              aria-label="Sil"
                              onClick={(e) => {
                                e.stopPropagation()
                                void studio.deleteTask(task.id)
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div className="kcard__meta">
                            {projectFilter === 'all' && (
                              <span className="tag">{proj?.name}</span>
                            )}
                            <span className="tag">{areaLabel}</span>
                            <span className={`prio prio--${task.priority}`}>
                              {PRIORITIES.find((p) => p.id === task.priority)
                                ?.label ?? task.priority}
                            </span>
                            {task.assigneeId && (
                              <span className="kcard__who">{who}</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                    {dragOverCol === col.id &&
                      dropIndex === col.tasks.length && (
                        <li className="kanban__gap" aria-hidden />
                      )}
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

            <div className="project-filters">
              {(
                [
                  ['active', 'Aktif'],
                  ['on-hold', 'Beklemede'],
                  ['cancelled', 'İptal'],
                  ['all', 'Tümü'],
                ] as [ProjectListFilter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`pill ${projectListFilter === id ? 'is-active' : ''}`}
                  onClick={() => setProjectListFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="project-grid">
              {filteredProjects.map((p) => {
                const open = studio.tasks.filter(
                  (t) => t.projectId === p.id && t.status !== 'done',
                ).length
                const docs = studio.documents.filter((d) => d.projectId === p.id)
                const parked = isParkedProjectStatus(p.status)
                const statusClass =
                  p.status === 'on-hold'
                    ? 'is-on-hold'
                    : p.status === 'cancelled'
                      ? 'is-cancelled'
                      : ''
                return (
                  <article
                    key={p.id}
                    className={`project-card ${statusClass}`}
                  >
                    <div className="project-card__top">
                      <h2>{p.name}</h2>
                      <span className={`tag tag--${p.status ?? 'idea'}`}>
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
                      {isOwner && !parked && (
                        <>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() =>
                              void setProjectStatus(p.id, 'on-hold')
                            }
                          >
                            Beklemeye al
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              if (
                                confirm(
                                  `“${p.name}” iptal edilsin mi? (Silinmez; İptal listesine gider.)`,
                                )
                              ) {
                                void setProjectStatus(p.id, 'cancelled')
                              }
                            }}
                          >
                            İptal et
                          </button>
                        </>
                      )}
                      {isOwner && parked && (
                        <button
                          type="button"
                          className="btn btn--lime btn--sm"
                          onClick={() =>
                            void setProjectStatus(p.id, 'production')
                          }
                        >
                          Devam ettir
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => {
                            if (
                              confirm(
                                `“${p.name}” ve tüm görevleri silinsin mi?`,
                              )
                            ) {
                              void studio.deleteProject(p.id)
                            }
                          }}
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
              {filteredProjects.length === 0 && (
                <p className="muted project-grid__empty">
                  Bu filtrede proje yok.
                </p>
              )}
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

        {view === 'management' && isOwner && (
          <ManagementView
            finance={studio.finance}
            onAdd={studio.addFinance}
            onDelete={studio.deleteFinance}
          />
        )}

        {view === 'ideas' && isOwner && (
          <>
            <header className="topbar">
              <div className="topbar__title">
                <p className="eyebrow">Private</p>
                <h1>Fikirler</h1>
              </div>
            </header>
            <p className="pad muted ideas__lede">
              Sadece sen görürsün. Proje açmadan aklındakileri buraya yaz.
            </p>
            <form className="composer" onSubmit={(e) => void submitIdea(e)}>
              <input
                className="composer__title"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="Fikir başlığı…"
                required
              />
              <textarea
                className="ideas__body"
                value={ideaBody}
                onChange={(e) => setIdeaBody(e.target.value)}
                rows={3}
                placeholder="Not / detay (opsiyonel)"
              />
              <div className="composer__row">
                <button type="submit" className="btn btn--lime">
                  Kaydet
                </button>
              </div>
            </form>
            <ul className="ideas-list">
              {studio.ideas.length === 0 && (
                <li className="muted pad">Henüz fikir yok.</li>
              )}
              {studio.ideas.map((idea) => (
                <li key={idea.id} className="idea-card">
                  <div className="idea-card__top">
                    <h2>{idea.title}</h2>
                    <button
                      type="button"
                      className="chip chip--danger"
                      onClick={() => void studio.deleteIdea(idea.id)}
                    >
                      Sil
                    </button>
                  </div>
                  {idea.body && <p>{idea.body}</p>}
                  <time className="muted">
                    {new Date(idea.createdAt).toLocaleString('tr-TR')}
                  </time>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <ProjectModal
        open={modalOpen}
        mode={modalMode}
        initial={modalMode === 'edit' ? studio.activeProject : null}
        defaultKind={modalKind}
        canPark={isOwner}
        onClose={() => setModalOpen(false)}
        onSubmit={(v) => void handleProjectSubmit(v)}
      />

      <TaskModal
        open={Boolean(editingTask)}
        task={editingTask}
        projects={studio.projects}
        profiles={studio.profiles}
        onClose={() => setEditingTask(null)}
        onSave={async (id, value: TaskFormValue) => {
          await studio.updateTask(id, {
            title: value.title.trim(),
            area: value.area,
            priority: value.priority,
            status: value.status,
            assigneeId: value.assigneeId || null,
            dueDate: value.dueDate || null,
            notes: value.notes.trim() || null,
            projectId: value.projectId,
          })
        }}
        onDelete={async (id) => {
          await studio.deleteTask(id)
        }}
      />
    </div>
  )
}

export default App
