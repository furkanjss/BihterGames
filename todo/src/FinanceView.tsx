import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { convert, fetchRates, type RatesMap } from './rates'
import type {
  CurrencyCode,
  FinanceEntry,
  FinanceType,
  Project,
} from './types'
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  FINANCE_TYPES,
  PAYROLL_CATEGORIES,
} from './types'

function monthNow() {
  return new Date().toISOString().slice(0, 7)
}

function money(n: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n)
}

export function FinanceView({
  finance,
  projects,
  onAdd,
  onDelete,
}: {
  finance: FinanceEntry[]
  projects: Project[]
  onAdd: (input: {
    type: FinanceType
    label: string
    amount: number
    currency: CurrencyCode
    date: string
    category?: string
    recurring?: boolean
    projectId?: string
    notes?: string
  }) => void
  onDelete: (id: string) => void
}) {
  const [month, setMonth] = useState(monthNow)
  const [type, setType] = useState<FinanceType>('expense')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('TRY')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')

  const [base, setBase] = useState<CurrencyCode>('TRY')
  const [rates, setRates] = useState<RatesMap | null>(null)
  const [fxFrom, setFxFrom] = useState<CurrencyCode>('USD')
  const [fxTo, setFxTo] = useState<CurrencyCode>('TRY')
  const [fxAmount, setFxAmount] = useState('100')
  const [fxStatus, setFxStatus] = useState('Kurlar yükleniyor…')
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('TRY')

  useEffect(() => {
    let alive = true
    setFxStatus('Kurlar yükleniyor…')
    fetchRates(base)
      .then((res) => {
        if (!alive) return
        setRates(res.rates)
        const when = new Date(res.fetchedAt).toLocaleTimeString('tr-TR')
        setFxStatus(res.cached ? `Önbellek · ${when}` : `Canlı · ${when}`)
      })
      .catch(() => {
        if (!alive) return
        setFxStatus('Kur alınamadı — interneti kontrol et')
      })
    return () => {
      alive = false
    }
  }, [base])

  const monthEntries = useMemo(
    () => finance.filter((f) => f.month === month),
    [finance, month],
  )

  const summary = useMemo(() => {
    const zero = { income: 0, expense: 0, payroll: 0, budget: 0 }
    if (!rates) return { ...zero, net: 0, remaining: 0 }

    const sum = { ...zero }
    for (const e of monthEntries) {
      const tryAmount = convert(e.amount, e.currency, displayCurrency, rates, base)
      sum[e.type] += tryAmount
    }
    const outflow = sum.expense + sum.payroll
    return {
      ...sum,
      net: sum.income - outflow,
      remaining: sum.budget + sum.income - outflow,
    }
  }, [monthEntries, rates, displayCurrency, base])

  const categories =
    type === 'payroll'
      ? PAYROLL_CATEGORIES
      : type === 'expense'
        ? EXPENSE_CATEGORIES
        : type === 'income'
          ? ['Satış', 'Hibe', 'Yatırım', 'Diğer']
          : ['Bütçe']

  function submit(e: FormEvent) {
    e.preventDefault()
    onAdd({
      type,
      label,
      amount: Number(amount),
      currency,
      date,
      category: category || undefined,
      recurring,
      projectId: projectId || undefined,
      notes: notes || undefined,
    })
    setLabel('')
    setAmount('')
    setNotes('')
    setRecurring(false)
  }

  const fxResult =
    rates && Number(fxAmount)
      ? convert(Number(fxAmount), fxFrom, fxTo, rates, base)
      : null

  const typeLabel = (id: FinanceType) =>
    FINANCE_TYPES.find((t) => t.id === id)?.label ?? id

  return (
    <div className="fin">
      <section className="fin__fx panel">
        <div className="panel__head">
          <h2>Canlı kur</h2>
          <span className="muted">{fxStatus}</span>
        </div>
        <div className="fin__fx-grid">
          <label>
            Tutar
            <input
              type="number"
              min="0"
              step="0.01"
              value={fxAmount}
              onChange={(e) => setFxAmount(e.target.value)}
            />
          </label>
          <label>
            Kimden
            <select
              value={fxFrom}
              onChange={(e) => setFxFrom(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kime
            <select
              value={fxTo}
              onChange={(e) => setFxTo(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kur tabanı
            <select
              value={base}
              onChange={(e) => setBase(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="fin__fx-result">
          {fxResult == null
            ? '—'
            : `${fxAmount || 0} ${fxFrom} = ${money(fxResult, fxTo)}`}
        </p>
        {rates && (
          <div className="fin__rate-row">
            {CURRENCIES.filter((c) => c !== base).map((c) => (
              <span key={c}>
                1 {base} ≈ {rates[c]?.toFixed(4)} {c}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="fin__summary">
        <div className="fin__month">
          <label>
            Ay
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <label>
            Gösterim
            <select
              value={displayCurrency}
              onChange={(e) =>
                setDisplayCurrency(e.target.value as CurrencyCode)
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
        <div className="fin__cards">
          <article>
            <span>Bütçe girişi</span>
            <strong>{money(summary.budget, displayCurrency)}</strong>
          </article>
          <article>
            <span>Gelir</span>
            <strong>{money(summary.income, displayCurrency)}</strong>
          </article>
          <article>
            <span>Giderler</span>
            <strong>{money(summary.expense, displayCurrency)}</strong>
          </article>
          <article>
            <span>Personel</span>
            <strong>{money(summary.payroll, displayCurrency)}</strong>
          </article>
          <article className={summary.net >= 0 ? 'is-good' : 'is-bad'}>
            <span>Net</span>
            <strong>{money(summary.net, displayCurrency)}</strong>
          </article>
          <article className={summary.remaining >= 0 ? 'is-good' : 'is-bad'}>
            <span>Kalan</span>
            <strong>{money(summary.remaining, displayCurrency)}</strong>
          </article>
        </div>
      </section>

      <form className="composer panel" onSubmit={submit}>
        <h2>Kayıt ekle</h2>
        <div className="composer__row fin__form">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as FinanceType)
              setCategory('')
            }}
          >
            {FINANCE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Açıklama…"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Tutar"
            required
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Projesiz</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            Tekrarlayan
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not…"
          />
          <button type="submit" className="btn btn--lime">
            Ekle
          </button>
        </div>
      </form>

      <section className="panel">
        <div className="panel__head">
          <h2>Kayıtlar · {month}</h2>
        </div>
        <ul className="fin__list">
          {monthEntries.length === 0 && (
            <li className="tasks__empty">Bu ay kayıt yok.</li>
          )}
          {monthEntries.map((e) => (
            <li key={e.id} className={`fin__item type--${e.type}`}>
              <div>
                <p className="fin__label">
                  {e.label}
                  {e.recurring ? (
                    <span className="tag">Tekrarlayan</span>
                  ) : null}
                </p>
                <p className="muted">
                  {typeLabel(e.type)} · {e.category || '—'} · {e.date}
                  {e.projectId
                    ? ` · ${projects.find((p) => p.id === e.projectId)?.name ?? ''}`
                    : ''}
                </p>
              </div>
              <strong>
                {e.type === 'expense' || e.type === 'payroll' ? '−' : '+'}
                {money(e.amount, e.currency)}
              </strong>
              <button
                type="button"
                className="task__delete"
                onClick={() => onDelete(e.id)}
                aria-label="Kaydı sil"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
