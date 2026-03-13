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

function isMissingColumnError(error) {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return error?.code === 'PGRST204' || msg.includes('column')
}

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

  const nome = document.getElementById('onbNome').value.trim()
  const cnpj = document.getElementById('onbCnpj').value.trim()
  const email = document.getElementById('onbEmail').value.trim().toLowerCase()
  const senha = document.getElementById('onbSenha').value
  const whatsapp = document.getElementById('onbWhatsapp').value.trim()
  const endereco = document.getElementById('onbEndereco').value.trim()
  const plano = String(onboardingPlanoInput.value || 'TRIAL').toUpperCase()

  if (!nome || !email || !senha || !whatsapp) {
    showError('Preencha os campos obrigatórios (nome, email, senha e WhatsApp).')
    return
  }

  if (senha.length < 6) {
    showError('A senha deve ter pelo menos 6 caracteres.')
    return
  }

  const trialFim = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const isTrial = plano === 'TRIAL'

  const { data: authUsers, error: authUsersError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (authUsersError) {
    console.error('[onboarding] erro ao validar email duplicado', authUsersError)
    showError('Não foi possível validar o e-mail no momento.')
    return
  }

  if (Array.isArray(authUsers) && authUsers.length > 0) {
    showError('Já existe cadastro com este e-mail. Faça login para continuar.')
    return
  }

  const oficinaPayload = {
    nome,
    cnpj,
    email,
    whatsapp,
    endereco,
    plano,
    status: isTrial ? 'aprovado' : 'pendente',
    plano_status: isTrial ? 'trial' : 'pendente',
    trial_fim: isTrial ? trialFim : null
  }

  let oficinaRes = await supabase.from('oficinas').insert(oficinaPayload).select('id').single()

  if (oficinaRes.error && isMissingColumnError(oficinaRes.error)) {
    const legacyPayload = {
      nome,
      cnpj,
      email,
      whatsapp,
      plano,
      status: isTrial ? 'aprovado' : 'pendente'
    }
    oficinaRes = await supabase.from('oficinas').insert(legacyPayload).select('id').single()
  }

  if (oficinaRes.error) {
    console.error('[onboarding] erro ao criar oficina', oficinaRes.error)
    showError('Nao foi possivel criar a oficina agora. Tente novamente em instantes.')
    return
  }

  const oficinaId = oficinaRes.data?.id

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        oficina_id: oficinaId,
        role: 'admin_oficina',
        whatsapp
      }
    }
  })

  if (signUpError || !signUpData?.user?.id) {
    console.error('[onboarding] erro ao criar auth user', signUpError)
    await supabase.from('oficinas').delete().eq('id', oficinaId)
    showError('Nao foi possivel criar o usuário de acesso. Verifique o e-mail/senha e tente novamente.')
    return
  }

  const usuarioPayload = {
    id: signUpData.user.id,
    email,
    nome,
    role: 'admin_oficina',
    oficina_id: oficinaId,
    whatsapp
  }

  let usuarioRes = await supabase.from('usuarios').insert(usuarioPayload)
  if (usuarioRes.error && isMissingColumnError(usuarioRes.error)) {
    const { whatsapp: _whatsapp, ...legacyUsuarioPayload } = usuarioPayload
    usuarioRes = await supabase.from('usuarios').insert(legacyUsuarioPayload)
  }

  if (usuarioRes.error) {
    console.error('[onboarding] erro ao criar usuario interno', usuarioRes.error)
    showError('Oficina criada, mas falhou ao finalizar cadastro de usuário. Contate o suporte.')
    return
  }

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  if (loginError || !loginData?.user?.id) {
    console.error('[onboarding] erro no auto-login', loginError)
    showError('Cadastro criado, mas não foi possível fazer login automático. Faça login manualmente.')
    closeOnboardingModal()
    return
  }

  const sessionData = {
    id: loginData.user.id,
    email: loginData.user.email,
    nome,
    role: 'admin_oficina',
    oficina_id: oficinaId,
    loginTime: new Date().toISOString()
  }

  localStorage.setItem('checkauto_user', JSON.stringify(sessionData))

  closeOnboardingModal()
  onboardingForm.reset()
  onboardingPlanoInput.value = 'TRIAL'
  document.querySelectorAll('.plan-option').forEach((option) => option.classList.remove('active'))
  document.querySelector('.plan-option[data-plano="TRIAL"]')?.classList.add('active')

  showToast('✅ Trial ativo! Use sua senha.')
  setTimeout(() => {
    window.location.href = 'index.html'
  }, 600)
})
