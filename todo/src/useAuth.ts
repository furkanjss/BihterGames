import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { mapProfile } from './mappers'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Profile } from './types'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (user: User) => {
    if (!supabase) return
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (err) {
      setError(err.message)
      return
    }
    if (data) {
      setProfile(mapProfile(data as Record<string, unknown>))
      return
    }
    const display =
      (user.user_metadata?.display_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Member'
    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: display, role: 'member' })
      .select('*')
      .single()
    if (createErr) {
      setError(createErr.message)
      return
    }
    setProfile(mapProfile(created as Record<string, unknown>))
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (data.session?.user) {
        void loadProfile(data.session.user).finally(() => {
          if (alive) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) {
        void loadProfile(next.user)
      } else {
        setProfile(null)
      }
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setError('Supabase yapılandırılmadı.')
      return false
    }
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) {
        const msg = err.message || 'Giriş başarısız'
        if (/failed to fetch|networkerror|fetch/i.test(msg)) {
          setError(
            'Supabase’e ulaşılamadı. Project URL + anon (eyJ…) key doğru mu? Proje pause’ta mı? Auth → URL’lerde bihtergames.com var mı?',
          )
        } else {
          setError(msg)
        }
        return false
      }
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
      setError(
        /failed to fetch|networkerror/i.test(msg)
          ? 'Supabase’e ulaşılamadı (Failed to fetch). Dashboard’da proje açık mı, API URL/anon key doğru mu kontrol et.'
          : msg,
      )
      return false
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return {
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    setError,
    signIn,
    signOut,
  }
}
