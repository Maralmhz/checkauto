// ============================================
// SUPABASE CONFIG
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const PASSWORD_RECOVERY_REDIRECT = 'https://checkauto.pages.dev/login.html'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const isRecoveryFlow = (window.location.hash || '').includes('type=recovery')

// ============================================
// TELEGRAM CONFIG
// ============================================
const TG_TOKEN   = '8784632366:AAGjAcBf1eoTWrZCI-ZW9qnGgCpaxfpm2aI'
const TG_CHAT_ID = '6743588543'

async function enviarTelegram(mensagem) {
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: mensagem,
        parse_mode: 'HTML'
      })
    })
  } catch (err) {
    console.warn('Telegram notify error:', err)
  }
}

// ============================================
// LOGIN
// ============================================
const loginForm = document.getElementById('loginForm')
const btnText   = document.getElementById('btnText')
const btnLoader = document.getElementById('btnLoader')

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email    = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const remember = document.getElementById('remember').checked

  if (!email || !password) { showError('Preencha todos os campos!'); return }

  btnText.style.display   = 'none'
  btnLoader.style.display = 'inline-block'
  loginForm.querySelector('.btn-login').disabled = true

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    showError('E-mail ou senha incorretos!')
    btnText.style.display   = 'inline'
    btnLoader.style.display = 'none'
    loginForm.querySelector('.btn-login').disabled = false
    return
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, oficina_id')
    .eq('id', data.user.id)
    .single()

  const sessionData = {
    id:         data.user.id,
    email:      data.user.email,
    nome:       usuario?.nome       || email.split('@')[0],
    role:       usuario?.role       || 'user',
    oficina_id: usuario?.oficina_id || null,
    loginTime:  new Date().toISOString()
  }

  if (remember) {
    localStorage.setItem('checkauto_user', JSON.stringify(sessionData))
  } else {
    sessionStorage.setItem('checkauto_user', JSON.stringify(sessionData))
  }

  window.location.href = sessionData.role === 'superadmin' ? 'admin.html' : 'index.html'
})

// ============================================
// TOGGLE PASSWORD
// ============================================
function togglePassword() {
  const input   = document.getElementById('password')
  const eyeIcon = document.getElementById('eyeIcon')
  if (input.type === 'password') {
    input.type = 'text'
    eyeIcon.classList.replace('fa-eye', 'fa-eye-slash')
  } else {
    input.type = 'password'
    eyeIcon.classList.replace('fa-eye-slash', 'fa-eye')
  }
}
window.togglePassword = togglePassword

// ============================================
// MENSAGENS
// ============================================
function showError(message) {
  const errEl = document.getElementById('loginError')
  if (errEl) {
    errEl.textContent = message
    errEl.style.display = 'block'
    setTimeout(() => errEl.style.display = 'none', 4000)
  } else {
    alert(message)
  }
}

function showToast(message) {
  const toast = document.getElementById('appToast')
  if (!toast) { alert(message); return }
  toast.textContent = message
  toast.classList.add('active')
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => toast.classList.remove('active'), 3200)
}

function showCenterNotice(message) {
  let overlay = document.getElementById('centerNoticeOverlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'centerNoticeOverlay'
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;'
    overlay.innerHTML = `
      <div style="width:100%;max-width:420px;background:#fff;border-radius:12px;padding:18px 16px;box-shadow:0 15px 40px rgba(0,0,0,.25);text-align:center;">
        <h3 style="margin:0 0 8px 0;font-size:18px;color:#111827;">E-mail enviado</h3>
        <p id="centerNoticeText" style="margin:0 0 14px 0;color:#4b5563;line-height:1.4;"></p>
        <button id="centerNoticeBtn" type="button" style="background:#16a34a;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;width:100%;">Entendi</button>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('#centerNoticeBtn')?.addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  }
  const txt = overlay.querySelector('#centerNoticeText')
  if (txt) txt.textContent = message
}

// ============================================
// CHECK SE JA ESTA LOGADO
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
  if (isRecoveryFlow) {
    await handlePasswordRecovery()
    return
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (session) window.location.href = 'index.html'
})

// ============================================
// ESQUECI A SENHA
// ============================================
document.querySelector('.forgot-password')?.addEventListener('click', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value.trim()
  if (!email) { showError('Digite seu e-mail primeiro!'); return }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RECOVERY_REDIRECT
  })
  if (!error) showCenterNotice('Confira sua caixa de entrada e clique no link para redefinir sua senha.')
  else showError('Erro ao enviar e-mail de recuperacao!')
})

async function handlePasswordRecovery() {
  const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  if (!accessToken || !refreshToken) {
    showError('Link de recuperacao invalido. Solicite um novo e-mail.')
    return
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  if (sessionError) {
    showError('Nao foi possivel validar o link de recuperacao.')
    return
  }

  const novaSenha = window.prompt('Digite a nova senha (minimo 6 caracteres):')
  if (!novaSenha) {
    showError('Recuperacao cancelada. Defina uma nova senha para continuar.')
    return
  }
  if (novaSenha.length < 6) {
    showError('A nova senha deve ter pelo menos 6 caracteres.')
    return
  }

  const confirmarSenha = window.prompt('Confirme a nova senha:')
  if (confirmarSenha !== novaSenha) {
    showError('As senhas nao conferem.')
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha })
  if (updateError) {
    showError('Nao foi possivel redefinir sua senha. Tente novamente.')
    return
  }

  showToast('Senha redefinida com sucesso! Faca login com a nova senha.')
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`)
  await supabase.auth.signOut()
}

// ============================================
// HELPERS
// ============================================
function normalizarCnpj(cnpj) {
  return cnpj.replace(/\D/g, '')
}

// ============================================
// ONBOARDING — CADASTRO AUTOMATICO
// ============================================
const onboardingModal  = document.getElementById('onboardingModal')
const onboardingForm   = document.getElementById('onboardingForm')
const btnEnviar        = document.getElementById('btnEnviarOnboarding')
let lastFocusedElement = null

function openOnboardingModal() {
  if (!onboardingModal) return
  lastFocusedElement = document.activeElement
  onboardingModal.classList.add('active')
  onboardingModal.setAttribute('aria-hidden', 'false')
  onboardingModal.removeAttribute('inert')
  document.getElementById('onbEmail').value = document.getElementById('email').value || ''
  setTimeout(() => document.getElementById('onbNome')?.focus(), 0)
}

function closeOnboardingModal() {
  if (!onboardingModal) return
  onboardingModal.classList.remove('active')
  onboardingModal.setAttribute('aria-hidden', 'true')
  onboardingModal.setAttribute('inert', '')
  lastFocusedElement?.focus()
}

document.getElementById('btnSolicitarCheckauto')?.addEventListener('click', openOnboardingModal)
document.getElementById('btnCloseOnboarding')?.addEventListener('click', closeOnboardingModal)
document.getElementById('btnCancelarOnboarding')?.addEventListener('click', closeOnboardingModal)
onboardingModal?.addEventListener('click', (e) => { if (e.target === onboardingModal) closeOnboardingModal() })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && onboardingModal?.classList.contains('active')) closeOnboardingModal()
})

document.querySelectorAll('.plan-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.plan-option').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const planoInput = document.getElementById('onbPlano')
    if (planoInput) planoInput.value = btn.dataset.plano || 'TRIAL'
  })
})

async function executarCadastro() {
  const nome     = document.getElementById('onbNome').value.trim()
  const cnpjRaw  = document.getElementById('onbCnpj').value.trim()
  const cnpj     = normalizarCnpj(cnpjRaw)
  const email    = document.getElementById('onbEmail').value.trim().toLowerCase()
  const senha    = document.getElementById('onbSenha').value.trim()
  const whatsapp = document.getElementById('onbWhatsapp').value.trim()
  const endereco = document.getElementById('onbEndereco').value.trim()
  const plano = (document.getElementById('onbPlano')?.value || 'TRIAL').toUpperCase()

  if (!nome || !cnpjRaw || !email || !senha || !whatsapp) {
    showError('Todos os campos obrigatorios devem ser preenchidos!')
    return
  }
  if (cnpj.length < 11) {
    showError('CNPJ invalido. Verifique e tente novamente.')
    return
  }
  if (senha.length < 6) {
    showError('A senha deve ter pelo menos 6 caracteres!')
    return
  }

  const btn = document.getElementById('btnEnviarOnboarding')
  const textoOriginal = btn ? btn.innerHTML : ''
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...' }
  const resetBtn = () => { if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal } }

  try {
    // PASSO 1: Verificar CNPJ duplicado
    const { data: cnpjExiste } = await supabase
      .from('oficinas')
      .select('id')
      .eq('cnpj', cnpjRaw)
      .maybeSingle()

    if (cnpjExiste) {
      showError('Este CNPJ ja esta cadastrado. Entre em contato caso precise de ajuda.')
      resetBtn()
      return
    }

    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando sua conta...'

    // PASSO 2: Cria usuario no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    })

    const userId = authData?.user?.id
    if (!userId) {
      if (authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')) {
        showError('Este e-mail ja esta cadastrado. Tente fazer login.')
      } else {
        showError('Erro ao criar conta. Tente novamente.')
      }
      resetBtn()
      return
    }

    // PASSO 3: Aguarda 800ms para trigger terminar e entao chama RPC
    await new Promise(r => setTimeout(r, 800))

    const { error: rpcError } = await supabase.rpc('criar_oficina_com_usuario', {
      p_nome:     nome,
      p_cnpj:     cnpjRaw  || '',
      p_email:    email,
      p_whatsapp: whatsapp,
      p_endereco: endereco || '',
      p_user_id:  userId,
      p_plano:    plano
    })
    if (rpcError) console.warn('RPC aviso:', rpcError.message)

    // PASSO 4: Notifica via Telegram (automatico, sem abrir aba)
    const trialAte = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('pt-BR')

    await enviarTelegram(
      `\uD83C\uDD95 <b>NOVO CADASTRO CHECKAUTO</b>\n\n` +
      `\uD83C\uDFE2 <b>Oficina:</b> ${nome}\n` +
      `\uD83C\uDD94 <b>CNPJ:</b> ${cnpjRaw}\n` +
      `\uD83D\uDCCD <b>Endereco:</b> ${endereco || 'Nao informado'}\n` +
      `\uD83D\uDCE7 <b>Email:</b> ${email}\n` +
      `\uD83D\uDCF1 <b>WhatsApp:</b> ${whatsapp}\n\n` +
      `\uD83D\uDDD3 <b>Trial ate:</b> ${trialAte}\n` +
      `\u2705 Conta criada automaticamente!`
    )

    // PASSO 5: Loga automaticamente
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })

    closeOnboardingModal()
    onboardingForm.reset()
    resetBtn()

    if (loginError) {
      showToast('\u2705 Conta criada! Faca login para entrar.')
    } else {
      showToast('\u2705 Conta criada com sucesso! Entrando no sistema...')
      setTimeout(() => { window.location.href = 'index.html' }, 1500)
    }

  } catch (err) {
    console.error('Erro no onboarding:', err)
    showError('Erro inesperado. Tente novamente.')
    resetBtn()
  }
}

btnEnviar?.addEventListener('click', executarCadastro)
onboardingForm?.addEventListener('submit', (e) => { e.preventDefault(); executarCadastro() })
