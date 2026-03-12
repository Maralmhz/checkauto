import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const tbody = document.getElementById('oficinasTbody')
const feedback = document.getElementById('feedback')
const btnReload = document.getElementById('btnReload')
const btnLogout = document.getElementById('btnLogout')
const filterStatus = document.getElementById('filterStatus')
const filterPlano = document.getElementById('filterPlano')
const filterBusca = document.getElementById('filterBusca')

const metricOficinas = document.getElementById('metricOficinas')
const metricOficinasAtivas = document.getElementById('metricOficinasAtivas')
const metricOficinasPendentes = document.getElementById('metricOficinasPendentes')
const metricOsTotal = document.getElementById('metricOsTotal')
const metricFaturamento = document.getElementById('metricFaturamento')
const metricClientes = document.getElementById('metricClientes')

const detalhesTitulo = document.getElementById('detalhesTitulo')
const detalhesCnpj = document.getElementById('detalhesCnpj')
const detalhesStatus = document.getElementById('detalhesStatus')
const detalhesPlano = document.getElementById('detalhesPlano')
const detalhesOsAbertas = document.getElementById('detalhesOsAbertas')
const detalhesFaturamento30d = document.getElementById('detalhesFaturamento30d')
const detalhesUsuarios = document.getElementById('detalhesUsuarios')
const btnVerUsuarios = document.getElementById('btnVerUsuarios')
const btnHistoricoOs = document.getElementById('btnHistoricoOs')
const btnBloquearOficina = document.getElementById('btnBloquearOficina')

const detalhesModal = window.bootstrap ? new bootstrap.Modal(document.getElementById('oficinaDetalhesModal')) : null

const state = {
  oficinas: [],
  osByOficina: new Map(),
  clientesByOficina: new Map(),
  usuariosByOficina: new Map()
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)
}

function showFeedback(message, type = 'success') {
  feedback.className = `alert alert-${type}`
  feedback.textContent = message
  feedback.classList.remove('d-none')
}

function hideFeedback() {
  feedback.classList.add('d-none')
}

function badgeForStatus(status) {
  if (status === 'aprovado') return '<span class="badge text-bg-success badge-status">Ativa</span>'
  if (status === 'rejeitado') return '<span class="badge text-bg-danger badge-status">Rejeitada</span>'
  return '<span class="badge text-bg-warning badge-status">Pendente</span>'
}

function badgeForPlano(plano = 'Free') {
  if (plano === 'Enterprise') return '<span class="badge text-bg-dark badge-plano">Enterprise</span>'
  if (plano === 'Pro') return '<span class="badge text-bg-primary badge-plano">Pro</span>'
  return '<span class="badge text-bg-secondary badge-plano">Free</span>'
}

function getFilters() {
  return {
    status: filterStatus.value,
    plano: filterPlano.value,
    busca: filterBusca.value.trim().toLowerCase()
  }
}

function getFilteredOficinas() {
  const filters = getFilters()
  return state.oficinas.filter((oficina) => {
    const status = oficina.status || 'pendente'
    const plano = oficina.plano || 'Free'
    const searchable = `${oficina.nome || ''} ${oficina.cnpj || ''} ${oficina.email || ''}`.toLowerCase()

    const matchStatus = filters.status === 'todos' || status === filters.status
    const matchPlano = filters.plano === 'todos' || plano === filters.plano
    const matchBusca = !filters.busca || searchable.includes(filters.busca)

    return matchStatus && matchPlano && matchBusca
  })
}

function renderMetrics() {
  const oficinas = state.oficinas
  const totalOficinas = oficinas.length
  const totalAtivas = oficinas.filter((oficina) => oficina.status === 'aprovado').length
  const totalPendentes = oficinas.filter((oficina) => (oficina.status || 'pendente') === 'pendente').length

  const totalOS = Array.from(state.osByOficina.values()).reduce((sum, stats) => sum + (stats.totalOS || 0), 0)
  const faturamento30d = Array.from(state.osByOficina.values()).reduce((sum, stats) => sum + (stats.faturamento30d || 0), 0)
  const totalClientes = Array.from(state.clientesByOficina.values()).reduce((sum, count) => sum + count, 0)

  metricOficinas.textContent = String(totalOficinas)
  metricOficinasAtivas.textContent = String(totalAtivas)
  metricOficinasPendentes.textContent = String(totalPendentes)
  metricOsTotal.textContent = String(totalOS)
  metricFaturamento.textContent = formatCurrency(faturamento30d)
  metricClientes.textContent = String(totalClientes)
}

function renderOficinas() {
  const oficinas = getFilteredOficinas()

  if (!oficinas.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma oficina encontrada.</td></tr>'
    return
  }

  tbody.innerHTML = oficinas.map((oficina) => {
    const status = oficina.status || 'pendente'
    const plano = oficina.plano || 'Free'
    return `
      <tr>
        <td>
          <button class="btn btn-link p-0 oficina-link" data-action="detalhes" data-id="${oficina.id}">${oficina.nome || '-'}</button>
        </td>
        <td>${oficina.cnpj || '-'}</td>
        <td>${oficina.email || '-'}</td>
        <td>${badgeForStatus(status)}</td>
        <td>${badgeForPlano(plano)}</td>
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

function renderAll() {
  renderMetrics()
  renderOficinas()
}

function aggregateByOficina(items, valueExtractor = null) {
  const map = new Map()
  for (const item of items || []) {
    if (!item.oficina_id) continue
    const current = map.get(item.oficina_id) || 0
    map.set(item.oficina_id, current + (valueExtractor ? valueExtractor(item) : 1))
  }
  return map
}

function buildOSStats(osItems = []) {
  const now = Date.now()
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
  const map = new Map()

  for (const os of osItems) {
    if (!os.oficina_id) continue
    const curr = map.get(os.oficina_id) || { totalOS: 0, faturamento30d: 0, abertas: 0 }
    curr.totalOS += 1

    const valor = Number(os.valor_total || 0)
    const createdAt = os.created_at ? new Date(os.created_at).getTime() : 0
    if (createdAt && now - createdAt <= THIRTY_DAYS) {
      curr.faturamento30d += valor
    }

    if (os.status === 'aguardando' || os.status === 'em_andamento') {
      curr.abertas += 1
    }

    map.set(os.oficina_id, curr)
  }

  return map
}

function populateDetalhes(oficinaId) {
  const oficina = state.oficinas.find((item) => item.id === oficinaId)
  if (!oficina) return

  const osStats = state.osByOficina.get(oficinaId) || { totalOS: 0, faturamento30d: 0, abertas: 0 }
  const usuarios = state.usuariosByOficina.get(oficinaId) || 0

  detalhesTitulo.textContent = oficina.nome || 'Oficina sem nome'
  detalhesCnpj.textContent = oficina.cnpj || '-'
  detalhesStatus.innerHTML = badgeForStatus(oficina.status || 'pendente')
  detalhesPlano.innerHTML = badgeForPlano(oficina.plano || 'Free')
  detalhesOsAbertas.textContent = String(osStats.abertas || 0)
  detalhesFaturamento30d.textContent = formatCurrency(osStats.faturamento30d || 0)
  detalhesUsuarios.textContent = String(usuarios)

  btnVerUsuarios.dataset.oficinaId = oficinaId
  btnHistoricoOs.dataset.oficinaId = oficinaId
  btnBloquearOficina.dataset.oficinaId = oficinaId

  detalhesModal?.show()
}

async function loadOficinas() {
  hideFeedback()
  tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Carregando oficinas...</td></tr>'

  const [oficinasRes, osRes, clientesRes, usuariosRes] = await Promise.all([
    supabase.from('oficinas').select('id, nome, cnpj, email, status, plano').order('nome', { ascending: true }),
    supabase.from('ordens_servico').select('oficina_id, status, valor_total, created_at'),
    supabase.from('clientes').select('oficina_id'),
    supabase.from('usuarios').select('oficina_id')
  ])

  if (oficinasRes.error || osRes.error || clientesRes.error || usuariosRes.error) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Erro ao carregar dados.</td></tr>'
    showFeedback('Erro ao buscar dados do painel no Supabase.', 'danger')
    return
  }

  state.oficinas = oficinasRes.data || []
  state.osByOficina = buildOSStats(osRes.data || [])
  state.clientesByOficina = aggregateByOficina(clientesRes.data || [])
  state.usuariosByOficina = aggregateByOficina(usuariosRes.data || [])

  renderAll()
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
filterStatus.addEventListener('change', renderOficinas)
filterPlano.addEventListener('change', renderOficinas)
filterBusca.addEventListener('input', renderOficinas)

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('checkauto_user')
  sessionStorage.removeItem('checkauto_user')
  window.location.href = 'login.html'
})

btnVerUsuarios.addEventListener('click', () => showFeedback('Ação "Ver usuários" será implementada na próxima PR.', 'info'))
btnHistoricoOs.addEventListener('click', () => showFeedback('Ação "Histórico OS" será implementada na próxima PR.', 'info'))
btnBloquearOficina.addEventListener('click', async () => {
  const oficinaId = btnBloquearOficina.dataset.oficinaId
  if (!oficinaId) return
  await updateStatus(oficinaId, 'rejeitado')
  detalhesModal?.hide()
})

tbody.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action][data-id]')
  if (!target) return

  const oficinaId = target.dataset.id
  const action = target.dataset.action

  if (action === 'aprovar') {
    await updateStatus(oficinaId, 'aprovado')
    return
  }

  if (action === 'rejeitar') {
    await updateStatus(oficinaId, 'rejeitado')
    return
  }

  if (action === 'detalhes') {
    populateDetalhes(oficinaId)
  }
})

async function initAdminPanel() {
  const allowed = await protectRoute()
  if (!allowed) return
  await loadOficinas()
}

initAdminPanel()
