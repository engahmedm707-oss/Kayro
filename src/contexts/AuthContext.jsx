import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return null }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
    return data || null
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      fetchProfile(data.session?.user?.id).finally(() => mounted && setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      fetchProfile(sess?.user?.id)
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signUp = (email, password, meta = {}) => supabase.auth.signUp({ email, password, options: { data: meta } })
  const signOut = () => supabase.auth.signOut()

  const value = { session, user: session?.user, profile, role: profile?.role, loading, signIn, signUp, signOut, refreshProfile: () => fetchProfile(session?.user?.id) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
