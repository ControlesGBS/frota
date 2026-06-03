import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [condutor, setCondutor]   = useState(null)
  const [loading, setLoading]     = useState(true)

  async function loadCondutor(email) {
    const { data } = await supabase
      .from('condutores')
      .select('*')
      .eq('email', email)
      .single()
    setCondutor(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) loadCondutor(session.user.email)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.email) loadCondutor(session.user.email)
      else { setCondutor(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (condutor !== undefined) setLoading(false)
  }, [condutor])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = condutor?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, condutor, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
