import { useEffect, useState } from 'react'
import {
  brandNotionPage,
  discoverNotionDatabases,
  pushToNotion,
  setupNotionDatabases,
  testNotionConnection,
} from './notion'
import {
  loadNotionConfig,
  normalizeNotionId,
  saveNotionConfig,
  type NotionConfig,
} from './notionConfig'
import type { FinanceEntry, Project, Task } from './types'

export function NotionView({
  projects,
  tasks,
  finance,
}: {
  projects: Project[]
  tasks: Task[]
  finance: FinanceEntry[]
}) {
  const [config, setConfig] = useState<NotionConfig>(() => {
    const saved = loadNotionConfig()
    const envToken = import.meta.env.VITE_NOTION_TOKEN as string | undefined
    if (!saved.token && envToken) {
      const next = { ...saved, token: envToken }
      saveNotionConfig(next)
      return next
    }
    return saved
  })
  const [token, setToken] = useState('')
  const [pageId, setPageId] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setToken(config.token)
    setPageId(config.parentPageId)
  }, [config.token, config.parentPageId])

  function persist(next: NotionConfig) {
    saveNotionConfig(next)
    setConfig(next)
  }

  async function saveCredentials() {
    const next = {
      ...config,
      token: token.trim(),
      parentPageId: normalizeNotionId(pageId),
    }
    persist(next)
    setStatus('Ayarlar kaydedildi.')
  }

  async function handleTest() {
    setBusy(true)
    setStatus('Bağlantı test ediliyor…')
    try {
      await saveCredentials()
      const me = await testNotionConnection(token.trim())
      const name =
        typeof me.name === 'string'
          ? me.name
          : ((me as { bot?: { owner?: { user?: { name?: string } } } }).bot
              ?.owner?.user?.name ?? 'bot')
      setStatus(`Bağlantı OK · ${name}`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Bağlantı başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function handleSetup() {
    setBusy(true)
    setStatus('Notion markalanıyor + veritabanları kuruluyor…')
    try {
      const base = {
        ...config,
        token: token.trim(),
        parentPageId: normalizeNotionId(pageId),
      }
      const next = await setupNotionDatabases(base)
      persist(next)
      setStatus(
        'Hazır: kapak/ikon + Projeler, Görevler, Muhasebe tabloları. Notion sayfanı yenile.',
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Kurulum başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function handleBrand() {
    setBusy(true)
    setStatus('Notion sayfası Bihter gibi düzenleniyor…')
    try {
      let base = {
        ...config,
        token: token.trim(),
        parentPageId: normalizeNotionId(pageId),
      }
      base = await discoverNotionDatabases(base)
      persist(base)
      await brandNotionPage(base)
      setStatus(
        'Sayfa güncellendi: kapak, ikon, yeşil başlıklar/callout. Notion’da yenile (F5).',
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Düzenleme başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function handlePush() {
    setBusy(true)
    setStatus('Studio → Notion senkronize ediliyor…')
    try {
      let base = {
        ...config,
        token: token.trim(),
        parentPageId: normalizeNotionId(pageId),
      }
      if (!base.tasksDbId || !base.projectsDbId || !base.financeDbId) {
        base = await discoverNotionDatabases(base)
      }
      const next = await pushToNotion(base, { projects, tasks, finance })
      persist(next)
      setStatus(
        `Gönderildi: ${projects.length} proje, ${tasks.length} görev, ${finance.length} muhasebe kaydı. Notion’da F5.`,
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Senkron başarısız')
    } finally {
      setBusy(false)
    }
  }

  const ready =
    !!config.token &&
    !!config.parentPageId &&
    !!config.tasksDbId &&
    !!config.projectsDbId &&
    !!config.financeDbId

  return (
    <div className="notion">
      <section className="panel">
        <div className="panel__head">
          <h2>Notion bağlantısı</h2>
          {config.lastSyncAt && (
            <span className="muted">
              Son sync:{' '}
              {new Date(config.lastSyncAt).toLocaleString('tr-TR')}
            </span>
          )}
        </div>

        <ol className="notion__steps">
          <li>
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
            >
              notion.so/my-integrations
            </a>{' '}
            adresinden yeni bir integration oluştur.
          </li>
          <li>
            Secret token’ı kopyala. Notion’da bir sayfa aç, sağ üst{' '}
            <strong>⋯ → Connections</strong> ile integration’ı bağla.
          </li>
          <li>
            Sayfa linkini yapıştır (veya sayfa ID). Sonra veritabanlarını kur ve
            senkronize et.
          </li>
        </ol>

        <div className="notion__form">
          <label>
            Integration token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_…"
              autoComplete="off"
            />
          </label>
          <label>
            Notion sayfa URL / ID
            <input
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="https://www.notion.so/… veya UUID"
            />
          </label>
        </div>

        <div className="notion__actions">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || !token.trim()}
            onClick={handleTest}
          >
            Bağlantıyı test et
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || !token.trim() || !pageId.trim()}
            onClick={saveCredentials}
          >
            Kaydet
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || !token.trim() || !pageId.trim()}
            onClick={handleBrand}
          >
            Notion’u Bihter gibi yap
          </button>
          <button
            type="button"
            className="btn btn--lime"
            disabled={busy || !token.trim() || !pageId.trim()}
            onClick={handleSetup}
          >
            Veritabanlarını kur
          </button>
          <button
            type="button"
            className="btn btn--lime"
            disabled={busy || !ready}
            onClick={handlePush}
          >
            Studio → Notion gönder
          </button>
        </div>

        <p className="muted">
          Notion’un kendi teması değişmez; ama sayfaya koyu kapak, yeşil
          callout, emoji ikonlar ve renkli select’ler ekliyoruz — Studio’ya
          yakın bir hub görünümü. Tablolarda elle Board / Calendar view de
          açabilirsin.
        </p>

        {status && <p className="notion__status">{status}</p>}
      </section>

      <section className="panel">
        <h2>Durum</h2>
        <ul className="notion__status-list">
          <li>
            Token: {config.token ? 'kayıtlı' : 'yok'}
          </li>
          <li>
            Sayfa: {config.parentPageId ? 'kayıtlı' : 'yok'}
          </li>
          <li>
            Projeler DB: {config.projectsDbId ? 'hazır' : 'kurulmadı'}
          </li>
          <li>
            Görevler DB: {config.tasksDbId ? 'hazır' : 'kurulmadı'}
          </li>
          <li>
            Muhasebe DB: {config.financeDbId ? 'hazır' : 'kurulmadı'}
          </li>
          <li>
            Eşleşen sayfa: {Object.keys(config.pageMap).length}
          </li>
        </ul>
        <p className="muted">
          Not: Bu lokal uygulama Notion’a Vite proxy ile bağlanır. Studio
          kısayolu / <code>npm run todo</code> ile açman gerekir (düz HTML
          dosyası yeterli değil). Token tarayıcında saklanır — sadece kendi
          bilgisayarında kullan.
        </p>
      </section>
    </div>
  )
}
