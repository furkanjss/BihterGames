import {
  normalizeNotionId,
  type NotionConfig,
} from './notionConfig'
import type { FinanceEntry, Project, Task } from './types'
import {
  FINANCE_TYPES,
  GAME_AREAS,
  PERSONAL_AREA,
  PRIORITIES,
  PROJECT_STATUSES,
} from './types'

const NOTION_VERSION = '2022-06-28'

/** Dark / neon gaming cover — Notion must fetch a public URL */
const COVER_URL =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'

type Json = Record<string, unknown>

async function notionFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Json> {
  const res = await fetch(`/api/notion${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const data = (await res.json().catch(() => ({}))) as Json
  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : `Notion hatası (${res.status})`
    throw new Error(msg)
  }
  return data
}

function text(content: string, bold = false) {
  return {
    type: 'text',
    text: { content: content.slice(0, 2000) },
    annotations: bold ? { bold: true } : undefined,
  }
}

function titleProp(value: string) {
  return {
    title: [{ type: 'text', text: { content: value.slice(0, 2000) } }],
  }
}

function rich(value: string) {
  return {
    rich_text: [{ type: 'text', text: { content: value.slice(0, 2000) } }],
  }
}

function select(name: string) {
  return { select: { name } }
}

function checkbox(checked: boolean) {
  return { checkbox: checked }
}

function dateProp(iso?: string) {
  return { date: iso ? { start: iso } : null }
}

function numberProp(n?: number) {
  return { number: n ?? null }
}

function heading2(content: string, color = 'green') {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [text(content, true)],
      color,
    },
  }
}

function paragraph(content: string, color = 'default') {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [text(content)],
      color,
    },
  }
}

function callout(content: string, emoji: string, color = 'green_background') {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [text(content)],
      icon: { type: 'emoji', emoji },
      color,
    },
  }
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} }
}

function bulleted(content: string) {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [text(content)],
    },
  }
}

export async function testNotionConnection(token: string) {
  return notionFetch(token, '/v1/users/me')
}

/** Sayfadaki mevcut Bihter tablolarını bul */
export async function discoverNotionDatabases(
  config: NotionConfig,
): Promise<NotionConfig> {
  const token = config.token.trim()
  const parent = normalizeNotionId(config.parentPageId)
  if (!token || !parent) throw new Error('Token ve Notion sayfa ID gerekli')

  const next = { ...config, token, parentPageId: parent, pageMap: { ...config.pageMap } }
  let cursor: string | undefined
  const found: { id: string; title: string }[] = []

  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=50` : '?page_size=50'
    const list = await notionFetch(token, `/v1/blocks/${parent}/children${q}`)
    const results = (list.results as Json[]) ?? []
    for (const block of results) {
      if (block.type === 'child_database') {
        const title =
          ((block.child_database as Json | undefined)?.title as string) ?? ''
        found.push({ id: String(block.id), title })
      }
    }
    cursor = list.has_more ? String(list.next_cursor) : undefined
  } while (cursor)

  for (const db of found) {
    const t = db.title.toLowerCase()
    if (!next.projectsDbId && t.includes('proje')) next.projectsDbId = db.id
    if (!next.tasksDbId && (t.includes('görev') || t.includes('gorev')))
      next.tasksDbId = db.id
    if (!next.financeDbId && t.includes('muhasebe')) next.financeDbId = db.id
  }

  return next
}

/** Kapak, ikon, markalı başlık + intro — Studio hissi */
export async function brandNotionPage(config: NotionConfig): Promise<void> {
  const token = config.token.trim()
  const parent = normalizeNotionId(config.parentPageId)
  if (!token || !parent) throw new Error('Token ve Notion sayfa ID gerekli')

  await notionFetch(token, `/v1/pages/${parent}`, {
    method: 'PATCH',
    body: JSON.stringify({
      icon: { type: 'emoji', emoji: '🎮' },
      cover: {
        type: 'external',
        external: { url: COVER_URL },
      },
      properties: {
        title: titleProp('bihter GAMES · Studio'),
      },
    }),
  })

  // Notion Append Block Children = PATCH (POST Invalid request URL döner)
  await notionFetch(token, `/v1/blocks/${parent}/children`, {
    method: 'PATCH',
    body: JSON.stringify({
      children: [
        callout(
          'Bihter Games Studio hub — görevler, takvim ve muhasebe buraya senkronlanır. Görünüm: koyu kapak + yeşil vurgular.',
          '🟢',
          'green_background',
        ),
        paragraph(
          'Lokal Studio uygulamasından “Studio → Notion gönder” ile güncelle. Bu sayfa stüdyo kontrol paneli gibi kullan.',
        ),
        divider(),
        heading2('🎯 Projeler'),
        paragraph('Oyun ve kişisel projeler · status, motor, platform, bütçe'),
        heading2('✅ Görevler'),
        paragraph('Alan · öncelik · son tarih — takvimle birlikte takip et'),
        heading2('💸 Muhasebe'),
        paragraph('Bütçe, gelir, gider, personel · TRY / USD / EUR / GBP'),
        divider(),
        heading2('Nasıl kullanılır'),
        bulleted('Aşağıdaki tablolara satır ekleyebilir veya Studio’dan sync edebilirsin'),
        bulleted('Görevlerde “Son tarih” doldur → Notion takvim görünümü aç'),
        bulleted('Muhasebede Tip + Para birimi ile filtrele'),
        callout(
          'İpucu: Her tabloda ••• → Layout / Views ile Board, Calendar veya Gallery ekle — Studio’daki sekmeler gibi hisseder.',
          '💡',
          'gray_background',
        ),
      ],
    }),
  })
}

export async function setupNotionDatabases(
  config: NotionConfig,
): Promise<NotionConfig> {
  const token = config.token.trim()
  const parent = normalizeNotionId(config.parentPageId)
  if (!token || !parent) {
    throw new Error('Token ve Notion sayfa ID gerekli')
  }

  const next: NotionConfig = {
    ...config,
    token,
    parentPageId: parent,
    pageMap: { ...config.pageMap },
  }

  // Önce sayfayı Bihter gibi giydir
  try {
    await brandNotionPage(next)
  } catch {
    // title property adı farklı workspace'lerde değişebilir; DB kurulumuna devam
    await notionFetch(token, `/v1/pages/${parent}`, {
      method: 'PATCH',
      body: JSON.stringify({
        icon: { type: 'emoji', emoji: '🎮' },
        cover: {
          type: 'external',
          external: { url: COVER_URL },
        },
      }),
    }).catch(() => undefined)
  }

  if (!next.projectsDbId) {
    const db = await notionFetch(token, '/v1/databases', {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parent },
        icon: { type: 'emoji', emoji: '🎯' },
        title: [{ type: 'text', text: { content: 'Bihter · Projeler' } }],
        properties: {
          Ad: { title: {} },
          'Studio ID': { rich_text: {} },
          Tür: {
            select: {
              options: [
                { name: 'Oyun', color: 'green' },
                { name: 'Kişisel', color: 'blue' },
              ],
            },
          },
          Durum: {
            select: {
              options: [
                { name: 'Fikir', color: 'purple' },
                { name: 'Ön prodüksiyon', color: 'yellow' },
                { name: 'Prodüksiyon', color: 'green' },
                { name: 'Cilalama', color: 'orange' },
                { name: 'Yayında', color: 'blue' },
                { name: 'Beklemede', color: 'gray' },
              ],
            },
          },
          Motor: { rich_text: {} },
          Genre: { rich_text: {} },
          Platformlar: { rich_text: {} },
          Açıklama: { rich_text: {} },
          Başlangıç: { date: {} },
          Hedef: { date: {} },
          Bütçe: { number: { format: 'number' } },
          'Para birimi': {
            select: {
              options: [
                { name: 'TRY', color: 'green' },
                { name: 'USD', color: 'blue' },
                { name: 'EUR', color: 'purple' },
                { name: 'GBP', color: 'yellow' },
              ],
            },
          },
        },
      }),
    })
    next.projectsDbId = String(db.id)
  }

  if (!next.tasksDbId) {
    const areaColors = [
      'green',
      'blue',
      'purple',
      'pink',
      'yellow',
      'orange',
      'red',
      'brown',
      'gray',
    ] as const
    const areas = [...GAME_AREAS, PERSONAL_AREA].map((a, i) => ({
      name: a.label,
      color: areaColors[i % areaColors.length],
    }))
    const db = await notionFetch(token, '/v1/databases', {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parent },
        icon: { type: 'emoji', emoji: '✅' },
        title: [{ type: 'text', text: { content: 'Bihter · Görevler' } }],
        properties: {
          Ad: { title: {} },
          'Studio ID': { rich_text: {} },
          Bitti: { checkbox: {} },
          Alan: { select: { options: areas } },
          Öncelik: {
            select: {
              options: [
                { name: 'Yüksek', color: 'red' },
                { name: 'Orta', color: 'yellow' },
                { name: 'Düşük', color: 'blue' },
              ],
            },
          },
          'Son tarih': { date: {} },
          Proje: { rich_text: {} },
          'Proje ID': { rich_text: {} },
        },
      }),
    })
    next.tasksDbId = String(db.id)
  }

  if (!next.financeDbId) {
    const db = await notionFetch(token, '/v1/databases', {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parent },
        icon: { type: 'emoji', emoji: '💸' },
        title: [{ type: 'text', text: { content: 'Bihter · Muhasebe' } }],
        properties: {
          Ad: { title: {} },
          'Studio ID': { rich_text: {} },
          Tip: {
            select: {
              options: [
                { name: 'Gelir', color: 'green' },
                { name: 'Gider', color: 'red' },
                { name: 'Maaş / personel', color: 'orange' },
                { name: 'Bütçe girişi', color: 'blue' },
              ],
            },
          },
          Tutar: { number: { format: 'number_with_commas' } },
          'Para birimi': {
            select: {
              options: [
                { name: 'TRY', color: 'green' },
                { name: 'USD', color: 'blue' },
                { name: 'EUR', color: 'purple' },
                { name: 'GBP', color: 'yellow' },
              ],
            },
          },
          Tarih: { date: {} },
          Kategori: { rich_text: {} },
          Tekrarlayan: { checkbox: {} },
          Proje: { rich_text: {} },
          Not: { rich_text: {} },
        },
      }),
    })
    next.financeDbId = String(db.id)
  }

  return next
}

async function upsertPage(
  token: string,
  databaseId: string,
  localId: string,
  pageMap: Record<string, string>,
  properties: Json,
  icon?: { type: 'emoji'; emoji: string },
) {
  const existing = pageMap[localId]
  if (existing) {
    await notionFetch(token, `/v1/pages/${existing}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties, ...(icon ? { icon } : {}) }),
    })
    return existing
  }

  const created = await notionFetch(token, '/v1/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
      ...(icon ? { icon } : {}),
    }),
  })
  const id = String(created.id)
  pageMap[localId] = id
  return id
}

export async function pushToNotion(
  config: NotionConfig,
  data: { projects: Project[]; tasks: Task[]; finance: FinanceEntry[] },
): Promise<NotionConfig> {
  if (
    !config.token ||
    !config.tasksDbId ||
    !config.projectsDbId ||
    !config.financeDbId
  ) {
    throw new Error('Önce Notion veritabanlarını kur')
  }

  const token = config.token.trim()
  const pageMap = { ...config.pageMap }
  const projectName = (id: string) =>
    data.projects.find((p) => p.id === id)?.name ?? ''

  for (const p of data.projects) {
    const status =
      PROJECT_STATUSES.find((s) => s.id === p.status)?.label ?? 'Fikir'
    await upsertPage(
      token,
      config.projectsDbId,
      p.id,
      pageMap,
      {
        Ad: titleProp(p.name),
        'Studio ID': rich(p.id),
        Tür: select(p.kind === 'game' ? 'Oyun' : 'Kişisel'),
        Durum: select(status),
        Motor: rich(p.engine ?? ''),
        Genre: rich(p.genre ?? ''),
        Platformlar: rich((p.platforms ?? []).join(', ')),
        Açıklama: rich(p.description ?? ''),
        Başlangıç: dateProp(p.startDate),
        Hedef: dateProp(p.targetDate),
        Bütçe: numberProp(p.budgetAmount),
        'Para birimi': p.budgetCurrency
          ? select(p.budgetCurrency)
          : { select: null },
      },
      { type: 'emoji', emoji: p.kind === 'game' ? '🎮' : '📌' },
    )
  }

  for (const t of data.tasks) {
    const area =
      [...GAME_AREAS, PERSONAL_AREA].find((a) => a.id === t.area)?.label ??
      t.area
    const priority =
      PRIORITIES.find((p) => p.id === t.priority)?.label ?? t.priority
    await upsertPage(
      token,
      config.tasksDbId,
      t.id,
      pageMap,
      {
        Ad: titleProp(t.title),
        'Studio ID': rich(t.id),
        Bitti: checkbox(t.done),
        Alan: select(area),
        Öncelik: select(priority),
        'Son tarih': dateProp(t.dueDate),
        Proje: rich(projectName(t.projectId)),
        'Proje ID': rich(t.projectId),
      },
      {
        type: 'emoji',
        emoji: t.done ? '✔️' : t.priority === 'high' ? '🔥' : '⬜',
      },
    )
  }

  for (const f of data.finance) {
    const tip = FINANCE_TYPES.find((x) => x.id === f.type)?.label ?? f.type
    const emoji =
      f.type === 'income' || f.type === 'budget'
        ? '🟢'
        : f.type === 'payroll'
          ? '👤'
          : '🔴'
    await upsertPage(
      token,
      config.financeDbId,
      f.id,
      pageMap,
      {
        Ad: titleProp(f.label),
        'Studio ID': rich(f.id),
        Tip: select(tip),
        Tutar: numberProp(f.amount),
        'Para birimi': select(f.currency),
        Tarih: dateProp(f.date),
        Kategori: rich(f.category ?? ''),
        Tekrarlayan: checkbox(!!f.recurring),
        Proje: rich(f.projectId ? projectName(f.projectId) : ''),
        Not: rich(f.notes ?? ''),
      },
      { type: 'emoji', emoji },
    )
  }

  return {
    ...config,
    pageMap,
    lastSyncAt: new Date().toISOString(),
  }
}
