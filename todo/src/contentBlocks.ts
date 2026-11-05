import type { TaskBlock, TaskImage, TaskSubtask } from './types'

export function newId(): string {
  return crypto.randomUUID()
}

export function emptyParagraph(): TaskBlock {
  return { id: newId(), type: 'p', text: '' }
}

export function ensureEditableBlocks(blocks: TaskBlock[]): TaskBlock[] {
  if (blocks.length === 0) return [emptyParagraph()]
  const last = blocks[blocks.length - 1]
  if (last.type !== 'p') return [...blocks, emptyParagraph()]
  return blocks
}

export function mapBlocks(raw: unknown): TaskBlock[] {
  if (!Array.isArray(raw)) return []
  const out: TaskBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const type = String(row.type ?? '')
    const id = String(row.id ?? newId())
    if (type === 'img') {
      const url = String(row.url ?? '').trim()
      if (!url) continue
      const block: TaskBlock = { id, type: 'img', url }
      if (row.name) block.name = String(row.name)
      if (row.path) block.path = String(row.path)
      out.push(block)
      continue
    }
    out.push({ id, type: 'p', text: String(row.text ?? '') })
  }
  return out
}

export function blocksFromLegacyNotes(
  notes: string | undefined,
  images: TaskImage[],
  notesBlocksRaw: unknown,
): TaskBlock[] {
  const existing = mapBlocks(notesBlocksRaw)
  if (existing.length > 0) return ensureEditableBlocks(existing)

  const blocks: TaskBlock[] = []
  const text = (notes ?? '').trim()
  if (text) blocks.push({ id: newId(), type: 'p', text })
  for (const img of images) {
    const block: TaskBlock = {
      id: img.id || newId(),
      type: 'img',
      url: img.url,
    }
    if (img.name) block.name = img.name
    if (img.path) block.path = img.path
    blocks.push(block)
  }
  return ensureEditableBlocks(blocks)
}

export function plainTextFromBlocks(blocks: TaskBlock[]): string {
  return blocks
    .filter((b): b is Extract<TaskBlock, { type: 'p' }> => b.type === 'p')
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function countImagesInBlocks(blocks: TaskBlock[]): number {
  return blocks.filter((b) => b.type === 'img').length
}

export function countTaskImages(
  notesBlocks: TaskBlock[],
  subtasks: TaskSubtask[],
): number {
  return (
    countImagesInBlocks(notesBlocks) +
    subtasks.reduce((n, s) => n + countImagesInBlocks(s.blocks ?? []), 0)
  )
}

export function mapSubtasks(raw: unknown): TaskSubtask[] {
  if (!Array.isArray(raw)) return []
  const out: TaskSubtask[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const title = String(row.title ?? '').trim()
    if (!title) continue
    out.push({
      id: String(row.id ?? newId()),
      title,
      done: Boolean(row.done),
      blocks: ensureEditableBlocks(mapBlocks(row.blocks)),
    })
  }
  return out
}
