import { useMemo, useState, type FormEvent } from 'react'
import { formatMoney, formatMoneyInput, parseMoney } from './money'
import {
  FINANCE_CATEGORIES,
  FINANCE_TYPES,
  type FinanceEntry,
  type FinanceEntryType,
  type Profile,
  type StaffRate,
  type WorkLog,
} from './types'

const dayFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const money = formatMoney
const FORECAST_MONTHS = 10

const monthLabel = new Intl.DateTimeFormat('tr-TR', {
  month: 'short',
  year: 'numeric',
})

/** One line per type+label so re-logging the same payroll doesn't double the forecast */
function uniqueRecurring(entries: FinanceEntry[]): FinanceEntry[] {
  const map = new Map<string, FinanceEntry>()
  const sorted = entries
    .filter((e) => e.recurring)
    .slice()
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate))
  for (const e of sorted) {
    map.set(`${e.entryType}:${e.label.trim().toLowerCase()}`, e)
  }
  return [...map.values()]
}

export function ManagementView({
  finance,
  workLogs,
  staffRates,
  profiles,
  onAdd,
  onDelete,
  onDeleteWorkLog,
  onSetStaffRate,
  profileName,
}: {
  finance: FinanceEntry[]
  workLogs: WorkLog[]
  staffRates: StaffRate[]
  profiles: Profile[]
  onAdd: (input: {
    entryType: FinanceEntryType
    label: string
    amount: number
    entryDate: string
    category?: string
    notes?: string
    recurring?: boolean
  }) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
  onDeleteWorkLog: (id: string) => Promise<void> | void
  onSetStaffRate: (userId: string, hourlyRate: number) => Promise<void> | void
  profileName: (id: string | null | undefined) => string
}) {
  const [entryType, setEntryType] = useState<FinanceEntryType>('expense')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [monthFilter, setMonthFilter] = useState<'all' | string>('all')
  const [hoursMonth, setHoursMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  )
  const [hoursUser, setHoursUser] = useState<'all' | string>('all')
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({})

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    let payroll = 0
    for (const e of finance) {
      if (e.entryType === 'income') income += e.amount
      if (e.entryType === 'expense') expense += e.amount
      if (e.entryType === 'payroll') payroll += e.amount
    }
    return {
      income,
      expense,
      payroll,
      balance: income - expense - payroll,
    }
  }, [finance])

  const recurringLines = useMemo(() => uniqueRecurring(finance), [finance])

  const monthlyDelta = useMemo(() => {
    let income = 0
    let out = 0
    for (const e of recurringLines) {
      if (e.entryType === 'income') income += e.amount
      else out += e.amount
    }
    return { income, out, net: income - out }
  }, [recurringLines])

  const forecast = useMemo(() => {
    const now = new Date()
    let bal = totals.balance
    const rows: {
      key: string
      label: string
      balance: number
      delta: number
    }[] = []
    for (let i = 1; i <= FORECAST_MONTHS; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      bal += monthlyDelta.net
      rows.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabel.format(d),
        balance: bal,
        delta: monthlyDelta.net,
      })
    }
    return rows
  }, [totals.balance, monthlyDelta.net])

  const months = useMemo(() => {
    const set = new Set(finance.map((e) => e.entryDate.slice(0, 7)))
    return [...set].sort().reverse()
  }, [finance])

  const filtered = useMemo(() => {
    if (monthFilter === 'all') return finance
    return finance.filter((e) => e.entryDate.startsWith(monthFilter))
  }, [finance, monthFilter])

  const monthTotals = useMemo(() => {
    const map = new Map<
      string,
      { income: number; expense: number; payroll: number }
    >()
    for (const e of finance) {
      const m = e.entryDate.slice(0, 7)
      const cur = map.get(m) ?? { income: 0, expense: 0, payroll: 0 }
      if (e.entryType === 'income') cur.income += e.amount
      if (e.entryType === 'expense') cur.expense += e.amount
      if (e.entryType === 'payroll') cur.payroll += e.amount
      map.set(m, cur)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, t]) => ({
        month,
        ...t,
        net: t.income - t.expense - t.payroll,
      }))
  }, [finance])

  const hoursMonths = useMemo(() => {
    const set = new Set(workLogs.map((l) => l.workDate.slice(0, 7)))
    set.add(new Date().toISOString().slice(0, 7))
    return [...set].sort().reverse()
  }, [workLogs])

  const hoursInMonth = useMemo(
    () =>
      workLogs
        .filter((l) => l.workDate.startsWith(hoursMonth))
        .filter((l) => (hoursUser === 'all' ? true : l.userId === hoursUser))
        .slice()
        .sort((a, b) => b.workDate.localeCompare(a.workDate)),
    [workLogs, hoursMonth, hoursUser],
  )

  const rateFor = (userId: string) =>
    staffRates.find((r) => r.userId === userId)?.hourlyRate ?? 0

  const hoursByUser = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of workLogs) {
      if (!l.workDate.startsWith(hoursMonth)) continue
      map.set(l.userId, (map.get(l.userId) ?? 0) + l.hours)
    }
    const ids = new Set<string>([
      ...profiles.map((p) => p.id),
      ...map.keys(),
    ])
    return [...ids]
      .map((userId) => {
        const hours = map.get(userId) ?? 0
        const rate = rateFor(userId)
        return {
          userId,
          hours,
          rate,
          pay: hours * rate,
          name: profileName(userId),
        }
      })
      .filter((row) =>
        hoursUser === 'all' ? true : row.userId === hoursUser,
      )
      .sort((a, b) => b.pay - a.pay || b.hours - a.hours)
  }, [workLogs, hoursMonth, hoursUser, profiles, staffRates, profileName])

  const monthPayTotal = useMemo(
    () => hoursByUser.reduce((s, r) => s + r.pay, 0),
    [hoursByUser],
  )

  const monthHoursTotal = useMemo(
    () => hoursByUser.reduce((s, r) => s + r.hours, 0),
    [hoursByUser],
  )

  function rateDraftValue(userId: string): string {
    if (rateDrafts[userId] !== undefined) return rateDrafts[userId]
    const rate = rateFor(userId)
    return rate > 0 ? formatMoneyInput(String(Math.round(rate))) : ''
  }

  async function saveRate(userId: string) {
    const raw = rateDraftValue(userId)
    const n = parseMoney(raw || '0')
    if (Number.isNaN(n) || n < 0) return
    await onSetStaffRate(userId, n)
    setRateDrafts((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = parseMoney(amount)
    if (!label.trim() || Number.isNaN(n) || n < 0) return
    await onAdd({
      entryType,
      label,
      amount: n,
      entryDate,
      category: category || undefined,
      notes: notes || undefined,
      recurring,
    })
    setLabel('')
    setAmount('')
    setNotes('')
    setRecurring(false)
  }

  return (
    <div className="mgmt">
      <header className="topbar">
        <div className="topbar__title">
          <p className="eyebrow">Private</p>
          <h1>Yönetim</h1>
        </div>
      </header>

      <p className="pad muted">
        Sadece sen görürsün. Gelir / gider / maaş kayıtları ana bakiyeden düşer.
        Tekrarlayan kalemler 10 aylık öngörüye işler.
      </p>

      <section className="mgmt__stats">
        <article>
          <span>Ana bakiye</span>
          <strong className={totals.balance >= 0 ? 'pos' : 'neg'}>
            {money(totals.balance)}
          </strong>
        </article>
        <article>
          <span>Toplam gelir</span>
          <strong className="pos">{money(totals.income)}</strong>
        </article>
        <article>
          <span>Toplam gider</span>
          <strong className="neg">{money(totals.expense)}</strong>
        </article>
        <article>
          <span>Maaş / ödemeler</span>
          <strong className="neg">{money(totals.payroll)}</strong>
        </article>
      </section>

      <form className="composer mgmt__form" onSubmit={(e) => void submit(e)}>
        <div className="composer__row">
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as FinanceEntryType)}
            aria-label="Tür"
          >
            {FINANCE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <label className="mgmt__amount">
            <span>₺</span>
            <input
              value={amount}
              onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
              placeholder="1.000.000"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Tutar"
              required
            />
          </label>
          <input
            className="composer__grow"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={
              entryType === 'payroll'
                ? 'Çalışan / ödeme adı'
                : entryType === 'income'
                  ? 'Gelir kalemi'
                  : 'Gider kalemi'
            }
            required
          />
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Kategori"
          >
            <option value="">Kategori</option>
            {FINANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--lime btn--sm">
            Ekle
          </button>
        </div>
        <div className="mgmt__form-extra">
          <label className="mgmt__check">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span>Tekrarlayan (her ay)</span>
          </label>
          <input
            className="composer__title"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not (opsiyonel)"
          />
        </div>
      </form>

      <section className="dash-section mgmt__hours">
        <div className="mgmt__hours-head">
          <div>
            <p className="eyebrow">Payroll</p>
            <h2>Çalışma saatleri</h2>
            <p className="muted">
              Saatlik ücret gir; ay sonu tutar = saat × ücret.
            </p>
          </div>
          <div className="mgmt__hours-filters">
            <select
              value={hoursMonth}
              onChange={(e) => setHoursMonth(e.target.value)}
              aria-label="Saat ayı"
            >
              {hoursMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={hoursUser}
              onChange={(e) => setHoursUser(e.target.value)}
              aria-label="Çalışan"
            >
              <option value="all">Tüm çalışanlar</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName || p.id.slice(0, 6)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mgmt__hours-summary">
          <article>
            <span>Toplam saat</span>
            <strong>{monthHoursTotal.toFixed(1)}</strong>
          </article>
          <article>
            <span>Aylık tutar</span>
            <strong className="pos">{money(monthPayTotal)}</strong>
          </article>
        </div>

        <div className="mgmt__hours-grid">
          {hoursByUser.length === 0 && (
            <p className="muted">Henüz çalışan veya bildirim yok.</p>
          )}
          {hoursByUser.map((row) => (
            <article key={row.userId} className="mgmt__staff-card">
              <header>
                <strong>{row.name}</strong>
                <span className="muted">{hoursMonth}</span>
              </header>
              <div className="mgmt__staff-stats">
                <div>
                  <span>Saat</span>
                  <b>{row.hours.toFixed(1)}</b>
                </div>
                <div>
                  <span>Aylık tutar</span>
                  <b className="pos">{money(row.pay)}</b>
                </div>
              </div>
              <label className="mgmt__rate">
                <span>Saatlik ücret (₺)</span>
                <div className="mgmt__rate-row">
                  <input
                    value={rateDraftValue(row.userId)}
                    onChange={(e) =>
                      setRateDrafts((prev) => ({
                        ...prev,
                        [row.userId]: formatMoneyInput(e.target.value),
                      }))
                    }
                    onBlur={() => void saveRate(row.userId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void saveRate(row.userId)
                      }
                    }}
                    inputMode="numeric"
                    placeholder="örn. 500"
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => void saveRate(row.userId)}
                  >
                    Kaydet
                  </button>
                </div>
              </label>
            </article>
          ))}
        </div>

        <h3 className="mgmt__hours-sub">Günlük kayıtlar</h3>
        <ul className="mgmt__list">
          {hoursInMonth.length === 0 && (
            <li className="muted">Bu ay bildirim yok.</li>
          )}
          {hoursInMonth.map((l) => {
            const rate = rateFor(l.userId)
            return (
              <li key={l.id} className="mgmt__row">
                <div>
                  <p>
                    <span className="mgmt__type">{profileName(l.userId)}</span>{' '}
                    {dayFmt.format(new Date(`${l.workDate}T12:00:00`))}
                  </p>
                  {l.notes && <p className="muted">{l.notes}</p>}
                </div>
                <div className="mgmt__hours-cell">
                  <strong>{l.hours} sa</strong>
                  {rate > 0 && (
                    <span className="muted">{money(l.hours * rate)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="chip chip--danger"
                  onClick={() => void onDeleteWorkLog(l.id)}
                >
                  Sil
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="dash-section mgmt__forecast">
        <h2>10 aylık öngörü</h2>
        <p className="muted pad-inline">
          Mevcut bakiyeden başlar. İşaretli tekrarlayan kalemler her ay
          uygulanır.
          {recurringLines.length === 0
            ? ' Henüz tekrarlayan kalem yok.'
            : ` Aylık net: ${monthlyDelta.net >= 0 ? '+' : ''}${money(monthlyDelta.net)} (gelir ${money(monthlyDelta.income)} · gider ${money(monthlyDelta.out)}).`}
        </p>

        {recurringLines.length > 0 && (
          <ul className="mgmt__recurring">
            {recurringLines.map((e) => (
              <li key={e.id}>
                <span className={`mgmt__type mgmt__type--${e.entryType}`}>
                  {FINANCE_TYPES.find((t) => t.id === e.entryType)?.label}
                </span>
                {e.label}
                <strong className={e.entryType === 'income' ? 'pos' : 'neg'}>
                  {e.entryType === 'income' ? '+' : '−'}
                  {money(e.amount)}
                  <span className="muted"> / ay</span>
                </strong>
              </li>
            ))}
          </ul>
        )}

        <div className="mgmt__forecast-grid">
          <article className="mgmt__forecast-row mgmt__forecast-row--now">
            <strong>Şimdi</strong>
            <span className="muted">başlangıç</span>
            <strong className={totals.balance >= 0 ? 'pos' : 'neg'}>
              {money(totals.balance)}
            </strong>
          </article>
          {forecast.map((row) => (
            <article key={row.key} className="mgmt__forecast-row">
              <strong>{row.label}</strong>
              <span className={row.delta >= 0 ? 'pos' : 'neg'}>
                {row.delta >= 0 ? '+' : ''}
                {money(row.delta)}
              </span>
              <strong className={row.balance >= 0 ? 'pos' : 'neg'}>
                {money(row.balance)}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className="dash-section">
        <h2>Aylık özet</h2>
        <div className="mgmt__months">
          {monthTotals.length === 0 && (
            <p className="muted">Henüz kayıt yok.</p>
          )}
          {monthTotals.map((m) => (
            <article key={m.month} className="mgmt__month">
              <strong>{m.month}</strong>
              <span className="pos">+{money(m.income)}</span>
              <span className="neg">-{money(m.expense + m.payroll)}</span>
              <span>Net {money(m.net)}</span>
              <span className="muted">
                maaş {money(m.payroll)} · gider {money(m.expense)}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="filters">
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">Tüm aylar</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <ul className="mgmt__list">
        {filtered.map((e) => (
          <li key={e.id} className="mgmt__row">
            <div>
              <p>
                <span className={`mgmt__type mgmt__type--${e.entryType}`}>
                  {FINANCE_TYPES.find((t) => t.id === e.entryType)?.label}
                </span>{' '}
                {e.label}
                {e.recurring && (
                  <span className="mgmt__badge" title="Her ay tekrarlar">
                    tekrarlayan
                  </span>
                )}
              </p>
              <p className="muted">
                {e.entryDate}
                {e.category ? ` · ${e.category}` : ''}
                {e.notes ? ` · ${e.notes}` : ''}
              </p>
            </div>
            <strong className={e.entryType === 'income' ? 'pos' : 'neg'}>
              {e.entryType === 'income' ? '+' : '-'}
              {money(e.amount, e.currency)}
            </strong>
            <button
              type="button"
              className="chip chip--danger"
              onClick={() => void onDelete(e.id)}
            >
              Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
