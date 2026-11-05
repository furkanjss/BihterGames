import { useRef, useState, type KeyboardEvent } from 'react'
import {
  emptyParagraph,
  ensureEditableBlocks,
  newId,
} from './contentBlocks'
import { removeTaskImageFile, uploadTaskImage } from './taskMedia'
import type { TaskBlock } from './types'

function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

export function ContentBlocksEditor({
  taskId,
  blocks,
  onChange,
  placeholder = 'Yazmaya başla…',
}: {
  taskId: string
  blocks: TaskBlock[]
  onChange: (next: TaskBlock[]) => void
  placeholder?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)

  const list = ensureEditableBlocks(blocks)

  function commit(next: TaskBlock[]) {
    onChange(ensureEditableBlocks(next))
  }

  function updateText(id: string, text: string) {
    commit(
      list.map((b) => (b.id === id && b.type === 'p' ? { ...b, text } : b)),
    )
  }

  function withImageAfter(
    current: TaskBlock[],
    afterId: string | null,
    image: Extract<TaskBlock, { type: 'img' }>,
  ): TaskBlock[] {
    const next = ensureEditableBlocks(current)
    let idx = afterId ? next.findIndex((b) => b.id === afterId) : next.length - 1
    if (idx < 0) idx = next.length - 1
    next.splice(idx + 1, 0, image, emptyParagraph())
    return ensureEditableBlocks(next)
  }

  async function onFiles(files: FileList | null, afterId: string | null) {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    try {
      let next = list
      let anchor = afterId
      for (const file of Array.from(files)) {
        const { image, error: err } = await uploadTaskImage(taskId, file)
        if (err || !image) {
          setError(err || 'Yükleme başarısız')
          continue
        }
        const block: Extract<TaskBlock, { type: 'img' }> = {
          id: image.id,
          type: 'img',
          url: image.url,
          name: image.name,
          path: image.path,
        }
        next = withImageAfter(next, anchor, block)
        anchor = block.id
      }
      commit(next)
      setFocusId(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function addUrlImage() {
    const url = normalizeUrl(urlDraft)
    if (!url) return
    commit(
      withImageAfter(list, focusId, {
        id: newId(),
        type: 'img',
        url,
        name: 'Link',
      }),
    )
    setUrlDraft('')
    setShowUrl(false)
    setFocusId(null)
  }

  async function removeBlock(id: string) {
    const block = list.find((b) => b.id === id)
    const next = list.filter((b) => b.id !== id)
    commit(next.length ? next : [emptyParagraph()])
    if (block?.type === 'img' && block.path) {
      await removeTaskImageFile(block.path)
    }
  }

  function onTextKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, id: string) {
    if (e.key !== 'Enter' || e.shiftKey) return
    e.preventDefault()
    const idx = list.findIndex((b) => b.id === id)
    if (idx < 0) return
    const fresh = emptyParagraph()
    const next = [...list]
    next.splice(idx + 1, 0, fresh)
    commit(next)
    setFocusId(fresh.id)
  }

  return (
    <div className="blocks">
      <div className="blocks__stream">
        {list.map((block, i) => {
          if (block.type === 'img') {
            return (
              <figure key={block.id} className="blocks__img">
                <a href={block.url} target="_blank" rel="noreferrer">
                  <img src={block.url} alt={block.name || 'Görsel'} />
                </a>
                <button
                  type="button"
                  className="blocks__img-x"
                  onClick={() => void removeBlock(block.id)}
                  aria-label="Görseli kaldır"
                >
                  ×
                </button>
              </figure>
            )
          }
          const isFirstText = list.findIndex((b) => b.type === 'p') === i
          return (
            <textarea
              key={block.id}
              className="blocks__p"
              value={block.text}
              placeholder={isFirstText ? placeholder : '…'}
              rows={Math.min(8, Math.max(2, block.text.split('\n').length + 1))}
              autoFocus={focusId === block.id}
              onFocus={() => setFocusId(block.id)}
              onChange={(e) => updateText(block.id, e.target.value)}
              onKeyDown={(e) => onTextKeyDown(e, block.id)}
            />
          )
        })}
      </div>

      <div className="blocks__toolbar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files, focusId)}
        />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Yükleniyor…' : 'Resim ekle'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setShowUrl((v) => !v)}
        >
          URL
        </button>
        {showUrl && (
          <div className="blocks__url">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://…"
            />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!urlDraft.trim()}
              onClick={addUrlImage}
            >
              Ekle
            </button>
          </div>
        )}
      </div>
      {error && <p className="blocks__error">{error}</p>}
    </div>
  )
}
