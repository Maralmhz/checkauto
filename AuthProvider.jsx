import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

/**
 * AuthProvider para proteger rotas com Supabase sem loop infinito de redirect.
 *
 * Uso:
 * <AuthProvider>
 *   {(session) => (session ? <App /> : <Login />)}
 * </AuthProvider>
 */
export default function AuthProvider({
  children,
  loadingFallback = <div>Carregando sessão...</div>,
  errorFallback,
  requireUsuario = true
}) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const safeSetState = (updater) => {
    if (!mountedRef.current) return
    updater()
  }

  const validateUsuario = async (candidateSession) => {
    if (!candidateSession || !candidateSession.user) return null

    if (!requireUsuario) return candidateSession

    const userId = candidateSession.user.id

    const { data, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      throw new Error(`Erro ao validar usuário na tabela usuarios: ${userError.message}`)
    }

    if (!data) {
      await supabase.auth.signOut()
      return null
    }

    return candidateSession
  }

  useEffect(() => {
    mountedRef.current = true

    const syncSession = async (currentSession) => {
      try {
        const validSession = await validateUsuario(currentSession)
        safeSetState(() => {
          setSession(validSession)
          setError(null)
          setLoading(false)
        })
      } catch (err) {
        console.error('[AuthProvider] Falha ao sincronizar sessão:', err)
        safeSetState(() => {
          setSession(null)
          setError(err)
          setLoading(false)
        })
      }
    }

    let subscription

    const bootstrap = async () => {
      setLoading(true)

      try {
        const {
          data: { session: initialSession },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(`Erro ao buscar sessão atual: ${sessionError.message}`)
        }

        await syncSession(initialSession)

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          // Evita redirect dentro do listener para não causar loops.
          void syncSession(nextSession)
        })

        subscription = data.subscription
      } catch (err) {
        console.error('[AuthProvider] Erro no bootstrap de autenticação:', err)
        safeSetState(() => {
          setSession(null)
          setError(err)
          setLoading(false)
        })
      }
    }

    void bootstrap()

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [requireUsuario])

  if (loading) return loadingFallback

  if (error) {
    if (typeof errorFallback === 'function') {
      return errorFallback(error)
    }

    if (errorFallback) return errorFallback

    return (
      <div role="alert" style={{ padding: 12, color: '#b00020' }}>
        Não foi possível validar sua sessão. Tente novamente.
      </div>
    )
  }

  if (typeof children !== 'function') {
    throw new Error('AuthProvider espera children como função: children(session)')
  }

  return children(session)
}
