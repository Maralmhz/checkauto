// ============================================
// SUPABASE CONFIG
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================
// LOGIN FORM HANDLER
// ============================================
const loginForm = document.getElementById('loginForm')
const btnText   = document.getElementById('btnText')
const btnLoader = document.getElementById('btnLoader')

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email    = document.getElementById('email').value
  const password = document.getElementById('password').value
  const remember = document.getElementById('remember').checked

  if (!email || !password) { showError('Preencha todos os campos!'); return }

  btnText.style.display  = 'none'
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

  // Busca dados do usuario incluindo oficina_id
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
// ERROR MESSAGE
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
  if (!toast) {
    alert(message)
    return
  }

  toast.textContent = message
  toast.classList.add('active')
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => {
    toast.classList.remove('active')
  }, 3200)
}

// ============================================
// CHECK SE JA ESTA LOGADO
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) window.location.href = 'index.html'
  console.log('CheckAuto Login — Supabase Auth')
})

// ============================================
// FORGOT PASSWORD
// ============================================
document.querySelector('.forgot-password')?.addEventListener('click', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value
  if (!email) { showError('Digite seu e-mail primeiro!'); return }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://maralmhz.github.io/checkauto/index.html'
  })
  if (!error) alert('E-mail de recuperacao enviado!')
  else showError('Erro ao enviar e-mail de recuperacao!')
})


// ============================================
// ONBOARDING / SOLICITAR CHECKAUTO
// ============================================
const onboardingModal = document.getElementById('onboardingModal')
const onboardingForm = document.getElementById('onboardingForm')
const onboardingPlanoInput = document.getElementById('onbPlano')

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
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus()
  }
}

document.getElementById('btnSolicitarCheckauto')?.addEventListener('click', openOnboardingModal)
document.getElementById('btnCloseOnboarding')?.addEventListener('click', closeOnboardingModal)

onboardingModal?.addEventListener('click', (event) => {
  if (event.target === onboardingModal) closeOnboardingModal()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && onboardingModal?.classList.contains('active')) closeOnboardingModal()
})

document.querySelectorAll('.plan-option').forEach((button) => {
  button.addEventListener('click', () => {
    const plano = button.dataset.plano || 'TRIAL'
    onboardingPlanoInput.value = plano
    document.querySelectorAll('.plan-option').forEach((option) => option.classList.remove('active'))
    button.classList.add('active')
  })
})

onboardingForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const nome      = document.getElementById('onbNome').value.trim()
  const cnpj      = document.getElementById('onbCnpj').value.trim()
  const email     = document.getElementById('onbEmail').value.trim().toLowerCase()
  const senha     = document.getElementById('onbSenha').value.trim()
  const whatsapp  = document.getElementById('onbWhatsapp').value.trim()
  const endereco  = document.getElementById('onbEndereco').value.trim()
  const plano     = document.getElementById('onbPlano')?.value || 'TRIAL'

  if (!nome || !email || !senha || !whatsapp) {
    showError('Nome, email, senha e WhatsApp são obrigatórios!')
    return
  }

  // ── MENSAGEM WHATSAPP (texto limpo, sem %0A manual) ──────────────────
  const msgWA = [
    '🆕 NOVA SOLICITAÇÃO CHECKAUTO',
    '',
    `👤 Nome: ${nome}`,
    `🏢 CNPJ: ${cnpj || 'Não informado'}`,
    `📍 Endereço: ${endereco || 'Não informado'}`,
    `📧 Email: ${email}`,
    `🔑 Senha temporária: ${senha}`,
    `📱 WhatsApp: ${whatsapp}`,
    `📋 Plano: ${plano}`,
    '',
    '─────────────────────',
    '✅ Passos para liberar acesso:',
    '1. Crie o usuário no Supabase Auth com email + senha acima',
    '2. Insira na tabela "usuarios" com oficina_id correto',
    '3. Notifique o cliente para trocar a senha no primeiro acesso',
  ].join('\n')

  // ── ENVIO WHATSAPP ────────────────────────────────────────────────────
  const waUrl = `https://wa.me/5531996766963?text=${encodeURIComponent(msgWA)}`
  window.open(waUrl, '_blank')

  // ── ENVIO EMAIL ───────────────────────────────────────────────────────
  const assunto = `Solicitação CheckAuto - ${nome}`
  const corpoEmail = [
    `Nova solicitação de acesso CheckAuto`,
    ``,
    `Nome: ${nome}`,
    `CNPJ: ${cnpj || 'Não informado'}`,
    `Endereço: ${endereco || 'Não informado'}`,
    `Email: ${email}`,
    `Senha temporária: ${senha}`,
    `WhatsApp: ${whatsapp}`,
    `Plano: ${plano}`,
    ``,
    `Passos:`,
    `1. Crie o usuário no Supabase Auth (Authentication > Users > Invite)`,
    `   Email: ${email} | Senha: ${senha}`,
    `2. Insira na tabela "usuarios" o nome, role=user e oficina_id`,
    `3. No primeiro acesso o cliente deve trocar a senha (use "Esqueci a senha")`,
  ].join('\n')

  window.location.href = `mailto:checkautogestao@gmail.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`

  showToast('✅ Solicitação enviada por WhatsApp + Email!')
  closeOnboardingModal()
  onboardingForm.reset()
})
