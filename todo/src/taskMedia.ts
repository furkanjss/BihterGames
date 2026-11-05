import { supabase } from './supabase'
import type { TaskImage } from './types'

const BUCKET = 'task-images'
const MAX_BYTES = 6 * 1024 * 1024
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jpg',
])

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'image'
}

export async function uploadTaskImage(
  taskId: string,
  file: File,
): Promise<{ image?: TaskImage; error?: string }> {
  if (!supabase) return { error: 'Supabase yok.' }
  if (!ALLOWED.has(file.type)) {
    return { error: 'Sadece görsel dosyası (jpg, png, webp, gif).' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Dosya 6MB’dan büyük olamaz.' }
  }

  const id = crypto.randomUUID()
  const path = `${taskId}/${id}-${safeName(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return {
    image: {
      id,
      url: data.publicUrl,
      name: file.name,
      path,
    },
  }
}

export async function removeTaskImageFile(
  path: string | undefined,
): Promise<void> {
  if (!supabase || !path) return
  await supabase.storage.from(BUCKET).remove([path])
}
