import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const tbody = document.getElementById('oficinasTbody')
const feedback = document.getElementById('feedback')
const btnReload = document.getElementById('btnReload')
const btnLogout = document.getElementById('btnLogout')

function showFeedback(message, type = 'success') {
  feedback.className = `alert alert-${type}`
  feedback.textContent = message
  feedback.classList.remove('d-none')
}

function hideFeedback() {
  feedback.classList.add('d-none')
}

function badgeForStatus(status) {
  if (status === 'aprovado') return '<span class="badge text-bg-success badge-status">Aprovado</span>'
  if (status === 'rejeitado') return '<span class="badge text-bg-danger badge-status">Rejeitado</span>'
  return '<span class="badge text-bg-warning badge-status">Pendente</span>'
}

function renderOficinas(oficinas = []) {
  if (!oficinas.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma oficina encontrada.</td></tr>'
    return
  }

  tbody.innerHTML = oficinas.map((oficina) => {
    const status = oficina.status || 'pendente'
    return `
      <tr>
        <td>${oficina.nome || '-'}</td>
        <td>${oficina.cnpj || '-'}</td>
        <td>${oficina.email || '-'}</td>
        <td>${badgeForStatus(status)}</td>
        <td class="text-end">
          <div class="d-inline-flex gap-2">
            <button class="btn btn-success btn-sm btn-icon" data-action="aprovar" data-id="${oficina.id}">
              <i class="fas fa-check"></i>Aprovar
            </button>
            <button class="btn btn-danger btn-sm btn-icon" data-action="rejeitar" data-id="${oficina.id}">
              <i class="fas fa-times"></i>Rejeitar
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

async function loadOficinas() {
  hideFeedback()
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Carregando oficinas...</td></tr>'

  const { data, error } = await supabase
    .from('oficinas')
    .select('id, nome, cnpj, email, status')
    .order('nome', { ascending: true })

  if (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Erro ao carregar oficinas.</td></tr>'
    showFeedback('Erro ao buscar oficinas no Supabase.', 'danger')
    return
  }

  renderOficinas(data || [])
}

async function updateStatus(oficinaId, status) {
  hideFeedback()
  const { error } = await supabase
    .from('oficinas')
    .update({ status })
    .eq('id', oficinaId)

  if (error) {
    showFeedback(`Nao foi possivel atualizar o status para "${status}".`, 'danger')
    return
  }

  showFeedback(`Status atualizado para "${status}".`, 'success')
  await loadOficinas()
}

async function protectRoute() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'login.html'
    return false
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || !usuario || usuario.role !== 'superadmin') {
    window.location.href = 'login.html'
    return false
  }

  return true
}

btnReload.addEventListener('click', loadOficinas)

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('checkauto_user')
  sessionStorage.removeItem('checkauto_user')
  window.location.href = 'login.html'
})

tbody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action][data-id]')
  if (!button) return

  const oficinaId = button.dataset.id
  const action = button.dataset.action

  if (action === 'aprovar') {
    await updateStatus(oficinaId, 'aprovado')
  }

  if (action === 'rejeitar') {
    await updateStatus(oficinaId, 'rejeitado')
  }
})

async function initAdminPanel() {
  const allowed = await protectRoute()
  if (!allowed) return
  await loadOficinas()
}

initAdminPanel()
