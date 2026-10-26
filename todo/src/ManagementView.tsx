import { useMemo, useState, type FormEvent } from 'react'
import { formatMoney, formatMoneyInput, parseMoney } from './money'
import {
  FINANCE_CATEGORIES,
  FINANCE_TYPES,
  type FinanceEntry,
  type FinanceEntryType,
} from './types'

const money = formatMoney

export function ManagementView({
  finance,
  onAdd,
  onDelete,
}: {
  finance: FinanceEntry[]
  onAdd: (input: {
    entryType: FinanceEntryType
    label: string
    amount: number
    entryDate: string
    category?: string
    notes?: string
  }) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
}) {
  const [entryType, setEntryType] = useState<FinanceEntryType>('expense')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [monthFilter, setMonthFilter] = useState<'all' | string>('all')

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
    })
    setLabel('')
    setAmount('')
    setNotes('')
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
          >
            {FINANCE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
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
            value={amount}
            onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
            placeholder="örn. 100.000.000"
            inputMode="numeric"
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
        <input
          className="composer__title"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Not (opsiyonel)"
        />
      </form>

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
              </p>
              <p className="muted">
                {e.entryDate}
                {e.category ? ` · ${e.category}` : ''}
                {e.notes ? ` · ${e.notes}` : ''}
              </p>
            </div>
            <strong
              className={e.entryType === 'income' ? 'pos' : 'neg'}
            >
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
