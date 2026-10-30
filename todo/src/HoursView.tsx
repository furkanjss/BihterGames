import { useMemo, useState, type FormEvent } from 'react'
import type { WorkLog } from './types'

function parseHours(raw: string): number {
  return Number(raw.trim().replace(',', '.'))
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const listFmt = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  weekday: 'short',
})

export function HoursView({
  userId,
  logs,
  onUpsert,
  onDelete,
}: {
  userId: string
  logs: WorkLog[]
  onUpsert: (input: {
    workDate: string
    hours: number
    notes?: string
  }) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
}) {
  const today = useMemo(() => toISODate(new Date()), [])
  const yesterday = useMemo(() => shiftDate(today, -1), [today])

  const [workDate, setWorkDate] = useState(today)
  const [hours, setHours] = useState('8')
  const [notes, setNotes] = useState('')
  const [month, setMonth] = useState(() => today.slice(0, 7))

  const mine = useMemo(
    () =>
      logs
        .filter((l) => l.userId === userId)
        .slice()
        .sort((a, b) => b.workDate.localeCompare(a.workDate)),
    [logs, userId],
  )

  const monthLogs = useMemo(
    () => mine.filter((l) => l.workDate.startsWith(month)),
    [mine, month],
  )

  const monthTotal = useMemo(
    () => monthLogs.reduce((s, l) => s + l.hours, 0),
    [monthLogs],
  )

  const months = useMemo(() => {
    const set = new Set(mine.map((l) => l.workDate.slice(0, 7)))
    set.add(today.slice(0, 7))
    return [...set].sort().reverse()
  }, [mine, today])

  const existingForDay = useMemo(
    () => mine.find((l) => l.workDate === workDate),
    [mine, workDate],
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    const h = parseHours(hours)
    if (!workDate || Number.isNaN(h) || h <= 0 || h > 24) return
    await onUpsert({
      workDate,
      hours: h,
      notes: notes.trim() || undefined,
    })
    setNotes('')
  }

  return (
    <div className="hours">
      <header className="topbar">
        <div className="topbar__title">
          <p className="eyebrow">Time</p>
          <h1>Çalışma saatleri</h1>
        </div>
      </header>

      <p className="pad muted">
        Günü seç, o gün kaç saat çalıştığını bildir. Aynı güne tekrar yazarsan
        kayıt güncellenir.
      </p>

      <form className="hours__form" onSubmit={(e) => void submit(e)}>
        <div className="hours__date-card">
          <div className="hours__date-head">
            <span className="hours__date-label">Gün</span>
            <div className="hours__quick">
              <button
                type="button"
                className={`hours__pill ${workDate === today ? 'is-on' : ''}`}
                onClick={() => setWorkDate(today)}
              >
                Bugün
              </button>
              <button
                type="button"
                className={`hours__pill ${workDate === yesterday ? 'is-on' : ''}`}
                onClick={() => setWorkDate(yesterday)}
              >
                Dün
              </button>
            </div>
          </div>

          <div className="hours__date-row">
            <button
              type="button"
              className="hours__nav"
              aria-label="Önceki gün"
              onClick={() => setWorkDate(shiftDate(workDate, -1))}
            >
              ‹
            </button>
            <label className="hours__date-main">
              <strong>
                {dateFmt.format(new Date(`${workDate}T12:00:00`))}
              </strong>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                required
              />
            </label>
            <button
              type="button"
              className="hours__nav"
              aria-label="Sonraki gün"
              onClick={() => setWorkDate(shiftDate(workDate, 1))}
            >
              ›
            </button>
          </div>

          {existingForDay && (
            <p className="hours__hint">
              Bu gün zaten <strong>{existingForDay.hours} sa</strong> kayıtlı —
              kaydetmek üzerine yazar.
            </p>
          )}
        </div>

        <div className="hours__fields">
          <label className="hours__field">
            <span>Saat</span>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="decimal"
              placeholder="8"
              required
            />
          </label>
          <label className="hours__field hours__field--grow">
            <span>Not</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsiyonel"
            />
          </label>
          <button type="submit" className="btn btn--lime">
            {existingForDay ? 'Güncelle' : 'Bildir'}
          </button>
        </div>
      </form>

      <section className="dash-section">
        <div className="hours__monthbar">
          <h2>Aylık özet</h2>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Ay"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <strong className="hours__total">{monthTotal.toFixed(1)} saat</strong>
        </div>

        <ul className="hours__list">
          {monthLogs.length === 0 && (
            <li className="muted">Bu ay henüz bildirim yok.</li>
          )}
          {monthLogs.map((l) => (
            <li key={l.id} className="hours__row">
              <div>
                <p>
                  {listFmt.format(new Date(`${l.workDate}T12:00:00`))}
                </p>
                {l.notes && <p className="muted">{l.notes}</p>}
              </div>
              <strong>{l.hours} sa</strong>
              <button
                type="button"
                className="chip chip--danger"
                onClick={() => void onDelete(l.id)}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
