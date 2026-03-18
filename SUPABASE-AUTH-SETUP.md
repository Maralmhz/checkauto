# Configuração de Auth Supabase (sem loop de reload)

## 1) Cliente Supabase (React/SPA)

Use **uma única instância** do client no frontend:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
```

> Evite criar client dentro de componentes, para não recriar listener de auth a cada render.

## 2) Banco: tabela `usuarios`

Garanta que `usuarios.id` corresponde ao `auth.users.id`.

Exemplo mínimo:

```sql
create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  created_at timestamptz default now()
);
```

## 3) Fluxo recomendado

- `getSession()` no bootstrap do app.
- `onAuthStateChange()` apenas para atualizar estado local.
- **Não fazer `window.location` dentro do listener**.
- Se usar onboarding/trigger para popular `usuarios`, aplicar retry curto de leitura (já implementado no `AuthProvider.jsx`).

## 4) Uso do AuthProvider

```jsx
<AuthProvider>
  {(session) => (session ? <App /> : <Login />)}
</AuthProvider>
```

## 5) Causa comum de “reload infinito”

1. Redirect dentro de `onAuthStateChange`.
2. Mais de um listener ativo ao mesmo tempo.
3. `signOut()` automático imediato antes de `usuarios` ficar disponível para usuário recém-criado.
4. Client Supabase recriado a cada render.
