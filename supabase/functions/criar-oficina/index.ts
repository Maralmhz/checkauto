import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Valida que quem chamou é superadmin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sem autorização.' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verifica se o chamador é superadmin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Sessão inválida.' }), { status: 401, headers: corsHeaders })
    }
    const { data: callerRecord } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (!callerRecord || callerRecord.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Acesso negado.' }), { status: 403, headers: corsHeaders })
    }

    // Lê payload
    const { nome, email, whatsapp, cnpj, plano } = await req.json()
    if (!nome || !email) {
      return new Response(JSON.stringify({ error: 'Nome e email são obrigatórios.' }), { status: 400, headers: corsHeaders })
    }

    const planoNorm = ['TRIAL','MENSAL','ANUAL','PARCEIRO','DIVULGADOR','FIXO'].includes(String(plano).toUpperCase())
      ? String(plano).toUpperCase()
      : 'TRIAL'

    // Gera senha temporária
    const senhaTemp = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()

    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaTemp,
      email_confirm: true
    })
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })
    }
    const userId = authData.user.id

    // 2. Cria registro na tabela oficinas
    const trialFim = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: oficina, error: oficinaError } = await supabaseAdmin
      .from('oficinas')
      .insert({
        nome,
        email,
        whatsapp: whatsapp || null,
        cnpj: cnpj || null,
        plano: planoNorm,
        status: 'aprovado',
        plano_status: planoNorm === 'TRIAL' ? 'trial' : 'ativo',
        trial_fim: planoNorm === 'TRIAL' ? trialFim : null
      })
      .select('id')
      .single()

    if (oficinaError) {
      // Rollback: remove user do Auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: oficinaError.message }), { status: 400, headers: corsHeaders })
    }

    // 3. Cria registro na tabela usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        email,
        nome,
        role: 'user',
        status: 'ativo',
        oficina_id: oficina.id
      })

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('oficinas').delete().eq('id', oficina.id)
      return new Response(JSON.stringify({ error: usuarioError.message }), { status: 400, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        oficina_id: oficina.id,
        user_id: userId,
        email,
        senha_temporaria: senhaTemp,
        plano: planoNorm
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno.', detail: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
