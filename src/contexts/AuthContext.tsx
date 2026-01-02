import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types'

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, fullName?: string) => Promise<string | null>
  signOut: () => Promise<string | null>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

const applyAccessibilityPrefs = (profile: Profile | null) => {
  const root = document.documentElement
  const scale = profile?.font_scale ? profile.font_scale / 100 : 1
  const contrast = profile?.high_contrast ? 'high' : 'normal'
  const motion = profile?.reduce_motion ? 'reduced' : 'normal'
  const colorBlindness = profile?.color_blindness ?? 'none'
  const contentMagnifier = profile?.content_magnifier_enabled ? 'on' : 'off'
  const linkHighlight = profile?.link_highlight_enabled ? 'highlight' : 'normal'
  const letterSpacing = profile?.letter_spacing ?? 0
  const lineSpacing = profile?.line_spacing ?? 1.4
  root.style.setProperty('--font-scale', String(scale))
  root.style.setProperty('--letter-spacing', `${letterSpacing}em`)
  root.style.setProperty('--line-height', String(lineSpacing))
  root.dataset.contrast = contrast
  root.dataset.motion = motion
  root.dataset.colorblind = colorBlindness
  root.dataset.contentmagnifier = contentMagnifier
  root.dataset.links = linkHighlight
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, font_scale, high_contrast, reduce_motion, screen_reader_enabled, content_magnifier_enabled, link_highlight_enabled, letter_spacing, line_spacing, color_blindness, role')
      .eq('id', userId)
      .single()

    if (error) {
      return
    }
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    await fetchProfile(user.id)
  }, [fetchProfile, user])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return 'Usuario nao autenticado.'

      const { data, error } = await supabase.from('profiles')
        .update({
          full_name: updates.full_name ?? profile?.full_name ?? null,
          font_scale: updates.font_scale ?? profile?.font_scale ?? 100,
          high_contrast: updates.high_contrast ?? profile?.high_contrast ?? false,
          reduce_motion: updates.reduce_motion ?? profile?.reduce_motion ?? false,
          screen_reader_enabled: updates.screen_reader_enabled ?? profile?.screen_reader_enabled ?? false,
          content_magnifier_enabled: updates.content_magnifier_enabled ?? profile?.content_magnifier_enabled ?? false,
          link_highlight_enabled: updates.link_highlight_enabled ?? profile?.link_highlight_enabled ?? false,
          letter_spacing: updates.letter_spacing ?? profile?.letter_spacing ?? 0,
          line_spacing: updates.line_spacing ?? profile?.line_spacing ?? 1.4,
          color_blindness: updates.color_blindness ?? profile?.color_blindness ?? 'none',
        })
        .eq('id', user.id)
        .select('id, full_name, font_scale, high_contrast, reduce_motion, screen_reader_enabled, content_magnifier_enabled, link_highlight_enabled, letter_spacing, line_spacing, color_blindness, role')
        .single()

      if (error) {
        return error.message
      }
      setProfile(data)
      return null
    },
    [profile, user],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const cleanName = fullName?.trim()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: cleanName ? { data: { full_name: cleanName } } : undefined,
    })
    return error ? error.message : null
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    return error ? error.message : null
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchProfile(user.id)
  }, [fetchProfile, user])

  useEffect(() => {
    applyAccessibilityPrefs(profile)
  }, [profile])

  const value = useMemo(
    () => ({session, user, profile, loading, signIn, signUp, signOut, refreshProfile, updateProfile}),
    [session, user, profile, loading, signIn, signUp, signOut, refreshProfile, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
