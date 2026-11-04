import { useEffect, useState, type FormEvent } from 'react'
import {
  formatTaskDate,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  todayDate,
} from './taskTime'
import {
  GAME_AREAS,
  PRIORITIES,
  TASK_STATUSES,
  type GameArea,
  type Priority,
  type Profile,
  type Project,
  type Task,
  type TaskLink,
  type TaskStatus,
} from './types'

export type TaskFormValue = {
  title: string
  area: GameArea
  priority: Priority
  status: TaskStatus
  assigneeId: string
  notes: string
  projectId: string
  dueDate: string
  links: TaskLink[]
  startedAt: string | null
  completedAt: string | null
}

function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

export function TaskModal({
  open,
  task,
  projects,
  profiles,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  task: Task | null
  projects: Project[]
  profiles: Profile[]
  onClose: () => void
  onSave: (id: string, value: TaskFormValue) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  const [form, setForm] = useState<TaskFormValue | null>(null)
  const [startedLocal, setStartedLocal] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !task) {
      setForm(null)
      setStartedLocal('')
      setLinkTitle('')
      setLinkUrl('')
      return
    }
    setForm({
      title: task.title,
      area: task.area,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId ?? '',
      notes: task.notes ?? '',
      projectId: task.projectId,
      dueDate: task.dueDate ?? '',
      links: task.links ?? [],
      startedAt: task.startedAt ?? null,
      completedAt: task.completedAt ?? null,
    })
    setStartedLocal(
      task.startedAt ? toDatetimeLocalValue(task.startedAt) : '',
    )
    setLinkTitle('')
    setLinkUrl('')
  }, [open, task])

  if (!open || !task || !form) return null

  function setStatus(next: TaskStatus) {
    if (!form) return
    const patch: TaskFormValue = { ...form, status: next }
    if (next === 'done' && form.status !== 'done') {
      patch.completedAt = form.completedAt || todayDate()
    } else if (next !== 'done' && form.status === 'done') {
      patch.completedAt = null
    }
    if (next === 'doing' && !startedLocal) {
      setStartedLocal(toDatetimeLocalValue())
    }
    setForm(patch)
  }

  function addLink() {
    if (!form) return
    const url = normalizeUrl(linkUrl)
    if (!url) return
    const title = linkTitle.trim() || url
    setForm({
      ...form,
      links: [...form.links, { title, url }],
    })
    setLinkTitle('')
    setLinkUrl('')
  }

  function removeLink(index: number) {
    if (!form) return
    setForm({
      ...form,
      links: form.links.filter((_, i) => i !== index),
    })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!task || !form || !form.title.trim()) return
    const id = task.id
    const startedAt =
      form.status === 'doing' || startedLocal
        ? fromDatetimeLocalValue(startedLocal)
        : form.startedAt
    const pendingUrl = normalizeUrl(linkUrl)
    const links = [...form.links]
    if (pendingUrl) {
      links.push({
        title: linkTitle.trim() || pendingUrl,
        url: pendingUrl,
      })
    }
    const payload: TaskFormValue = {
      ...form,
      links,
      dueDate: form.dueDate,
      startedAt:
        form.status === 'todo' && !startedLocal ? null : startedAt,
      completedAt:
        form.status === 'done'
          ? form.completedAt || todayDate()
          : null,
    }
    setBusy(true)
    try {
      await onSave(id, payload)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id="task-modal-title">Görev detayı</h2>
          <button type="button" className="icon-x" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <form className="modal__form" onSubmit={(e) => void submit(e)}>
          <label>
            Başlık
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </label>

          <label>
            Proje
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="modal__row">
            <label>
              Alan
              <select
                value={form.area}
                onChange={(e) =>
                  setForm({ ...form, area: e.target.value as GameArea })
                }
              >
                {GAME_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Öncelik
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Priority })
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal__row">
            <label>
              Durum
              <select
                value={form.status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Atanan
              <select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              >
                <option value="">Atanmamış</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal__row">
            <label>
              Son tarih
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
            <label>
              Başlama saati
              <input
                type="datetime-local"
                value={startedLocal}
                onChange={(e) => setStartedLocal(e.target.value)}
              />
            </label>
          </div>

          {form.status === 'done' ? (
            <label>
              Tamamlanma tarihi
              <input
                type="date"
                value={form.completedAt || todayDate()}
                onChange={(e) =>
                  setForm({ ...form, completedAt: e.target.value || null })
                }
              />
            </label>
          ) : form.completedAt ? (
            <p className="modal__hint">
              Önceki tamamlanma: {formatTaskDate(form.completedAt)}
            </p>
          ) : null}

          <label>
            Açıklama / not
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={6}
              placeholder="Ne yapılacak, kabul kriterleri, checklist…"
            />
          </label>

          <section className="task-detail">
            <header className="task-detail__head">
              <h3>Linkler</h3>
              <span>{form.links.length}</span>
            </header>
            <p className="task-detail__empty">
              Drive, Figma, Notion vb. link ekleyebilirsin.
            </p>
            {form.links.length > 0 && (
              <ul className="task-detail__list">
                {form.links.map((link, i) => (
                  <li key={`${link.url}-${i}`} className="task-detail__item">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="task-detail__link"
                    >
                      <strong>{link.title}</strong>
                      <em>{link.url}</em>
                    </a>
                    <button
                      type="button"
                      className="task-detail__remove"
                      onClick={() => removeLink(i)}
                      aria-label="Linki kaldır"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="task-detail__add">
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Başlık (opsiyonel)"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={addLink}
                disabled={!linkUrl.trim()}
              >
                Ekle
              </button>
            </div>
          </section>

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => {
                if (!confirm('Bu görev silinsin mi?')) return
                void (async () => {
                  await onDelete(task.id)
                  onClose()
                })()
              }}
            >
              Sil
            </button>
            <div className="modal__actions-right">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                İptal
              </button>
              <button type="submit" className="btn btn--lime" disabled={busy}>
                {busy ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
