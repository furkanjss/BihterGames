import { useState, type FormEvent } from 'react'

export function LoginView({
  configured,
  error,
  onSubmit,
}: {
  configured: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<boolean>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handle(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSubmit(email.trim(), password)
    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login__card">
        <img
          src={`${import.meta.env.BASE_URL}logos/logo-lime.png`}
          alt="bihter GAMES"
          width={88}
          height={94}
        />
        <h1>Studio Hub</h1>
        <p className="login__lede">
          Bihter Games iç stüdyo paneli — sadece davetli ekip.
        </p>

        {!configured ? (
          <p className="login__error">
            Supabase yapılandırılmamış. Vercel / <code>.env.local</code> içine{' '}
            <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            ekle; SQL şemasını Supabase’te çalıştır.
          </p>
        ) : (
          <form className="login__form" onSubmit={handle}>
            <label>
              E-posta
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Şifre
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="login__error">{error}</p>}
            <button type="submit" className="btn btn--lime" disabled={busy}>
              {busy ? 'Giriş…' : 'Giriş yap'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
