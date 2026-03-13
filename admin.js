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
const metricOficinasTrial = document.getElementById('metricOficinasTrial')
const metricOficinasMensal = document.getElementById('metricOficinasMensal')
const metricOficinasAnual = document.getElementById('metricOficinasAnual')
const metricOsTotal = document.getElementById('metricOsTotal')
const metricFaturamento = document.getElementById('metricFaturamento')
const metricClientes = document.getElementById('metricClientes')

const detalhesTitulo = document.getElementById('detalhesTitulo')
const detalhesCnpj = document.getElementById('detalhesCnpj')
const detalhesStatus = document.getElementById('detalhesStatus')
const detalhesPlano = document.getElementById('detalhesPlano')
const detalhesOsAbertas = document.getElementById('detalhesOsAbertas')
const detalhesFaturamento30d = document.getElementById('detalhesFaturamento30d')
const detalhesClientes = document.getElementById('detalhesClientes')
const detalhesTrialDias = document.getElementById('detalhesTrialDias')
const trialInfoBox = document.getElementById('trialInfoBox')
const detalhesPlanoSelect = document.getElementById('detalhesPlanoSelect')
const btnVerUsuarios = document.getElementById('btnVerUsuarios')
const btnBloquearOficina = document.getElementById('btnBloquearOficina')
const btnSalvarPlano = document.getElementById('btnSalvarPlano')
const btnUpgradeMensal = document.getElementById('btnUpgradeMensal')

const detalhesModal = window.bootstrap ? new bootstrap.Modal(document.getElementById('oficinaDetalhesModal')) : null
const configModal = window.bootstrap ? new bootstrap.Modal(document.getElementById('oficinaConfigModal')) : null

const oficinaConfigForm = document.getElementById('oficinaConfigForm')
const cfgOficinaId = document.getElementById('cfgOficinaId')
const cfgNomeExibicao = document.getElementById('cfgNomeExibicao')
const cfgCorPrimaria = document.getElementById('cfgCorPrimaria')
const cfgRodapePdf = document.getElementById('cfgRodapePdf')
const cfgLogoUpload = document.getElementById('cfgLogoUpload')
const cfgLogoPreview = document.getElementById('cfgLogoPreview')

const state = {
  oficinas: [],
  osByOficina: new Map(),
  clientesByOficina: new Map(),
  usuariosByOficina: new Map(),
  supportsTrialColumns: true
}

function isMissingColumnError(error) {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return error?.code === 'PGRST204' || msg.includes('column')
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
  if (status === 'vencido') return '<span class="badge text-bg-dark badge-status">Trial vencido</span>'
  return '<span class="badge text-bg-warning badge-status">Pendente</span>'
}

function badgeForPlano(plano = 'Free') {
  if (plano === 'MENSAL') return '<span class="badge text-bg-success badge-plano">🟢 MENSAL · R$99,90/mês</span>'
  if (plano === 'ANUAL') return '<span class="badge text-bg-purple badge-plano" style="background:#7c3aed">🟣 ANUAL · R$999,90/ano</span>'
  if (plano === 'PARCEIRO') return '<span class="badge text-bg-primary badge-plano">🔵 PARCEIRO · Liberado</span>'
  if (plano === 'DIVULGADOR') return '<span class="badge text-bg-warning badge-plano">🟡 DIVULGADOR · Afiliado</span>'
  if (plano === 'FIXO') return '<span class="badge text-bg-dark badge-plano">⚫ FIXO · Pago único</span>'
  return '<span class="badge text-bg-warning badge-plano">🟠 TRIAL · 15 dias grátis</span>'
}

function normalizePlano(plano) {
  const value = String(plano || '').toUpperCase()
  const allowed = ['TRIAL', 'MENSAL', 'ANUAL', 'PARCEIRO', 'DIVULGADOR', 'FIXO']
  return allowed.includes(value) ? value : 'TRIAL'
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
    const plano = normalizePlano(oficina.plano)
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
  const totalTrial = oficinas.filter((oficina) => normalizePlano(oficina.plano) === 'TRIAL').length
  const totalMensal = oficinas.filter((oficina) => normalizePlano(oficina.plano) === 'MENSAL').length
  const totalAnual = oficinas.filter((oficina) => normalizePlano(oficina.plano) === 'ANUAL').length

  const totalOS = Array.from(state.osByOficina.values()).reduce((sum, stats) => sum + (stats.totalOS || 0), 0)
  const faturamento30d = Array.from(state.osByOficina.values()).reduce((sum, stats) => sum + (stats.faturamento30d || 0), 0)
  const totalClientes = Array.from(state.clientesByOficina.values()).reduce((sum, count) => sum + count, 0)

  metricOficinas.textContent = String(totalOficinas)
  metricOficinasTrial.textContent = String(totalTrial)
  metricOficinasMensal.textContent = String(totalMensal)
  metricOficinasAnual.textContent = String(totalAnual)
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
    const plano = normalizePlano(oficina.plano)
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
            <button class="btn btn-outline-primary btn-sm btn-icon" data-action="config" data-id="${oficina.id}">
              <i class="fas fa-cog"></i>Config
            </button>
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


function sanitizeHexColor(value, fallback = '#27ae60') {
  const v = String(value || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase()
  return fallback
}

function getLogoPublicUrl(oficinaId) {
  if (!oficinaId) return 'logo-default.png'
  const { data } = supabase.storage.from('logos').getPublicUrl(`${oficinaId}.png`)
  return data?.publicUrl || 'logo-default.png'
}

function openConfigModal(oficinaId) {
  const oficina = state.oficinas.find((item) => item.id === oficinaId)
  if (!oficina) return

  cfgOficinaId.value = oficinaId
  cfgNomeExibicao.value = oficina.nome_exibicao || oficina.nome || ''
  cfgCorPrimaria.value = sanitizeHexColor(oficina.cor_primaria)
  cfgRodapePdf.value = oficina.rodape_pdf || ''
  cfgLogoUpload.value = ''
  cfgLogoPreview.src = oficina.logo_url || getLogoPublicUrl(oficinaId)
  cfgLogoPreview.onerror = () => { cfgLogoPreview.src = 'logo-default.png' }

  configModal?.show()
}

async function uploadLogoIfNeeded(oficinaId) {
  const file = cfgLogoUpload.files?.[0]
  if (!file) return null

  const path = `${oficinaId}.png`
  const { error } = await supabase.storage.from('logos').upload(path, file, {
    upsert: true,
    contentType: 'image/png'
  })

  if (error) throw error
  return getLogoPublicUrl(oficinaId)
}

async function saveOficinaConfig(event) {
  event.preventDefault()
  hideFeedback()

  const oficinaId = cfgOficinaId.value
  if (!oficinaId) return

  const nomeExibicao = cfgNomeExibicao.value.trim()
  const payload = {
    nome_exibicao: nomeExibicao,
    cor_primaria: sanitizeHexColor(cfgCorPrimaria.value),
    rodape_pdf: cfgRodapePdf.value.trim()
  }

  try {
    const logoUrl = await uploadLogoIfNeeded(oficinaId)
    if (logoUrl) payload.logo_url = logoUrl

    const { error } = await supabase.from('oficinas').update(payload).eq('id', oficinaId)
    if (error) {
      showFeedback('Não foi possível salvar as configurações da oficina.', 'danger')
      return
    }

    showFeedback('Configurações da oficina salvas com sucesso.', 'success')
    configModal?.hide()
    await loadOficinas()
  } catch (error) {
    console.error('[admin] Erro ao salvar configuração da oficina:', error)
    showFeedback('Falha no upload/salvamento da configuração da oficina.', 'danger')
  }
}

function populateDetalhes(oficinaId) {
  const oficina = state.oficinas.find((item) => item.id === oficinaId)
  if (!oficina) return

  const osStats = state.osByOficina.get(oficinaId) || { totalOS: 0, faturamento30d: 0, abertas: 0 }
  const clientes = state.clientesByOficina.get(oficinaId) || 0
  const plano = normalizePlano(oficina.plano)
  const trialDias = Math.max(0, Math.ceil((Date.now() - new Date(oficina.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))

  detalhesTitulo.textContent = oficina.nome || 'Oficina sem nome'
  detalhesCnpj.textContent = oficina.cnpj || '-'
  detalhesStatus.innerHTML = badgeForStatus(oficina.status || 'pendente')
  detalhesPlano.innerHTML = badgeForPlano(plano)
  detalhesOsAbertas.textContent = String(osStats.totalOS || 0)
  detalhesFaturamento30d.textContent = formatCurrency(osStats.faturamento30d || 0)
  detalhesClientes.textContent = String(clientes)
  detalhesPlanoSelect.value = plano

  if (plano === 'TRIAL') {
    trialInfoBox.classList.remove('d-none')
    detalhesTrialDias.textContent = `${Math.min(trialDias, 15)}/15 dias`
  } else {
    trialInfoBox.classList.add('d-none')
  }

  btnVerUsuarios.dataset.oficinaId = oficinaId
  btnBloquearOficina.dataset.oficinaId = oficinaId
  btnSalvarPlano.dataset.oficinaId = oficinaId
  btnUpgradeMensal.dataset.oficinaId = oficinaId

  detalhesModal?.show()
}

async function loadOficinas() {
  hideFeedback()
  tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Carregando...</td></tr>'

  try {
    const selectCompleto = 'id,nome,email,status,plano,plano_status,trial_fim,nome_exibicao,cor_primaria,rodape_pdf,logo_url'
    const selectLegacy = 'id,nome,email,status,plano,nome_exibicao,cor_primaria,rodape_pdf,logo_url'

    console.log('[admin] Query oficinas:', selectCompleto)

    const [oficinasRawRes, osRes, clientesRes, usuariosRes] = await Promise.all([
      supabase.from('oficinas').select(selectCompleto).order('nome', { ascending: true }),
      supabase.from('ordens_servico').select('oficina_id, status, valor_total, created_at'),
      supabase.from('clientes').select('oficina_id'),
      supabase.from('usuarios').select('oficina_id')
    ])

    let oficinasRes = oficinasRawRes
    if (oficinasRes.error && isMissingColumnError(oficinasRes.error)) {
      console.warn('[admin] Campos trial/plano_status indisponiveis; usando query legacy.')
      oficinasRes = await supabase.from('oficinas').select(selectLegacy).order('nome', { ascending: true })
      state.supportsTrialColumns = false
    } else {
      state.supportsTrialColumns = true
    }

    console.log('[admin] Resposta raw oficinas:', oficinasRes)

    if (oficinasRes.error) {
      state.oficinas = []
      state.osByOficina = new Map()
      state.clientesByOficina = new Map()
      state.usuariosByOficina = new Map()
      renderAll()
      showFeedback('Nao foi possivel carregar oficinas no momento.', 'warning')
      return
    }

    state.oficinas = oficinasRes.data || []
    state.osByOficina = osRes.error ? new Map() : buildOSStats(osRes.data || [])
    state.clientesByOficina = clientesRes.error ? new Map() : aggregateByOficina(clientesRes.data || [])
    state.usuariosByOficina = usuariosRes.error ? new Map() : aggregateByOficina(usuariosRes.data || [])

    if (osRes.error || clientesRes.error || usuariosRes.error) {
      showFeedback('Alguns dados do painel nao puderam ser carregados.', 'warning')
    }

    renderAll()
  } catch (error) {
    console.log('[admin] Erro inesperado ao carregar painel:', error)
    state.oficinas = []
    state.osByOficina = new Map()
    state.clientesByOficina = new Map()
    state.usuariosByOficina = new Map()
    renderAll()
    showFeedback('Nao foi possivel carregar o painel no momento.', 'warning')
  }
}

async function updatePlano(oficinaId, plano) {
  hideFeedback()
  const newPlano = normalizePlano(plano)
  const payload = { plano: newPlano, status: 'aprovado' }

  if (state.supportsTrialColumns) {
    payload.plano_status = newPlano === 'TRIAL' ? 'trial' : 'ativo'
    payload.trial_fim = newPlano === 'TRIAL'
      ? new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10)
      : null
  }

  const { error } = await supabase
    .from('oficinas')
    .update(payload)
    .eq('id', oficinaId)

  if (error) {
    showFeedback('Nao foi possivel atualizar o plano da oficina.', 'danger')
    return
  }

  showFeedback(`Plano atualizado para "${newPlano}".`, 'success')
  await loadOficinas()
  populateDetalhes(oficinaId)
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
btnBloquearOficina.addEventListener('click', async () => {
  const oficinaId = btnBloquearOficina.dataset.oficinaId
  if (!oficinaId) return
  await updateStatus(oficinaId, 'rejeitado')
  detalhesModal?.hide()
})

btnSalvarPlano.addEventListener('click', async () => {
  const oficinaId = btnSalvarPlano.dataset.oficinaId
  if (!oficinaId) return
  await updatePlano(oficinaId, detalhesPlanoSelect.value)
})

btnUpgradeMensal.addEventListener('click', async () => {
  const oficinaId = btnUpgradeMensal.dataset.oficinaId
  if (!oficinaId) return
  await updatePlano(oficinaId, 'MENSAL')
})

oficinaConfigForm.addEventListener('submit', saveOficinaConfig)

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
    return
  }

  if (action === 'config') {
    openConfigModal(oficinaId)
  }
})

async function initAdminPanel() {
  const allowed = await protectRoute()
  if (!allowed) return
  await loadOficinas()
}

initAdminPanel()
