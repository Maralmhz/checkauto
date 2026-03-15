// ============================================
// SUPABASE CONFIG
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================
// LOGIN
// ============================================
const loginForm   = document.getElementById('loginForm')
const btnText     = document.getElementById('btnText')
const btnLoader   = document.getElementById('btnLoader')

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

// ============================================
// CHECK SE JA ESTA LOGADO
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
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
    redirectTo: 'https://maralmhz.github.io/checkauto/index.html'
  })
  if (!error) showToast('E-mail de recuperacao enviado! Verifique sua caixa de entrada.')
  else showError('Erro ao enviar e-mail de recuperacao!')
})

// ============================================
// ONBOARDING — CADASTRO AUTOMATICO
// ============================================
const onboardingModal    = document.getElementById('onboardingModal')
const onboardingForm     = document.getElementById('onboardingForm')
let lastFocusedElement   = null

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
onboardingModal?.addEventListener('click', (e) => { if (e.target === onboardingModal) closeOnboardingModal() })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && onboardingModal?.classList.contains('active')) closeOnboardingModal()
})

// Selecao de plano (mantida para exibicao, mas so TRIAL e usado no cadastro auto)
document.querySelectorAll('.plan-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.plan-option').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
  })
})

onboardingForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const nome     = document.getElementById('onbNome').value.trim()
  const cnpj     = document.getElementById('onbCnpj').value.trim()
  const email    = document.getElementById('onbEmail').value.trim().toLowerCase()
  const senha    = document.getElementById('onbSenha').value.trim()
  const whatsapp = document.getElementById('onbWhatsapp').value.trim()
  const endereco = document.getElementById('onbEndereco').value.trim()

  if (!nome || !email || !senha || !whatsapp) {
    showError('Nome, e-mail, senha e WhatsApp sao obrigatorios!')
    return
  }
  if (senha.length < 6) {
    showError('A senha deve ter pelo menos 6 caracteres!')
    return
  }

  // Desabilita botao e mostra loading
  const btnSubmit = onboardingForm.querySelector('button[type="submit"]')
  const textoOriginal = btnSubmit.innerHTML
  btnSubmit.disabled = true
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando sua conta...'

  try {
    // PASSO 1: Cria usuario no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome }
      }
    })

    if (authError) {
      showError(authError.message === 'User already registered'
        ? 'Este e-mail ja esta cadastrado. Tente fazer login.'
        : 'Erro ao criar conta. Tente novamente.')
      btnSubmit.disabled = false
      btnSubmit.innerHTML = textoOriginal
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      showError('Erro ao criar conta. Tente novamente.')
      btnSubmit.disabled = false
      btnSubmit.innerHTML = textoOriginal
      return
    }

    // PASSO 2: Cria oficina + usuario via RPC (trigger seta trial automaticamente)
    const { error: rpcError } = await supabase.rpc('criar_oficina_com_usuario', {
      p_nome:      nome,
      p_cnpj:      cnpj      || '',
      p_email:     email,
      p_whatsapp:  whatsapp,
      p_endereco:  endereco  || '',
      p_user_id:   userId
    })

    if (rpcError) {
      console.error('Erro RPC:', rpcError)
      // Mesmo com erro no RPC, conta foi criada — avisa o usuario
      showToast('Conta criada! Entre em contato pelo WhatsApp para liberar o acesso.')
      closeOnboardingModal()
      onboardingForm.reset()
      btnSubmit.disabled = false
      btnSubmit.innerHTML = textoOriginal
      return
    }

    // PASSO 3: Notifica voce via WhatsApp
    const msgWA = [
      '🆕 NOVO CADASTRO CHECKAUTO',
      '',
      `👤 Nome: ${nome}`,
      `🏢 CNPJ: ${cnpj || 'Nao informado'}`,
      `📍 Endereco: ${endereco || 'Nao informado'}`,
      `📧 Email: ${email}`,
      `📱 WhatsApp: ${whatsapp}`,
      '',
      '✅ Conta criada automaticamente!',
      '🟢 Trial de 15 dias ja ativo.',
      '⚡ Nenhuma acao necessaria da sua parte.'
    ].join('\n')

    window.open(`https://wa.me/5531996766963?text=${encodeURIComponent(msgWA)}`, '_blank')

    // PASSO 4: Loga o usuario automaticamente
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })

    closeOnboardingModal()
    onboardingForm.reset()

    if (loginError) {
      // Conta criada mas login falhou (email nao confirmado) — orienta o usuario
      showToast('✅ Conta criada! Verifique seu e-mail para confirmar e entrar.')
      btnSubmit.disabled = false
      btnSubmit.innerHTML = textoOriginal
    } else {
      showToast('✅ Conta criada com sucesso! Entrando no sistema...')
      setTimeout(() => { window.location.href = 'index.html' }, 1500)
    }

  } catch (err) {
    console.error('Erro no onboarding:', err)
    showError('Erro inesperado. Tente novamente.')
    btnSubmit.disabled = false
    btnSubmit.innerHTML = textoOriginal
  }
})
