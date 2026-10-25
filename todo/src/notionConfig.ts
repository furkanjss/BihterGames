export interface NotionConfig {
  token: string
  parentPageId: string
  tasksDbId: string
  projectsDbId: string
  financeDbId: string
  pageMap: Record<string, string>
  lastSyncAt?: string
}

const KEY = 'bihter-notion-config-v1'

export function loadNotionConfig(): NotionConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyConfig()
    const parsed = JSON.parse(raw) as Partial<NotionConfig>
    return {
      ...emptyConfig(),
      ...parsed,
      pageMap: parsed.pageMap ?? {},
    }
  } catch {
    return emptyConfig()
  }
}

export function saveNotionConfig(config: NotionConfig) {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function emptyConfig(): NotionConfig {
  return {
    token: '',
    parentPageId: '',
    tasksDbId: '',
    projectsDbId: '',
    financeDbId: '',
    pageMap: {},
  }
}

/** Notion page URL or raw UUID → dashed UUID */
export function normalizeNotionId(input: string): string {
  const trimmed = input.trim()
  const fromUrl = trimmed.match(
    /([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  )
  const id = (fromUrl?.[1] ?? trimmed).replace(/-/g, '')
  if (id.length !== 32) return trimmed
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}
