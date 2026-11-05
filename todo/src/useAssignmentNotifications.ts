import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task } from './types'

type Store = {
  seeded: boolean
  seenTaskIds: string[]
}

function storageKey(userId: string) {
  return `bihter.assignmentNotifs.v1:${userId}`
}

function readStore(userId: string): Store {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { seeded: false, seenTaskIds: [] }
    const parsed = JSON.parse(raw) as Partial<Store>
    return {
      seeded: Boolean(parsed.seeded),
      seenTaskIds: Array.isArray(parsed.seenTaskIds)
        ? parsed.seenTaskIds.map(String)
        : [],
    }
  } catch {
    return { seeded: false, seenTaskIds: [] }
  }
}

function writeStore(userId: string, store: Store) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store))
}

/**
 * First visit after feature: seed all currently assigned tasks as already-seen
 * so only later new assignments create notifications. Each taskId notifies once.
 */
export function useAssignmentNotifications(
  userId: string | undefined,
  tasks: Task[],
  tasksReady: boolean,
) {
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    if (!userId || !tasksReady) {
      setReady(false)
      setSeenIds([])
      setBannerDismissed(false)
      return
    }

    const store = readStore(userId)
    if (!store.seeded) {
      const mine = tasks
        .filter((t) => t.assigneeId === userId)
        .map((t) => t.id)
      const next: Store = { seeded: true, seenTaskIds: mine }
      writeStore(userId, next)
      setSeenIds(mine)
    } else {
      setSeenIds(store.seenTaskIds)
    }
    setReady(true)
    setBannerDismissed(false)
  }, [userId, tasksReady])

  const unread = useMemo(() => {
    if (!userId || !ready) return []
    const seen = new Set(seenIds)
    return tasks.filter(
      (t) =>
        t.assigneeId === userId &&
        t.status !== 'done' &&
        !seen.has(t.id),
    )
  }, [tasks, userId, seenIds, ready])

  const markSeen = useCallback(
    (taskIds: string[]) => {
      if (!userId || taskIds.length === 0) return
      setSeenIds((prev) => {
        const set = new Set(prev)
        for (const id of taskIds) set.add(id)
        const next = Array.from(set)
        writeStore(userId, { seeded: true, seenTaskIds: next })
        return next
      })
    },
    [userId],
  )

  const markAllSeen = useCallback(() => {
    markSeen(unread.map((t) => t.id))
    setBannerDismissed(true)
  }, [markSeen, unread])

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
  }, [])

  return {
    ready,
    unread,
    count: unread.length,
    showBanner: ready && unread.length > 0 && !bannerDismissed,
    markSeen,
    markAllSeen,
    dismissBanner,
  }
}
