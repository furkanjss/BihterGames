import { useEffect, useState, type FormEvent } from 'react'
import {
  GAME_AREAS,
  PRIORITIES,
  TASK_STATUSES,
  type GameArea,
  type Priority,
  type Profile,
  type Project,
  type Task,
  type TaskStatus,
} from './types'

export type TaskFormValue = {
  title: string
  area: GameArea
  priority: Priority
  status: TaskStatus
  assigneeId: string
  dueDate: string
  notes: string
  projectId: string
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
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !task) {
      setForm(null)
      return
    }
    setForm({
      title: task.title,
      area: task.area,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId ?? '',
      dueDate: task.dueDate ?? '',
      notes: task.notes ?? '',
      projectId: task.projectId,
    })
  }, [open, task])

  if (!open || !task || !form) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!task || !form || !form.title.trim()) return
    const id = task.id
    const payload = form
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
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id="task-modal-title">Görevi düzenle</h2>
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
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
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

          <label>
            Son tarih
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>

          <label>
            Detay / not
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Açıklama, checklist, link…"
            />
          </label>

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
