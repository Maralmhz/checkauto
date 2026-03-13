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

document.getElementById('btnSolicitarCheckauto')?.addEventListener('click', () => {
  onboardingModal?.classList.add('active')
  document.getElementById('onbEmail').value = document.getElementById('email').value || ''
})

document.getElementById('btnCloseOnboarding')?.addEventListener('click', () => {
  onboardingModal?.classList.remove('active')
})

onboardingModal?.addEventListener('click', (event) => {
  if (event.target === onboardingModal) onboardingModal.classList.remove('active')
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

  const nome = document.getElementById('onbNome').value.trim()
  const cnpj = document.getElementById('onbCnpj').value.trim()
  const email = document.getElementById('onbEmail').value.trim()
  const plano = String(onboardingPlanoInput.value || 'TRIAL').toUpperCase()

  if (!nome || !email) {
    showError('Preencha nome e e-mail da oficina para solicitar.')
    return
  }

  const trialFim = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const isTrial = plano === 'TRIAL'

  const payload = {
    nome,
    cnpj,
    email,
    plano,
    status: isTrial ? 'aprovado' : 'pendente',
    plano_status: isTrial ? 'trial' : 'pendente',
    trial_fim: isTrial ? trialFim : null
  }

  const { error } = await supabase.from('oficinas').insert(payload)
  if (error) {
    console.error('[onboarding] erro ao solicitar checkauto', error)
    showError('Nao foi possivel enviar agora. Tente novamente em instantes.')
    return
  }

  onboardingModal?.classList.remove('active')
  onboardingForm.reset()
  onboardingPlanoInput.value = 'TRIAL'
  document.querySelectorAll('.plan-option').forEach((option) => option.classList.remove('active'))
  document.querySelector('.plan-option[data-plano="TRIAL"]')?.classList.add('active')
  alert(isTrial
    ? 'TRIAL ativado! Sua oficina foi criada com 15 dias gratis.'
    : 'Solicitacao recebida! Seu plano pago ficara pendente para aprovacao.')
})
