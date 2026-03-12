// ============================================
// MIGRATION SQL (rodar manualmente no Supabase SQL Editor se necessario):
// ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente';
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================
// GUARDS: verificar autenticacao + role
// ============================================
async function verificarAcesso() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { window.location.href = 'login.html'; return false }

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

// ============================================
// CARREGAR OFICINAS
// ============================================
async function carregarOficinas() {
  const tbody = document.getElementById('oficinasTableBody')
  tbody.innerHTML = '<tr class="loading-row"><td colspan="5"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</td></tr>'

  const { data: oficinas, error } = await supabase
    .from('oficinas')
    .select('id, nome, cnpj, email, status')
    .order('nome')

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#e74c3c;padding:24px">Erro ao carregar oficinas: ${error.message}</td></tr>`
    return
  }

  if (!oficinas || oficinas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:24px">Nenhuma oficina cadastrada.</td></tr>'
    return
  }

  tbody.innerHTML = oficinas.map(o => `
    <tr>
      <td><strong>${escHtml(o.nome || '—')}</strong></td>
      <td>${escHtml(o.cnpj || '—')}</td>
      <td>${escHtml(o.email || '—')}</td>
      <td>${badgeStatus(o.status)}</td>
      <td>
        <button class="btn-aprovar" onclick="aprovarOficina('${o.id}')" ${o.status === 'aprovado' ? 'disabled' : ''}>
          <i class="fas fa-check me-1"></i>Aprovar
        </button>
        <button class="btn-rejeitar" onclick="rejeitarOficina('${o.id}')" ${o.status === 'rejeitado' ? 'disabled' : ''}>
          <i class="fas fa-times me-1"></i>Rejeitar
        </button>
      </td>
    </tr>
  `).join('')
}

function badgeStatus(status) {
  const map = {
    pendente:  '<span class="badge-status badge-pendente">pendente</span>',
    aprovado:  '<span class="badge-status badge-aprovado">aprovado</span>',
    rejeitado: '<span class="badge-status badge-rejeitado">rejeitado</span>'
  }
  return map[status] || `<span class="badge-status badge-pendente">${escHtml(status || 'pendente')}</span>`
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ============================================
// ACOES: APROVAR / REJEITAR
// ============================================
async function aprovarOficina(id) {
  await setStatusOficina(id, 'aprovado')
}

async function rejeitarOficina(id) {
  await setStatusOficina(id, 'rejeitado')
}

async function setStatusOficina(id, novoStatus) {
  const { error } = await supabase
    .from('oficinas')
    .update({ status: novoStatus })
    .eq('id', id)

  if (error) {
    showToastAdmin(`Erro: ${error.message}`, '#e74c3c')
    return
  }

  showToastAdmin(
    novoStatus === 'aprovado' ? '✅ Oficina aprovada com sucesso!' : '❌ Oficina rejeitada.',
    novoStatus === 'aprovado' ? '#27ae60' : '#c0392b'
  )
  await carregarOficinas()
}

// ============================================
// LOGOUT
// ============================================
async function adminLogout() {
  await supabase.auth.signOut()
  localStorage.removeItem('checkauto_user')
  sessionStorage.removeItem('checkauto_user')
  window.location.href = 'login.html'
}

// ============================================
// TOAST
// ============================================
function showToastAdmin(msg, color = '#27ae60') {
  const t = document.createElement('div')
  t.className = 'toast-admin'
  t.style.background = color
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3500)
}

// ============================================
// EXPORTS GLOBAIS (botoes no HTML usam onclick)
// ============================================
window.carregarOficinas = carregarOficinas
window.aprovarOficina   = aprovarOficina
window.rejeitarOficina  = rejeitarOficina
window.adminLogout      = adminLogout

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const ok = await verificarAcesso()
  if (ok) await carregarOficinas()
})
