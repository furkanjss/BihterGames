import { useEffect, useState, type FormEvent } from 'react'
import type {
  CurrencyCode,
  Project,
  ProjectKind,
  ProjectStatus,
} from './types'
import {
  CURRENCIES,
  ENGINES,
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
  budgetAmount: string
  budgetCurrency: CurrencyCode
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
  budgetAmount: '',
  budgetCurrency: 'TRY',
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
    budgetAmount:
      p.budgetAmount != null && !Number.isNaN(p.budgetAmount)
        ? String(p.budgetAmount)
        : '',
    budgetCurrency: p.budgetCurrency ?? 'TRY',
    teamNotes: p.teamNotes ?? '',
  }
}

export function ProjectModal({
  open,
  mode,
  initial,
  defaultKind,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Project | null
  defaultKind?: ProjectKind
  onClose: () => void
  onSubmit: (value: ProjectFormValue) => void
}) {
  const [form, setForm] = useState<ProjectFormValue>(empty(defaultKind))

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) setForm(fromProject(initial))
    else setForm(empty(defaultKind ?? 'game'))
  }, [open, mode, initial, defaultKind])

  if (!open) return null

  function togglePlatform(platform: string) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'edit' ? 'Projeyi düzenle' : 'Yeni proje'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>{mode === 'edit' ? 'Projeyi düzenle' : 'Yeni proje'}</h2>
          <button type="button" className="task__delete" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="modal__form" onSubmit={submit}>
          <label>
            Ad
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </label>

          <div className="modal__row">
            <label>
              Tür
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kind: e.target.value as ProjectKind,
                    status:
                      e.target.value === 'personal' ? 'production' : form.status,
                  })
                }
              >
                <option value="game">Oyun</option>
                <option value="personal">Kişisel</option>
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
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Açıklama
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Pitch, hedefler, dikey dilim notları…"
            />
          </label>

          {form.kind === 'game' && (
            <>
              <div className="modal__row">
                <label>
                  Motor
                  <select
                    value={form.engine}
                    onChange={(e) =>
                      setForm({ ...form, engine: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {ENGINES.map((engine) => (
                      <option key={engine} value={engine}>
                        {engine}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tür / genre
                  <input
                    value={form.genre}
                    onChange={(e) =>
                      setForm({ ...form, genre: e.target.value })
                    }
                    placeholder="Roguelike, puzzle…"
                  />
                </label>
              </div>

              <fieldset className="modal__platforms">
                <legend>Platformlar</legend>
                <div className="modal__chips">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      className={`pill ${form.platforms.includes(platform) ? 'is-active' : ''}`}
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform}
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
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </label>
            <label>
              Hedef tarih
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm({ ...form, targetDate: e.target.value })
                }
              />
            </label>
          </div>

          <div className="modal__row">
            <label>
              Proje bütçesi
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budgetAmount}
                onChange={(e) =>
                  setForm({ ...form, budgetAmount: e.target.value })
                }
                placeholder="0"
              />
            </label>
            <label>
              Para birimi
              <select
                value={form.budgetCurrency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budgetCurrency: e.target.value as CurrencyCode,
                  })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Ekip / notlar
            <textarea
              rows={2}
              value={form.teamNotes}
              onChange={(e) => setForm({ ...form, teamNotes: e.target.value })}
              placeholder="Ekip boyutu, ortaklar, kısıtlar…"
            />
          </label>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn--lime">
              {mode === 'edit' ? 'Kaydet' : 'Proje oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
