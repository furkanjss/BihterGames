import { useEffect, useState, type FormEvent } from 'react'
import type { Project, ProjectKind, ProjectStatus } from './types'
import {
  ENGINES,
  isParkedProjectStatus,
  PLATFORMS,
  PROJECT_STATUSES,
} from './types'

export type ProjectFormValue = {
  name: string
  kind: ProjectKind
  description: string
  status: ProjectStatus
  engine: string
  platforms: string[]
  genre: string
  startDate: string
  targetDate: string
  teamNotes: string
}

const empty = (kind: ProjectKind = 'game'): ProjectFormValue => ({
  name: '',
  kind,
  description: '',
  status: kind === 'game' ? 'idea' : 'production',
  engine: 'Unity',
  platforms: [],
  genre: '',
  startDate: '',
  targetDate: '',
  teamNotes: '',
})

function fromProject(p: Project): ProjectFormValue {
  return {
    name: p.name,
    kind: p.kind,
    description: p.description ?? '',
    status: p.status ?? 'idea',
    engine: p.engine ?? '',
    platforms: p.platforms ?? [],
    genre: p.genre ?? '',
    startDate: p.startDate ?? '',
    targetDate: p.targetDate ?? '',
    teamNotes: p.teamNotes ?? '',
  }
}

export function ProjectModal({
  open,
  mode,
  initial,
  defaultKind,
  canPark = false,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Project | null
  defaultKind?: ProjectKind
  /** info@ only — Beklemede / İptal seçenekleri */
  canPark?: boolean
  onClose: () => void
  onSubmit: (value: ProjectFormValue) => void
}) {
  const [form, setForm] = useState<ProjectFormValue>(empty(defaultKind))

  useEffect(() => {
    if (!open) return
    setForm(initial ? fromProject(initial) : empty(defaultKind ?? 'game'))
  }, [open, initial, defaultKind])

  if (!open) return null

  const statusOptions = PROJECT_STATUSES.filter(
    (s) => canPark || !isParkedProjectStatus(s.id) || form.status === s.id,
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  function togglePlatform(p: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }))
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id="project-modal-title">
            {mode === 'edit' ? 'Projeyi düzenle' : 'Yeni proje'}
          </h2>
          <button type="button" className="icon-x" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <form className="modal__form" onSubmit={submit}>
          <label>
            İsim
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Blind Taxi, Frostline…"
              required
              autoFocus
            />
          </label>

          <label>
            Tür
            <select
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as ProjectKind })
              }
            >
              <option value="game">Oyun</option>
              <option value="personal">Kişisel / yönetim</option>
            </select>
          </label>

          <label>
            Durum
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProjectStatus })
              }
            >
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Açıklama
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Kısa proje özeti"
            />
          </label>

          {form.kind === 'game' && (
            <>
              <label>
                Motor
                <select
                  value={form.engine}
                  onChange={(e) => setForm({ ...form, engine: e.target.value })}
                >
                  {ENGINES.map((eng) => (
                    <option key={eng} value={eng}>
                      {eng}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tür / genre
                <input
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  placeholder="Survival, puzzle…"
                />
              </label>

              <fieldset className="modal__platforms">
                <legend>Platformlar</legend>
                <div className="modal__chips">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pill ${form.platforms.includes(p) ? 'is-active' : ''}`}
                      onClick={() => togglePlatform(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <div className="modal__row">
            <label>
              Başlangıç
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>
            <label>
              Hedef
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </label>
          </div>

          <label>
            Notlar
            <textarea
              value={form.teamNotes}
              onChange={(e) => setForm({ ...form, teamNotes: e.target.value })}
              rows={2}
              placeholder="Ekip notları"
            />
          </label>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn btn--lime">
              {mode === 'edit' ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
