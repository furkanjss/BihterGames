import type { GameArea, Priority } from './types'

/** Blind Taxi starter board — Notion board'dan */
export const BLIND_TAXI_TASKS: {
  title: string
  area: GameArea
  priority: Priority
}[] = [
  { title: 'Araba Modeli iç mekanlı', area: 'art', priority: 'high' },
  { title: 'Karakter Tasarımı', area: 'design', priority: 'high' },
  { title: 'Karakter Modelleme', area: 'art', priority: 'high' },
  { title: 'Minimap Tablet Modelleme', area: 'art', priority: 'medium' },
  { title: 'Şehir Paketi bulunacak', area: 'design', priority: 'medium' },
  { title: 'GDD', area: 'design', priority: 'high' },
  { title: 'Şehir Level Design', area: 'design', priority: 'high' },
  { title: 'Steam Capsule Art', area: 'art', priority: 'medium' },
  { title: 'Steam Sayfası Doldurma', area: 'marketing', priority: 'medium' },
]
