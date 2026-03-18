import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  requireUsuario = true,
  usuarioRetryCount = 6,
  usuarioRetryDelayMs = 500,
  signOutOnMissingUsuario = false
}) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const safeSetState = (updater) => {
    if (!mountedRef.current) return
    updater()
  }

  const findUsuarioById = async (userId) => {
    const { data, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      throw new Error(`Erro ao validar usuário na tabela usuarios: ${userError.message}`)
    }

    return data
  }

  const validateUsuario = async (candidateSession) => {
    if (!candidateSession || !candidateSession.user) return null

    if (!requireUsuario) return candidateSession

    const userId = candidateSession.user.id

    // Usuários recém-criados podem demorar alguns ms para aparecer em `usuarios`
    // (trigger/RPC assíncrono). Repetimos a leitura antes de considerar inválido.
    let usuario = null

    for (let attempt = 0; attempt < usuarioRetryCount; attempt += 1) {
      usuario = await findUsuarioById(userId)
      if (usuario) break

      if (attempt < usuarioRetryCount - 1) {
        await sleep(usuarioRetryDelayMs)
      }
    }

    if (!usuario) {
      const missingUserError = new Error('Usuário autenticado não encontrado na tabela usuarios')
      missingUserError.code = 'USUARIO_NAO_ENCONTRADO'

      if (signOutOnMissingUsuario) {
        // Opcional: evita comportamento de loop por padrão.
        await supabase.auth.signOut()
      }

      throw missingUserError
    }

    return candidateSession
  }

  useEffect(() => {
    mountedRef.current = true
    let subscription

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
  }, [requireUsuario, signOutOnMissingUsuario, usuarioRetryCount, usuarioRetryDelayMs])

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
