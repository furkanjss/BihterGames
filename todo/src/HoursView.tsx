import { useMemo, useState, type FormEvent } from 'react'
import type { WorkLog } from './types'

function parseHours(raw: string): number {
  const n = Number(raw.trim().replace(',', '.'))
  return n
}

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
  const [workDate, setWorkDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [hours, setHours] = useState('8')
  const [notes, setNotes] = useState('')
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  )

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
    set.add(new Date().toISOString().slice(0, 7))
    return [...set].sort().reverse()
  }, [mine])

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

      <form className="composer" onSubmit={(e) => void submit(e)}>
        <div className="composer__row">
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            required
            aria-label="Gün"
          />
          <label className="hours__hours">
            <span>Saat</span>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="decimal"
              placeholder="8"
              required
            />
          </label>
          <input
            className="composer__grow"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not (opsiyonel)"
          />
          <button type="submit" className="btn btn--lime btn--sm">
            Bildir
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
                <p>{l.workDate}</p>
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
