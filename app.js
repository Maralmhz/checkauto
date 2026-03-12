// ============================================
// SUPABASE CONFIG
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
window._supabase = supabase;

// ============================================
// ESTADO GLOBAL
// ============================================
const AppState = {
    currentPage: 'dashboard',
    user: null,
    oficina: {
        nome: '', nomeExibicao: '', subtitulo: '',
        endereco: '', telefone: '', cnpj: '', email: '',
        site: '', corPrimaria: '#27ae60',
        rodapePDF: 'Obrigado pela preferencia!',
        logo: 'logo-default.png'
    },
    data: {
        clientes: [], veiculos: [], ordensServico: [],
        agendamentos: [], contasReceber: [],
        contasPagar: [], contasFixas: [], checklists: []
    }
};

// ============================================
// VERIFICAR AUTENTICACAO
// ============================================
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, role, oficina_id')
            .eq('id', session.user.id)
            .single();

        if (error || !usuario) {
            console.warn('Usuario nao encontrado na tabela usuarios');
            return false;
        }

        AppState.user = {
            id:         usuario.id,
            email:      usuario.email || session.user.email,
            nome:       usuario.nome  || session.user.email.split('@')[0],
            role:       usuario.role  || 'user',
            oficina_id: usuario.oficina_id,
            loginTime:  new Date().toISOString()
        };

        sessionStorage.setItem('checkauto_user', JSON.stringify(AppState.user));
        return true;
    } catch(e) {
        console.warn('Erro ao verificar sessao:', e);
        return false;
    }
}

// ============================================
// CARREGAR DADOS DO SUPABASE
// ============================================
async function loadFromSupabase() {
    try {
        const [
            { data: clientes,      error: errC  },
            { data: veiculos,      error: errV  },
            { data: ordensServico, error: errOS },
            { data: agendamentos,  error: errAG },
            { data: contasPagar,   error: errCP },
            { data: contasReceber, error: errCR },
            { data: contasFixas,   error: errCF },
            { data: checklists,    error: errCK }
        ] = await Promise.all([
            supabase.from('clientes').select('*').order('nome'),
            supabase.from('veiculos').select('*').order('modelo'),
            supabase.from('ordens_servico').select('*, os_servicos(*)').order('created_at', { ascending: false }),
            supabase.from('agendamentos').select('*').order('data', { ascending: true }),
            supabase.from('contas_pagar').select('*').order('vencimento', { ascending: true }),
            supabase.from('contas_receber').select('*').order('vencimento', { ascending: true }),
            supabase.from('contas_fixas').select('*').order('dia_vencimento', { ascending: true }),
            supabase.from('checklists').select('*').order('created_at', { ascending: false })
        ]);

        if (errC)  throw errC;
        if (errV)  throw errV;
        if (errOS) throw errOS;
        if (errAG) throw errAG;
        if (errCP) throw errCP;
        if (errCR) throw errCR;
        if (errCF) throw errCF;
        if (errCK) throw errCK;

        AppState.data.clientes = clientes || [];
        AppState.data.veiculos = (veiculos || []).map(v => ({ ...v, clienteId: v.cliente_id }));
        AppState.data.ordensServico = (ordensServico || []).map(os => ({
            ...os,
            clienteId:     os.cliente_id,
            veiculoId:     os.veiculo_id,
            valorTotal:    os.valor_total,
            dataConclusao: os.data_conclusao,
            servicos: (os.os_servicos || []).map(s => ({ id: s.id, descricao: s.descricao, valor: s.valor }))
        }));
        AppState.data.agendamentos = (agendamentos || []).map(a => ({
            ...a,
            clienteId:   a.cliente_id,
            veiculoId:   a.veiculo_id,
            tipoServico: a.tipo_servico
        }));
        AppState.data.contasPagar   = contasPagar || [];
        AppState.data.contasReceber = (contasReceber || []).map(c => ({
            ...c,
            osId:              c.os_id,
            osNumero:          c.os_numero,
            pagadorTipo:       c.pagador_tipo,
            pagadorNome:       c.pagador_nome,
            formaPagamento:    c.forma_pagamento,
            parcelasTotal:     c.parcelas_total,
            parcelasRecebidas: c.parcelas_recebidas,
            valorRecebido:     c.valor_recebido
        }));
        AppState.data.contasFixas = (contasFixas || []).map(c => ({
            ...c,
            valorMensal:   c.valor_mensal,
            diaVencimento: c.dia_vencimento,
            pagoEsteMes:   c.pago_este_mes
        }));
        AppState.data.checklists = checklists || [];

        console.log('Dados carregados:', {
            clientes:     AppState.data.clientes.length,
            veiculos:     AppState.data.veiculos.length,
            os:           AppState.data.ordensServico.length,
            agendamentos: AppState.data.agendamentos.length
        });
    } catch (e) {
        console.error('Erro ao carregar dados do Supabase:', e);
        showToast('Erro ao carregar dados! Verifique a conexao.', 'error');
    }
}

function saveToLocalStorage() {}
function loadFromLocalStorage() {}


function applyOficinaStatusGate() {
    const hasStatusField = Object.prototype.hasOwnProperty.call(AppState.oficina || {}, 'status');
    const status = AppState.oficina?.status;

    if (!hasStatusField || (status !== 'pendente' && status !== 'rejeitado')) {
        return false;
    }

    const messages = {
        pendente: 'Sua oficina está aguardando aprovação. Em breve você receberá uma confirmação.',
        rejeitado: 'Seu cadastro foi rejeitado. Entre em contato com o suporte.'
    };

    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fb;padding:24px;">
            <div style="max-width:680px;width:100%;background:#fff;border-radius:12px;box-shadow:0 6px 30px rgba(0,0,0,.08);padding:32px;text-align:center;">
                <h1 style="margin:0 0 12px;font-size:1.6rem;color:#1f2937;">CheckAuto</h1>
                <p style="margin:0;font-size:1.05rem;color:#4b5563;">${messages[status]}</p>
            </div>
        </div>
    `;

    return true;
}


// ============================================
// INICIALIZACAO
// ============================================
async function initApp() {
    console.log('Iniciando CheckAuto...');

    const autenticado = await checkAuth();
    if (!autenticado) {
        window.location.href = 'login.html';
        return;
    }

    // Carrega oficina no boot para logo, cor e nome aparecerem imediatamente
    if (typeof carregarOficinaDoDB === 'function') {
        try {
            const oficina = await carregarOficinaDoDB();
            if (oficina && typeof aplicarWhiteLabel === 'function') {
                aplicarWhiteLabel(oficina);
                if (Object.prototype.hasOwnProperty.call(oficina, 'status')) {
                    AppState.oficina.status = oficina.status;
                }
            }
        } catch(e) {
            console.warn('Nao foi possivel carregar oficina no boot:', e);
        }
    }

    if (applyOficinaStatusGate()) return;

    await loadFromSupabase();

    updateDashboard();
    updateOficinaNome();
    renderRecentOS();
    updateUserInfo();
    renderClientes();
    renderVeiculos();
    renderOrdensServico();

    if (typeof initFinanceiro === 'function') {
        try { await initFinanceiro(); } catch (e) { console.error('Erro financeiro:', e); }
    }
    if (typeof setupDashboardCards === 'function') setupDashboardCards();

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
    });

    console.log('CheckAuto inicializado!');
}

function updateUserInfo() {
    if (!AppState.user) return;
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl) userNameEl.textContent = AppState.user.nome;
    if (userRoleEl) userRoleEl.textContent = AppState.user.role;
}

// ============================================
// NAVEGACAO
// ============================================
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        AppState.currentPage = page;

        if (page === 'ordens-servico') renderOrdensServico();
        else if (page === 'agendamento') renderAgendamentos();
        else if (page === 'financeiro' && typeof renderFinanceiroDashboard === 'function') {
            renderFinanceiroDashboard();
            renderContasPagar();
            renderContasReceber();
            renderContasFixas();
            renderFluxoCaixa();
        }
        if (page === 'configuracoes' && typeof initConfiguracoes === 'function') initConfiguracoes();
    }
    if (window.innerWidth <= 768) toggleSidebar();
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
    document.getElementById('sidebarOverlay')?.classList.toggle('active');
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    const { ordensServico, clientes, veiculos, agendamentos } = AppState.data;
    const el = (id) => document.getElementById(id);

    if (el('osAbertas'))     el('osAbertas').textContent     = ordensServico.filter(os => os.status !== 'concluida').length;
    if (el('osHoje'))        el('osHoje').textContent        = ordensServico.filter(os => isToday(os.data)).length;
    if (el('totalClientes')) el('totalClientes').textContent = clientes.length;
    if (el('totalVeiculos')) el('totalVeiculos').textContent = veiculos.length;

    const totalReceber = (AppState.data.contasReceber || [])
        .filter(c => ['aberta','parcial','atrasada','pendente'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Math.max(0, Number(c.valor||0) - Number(c.valorRecebido||c.valor_recebido||0)), 0);

    const totalPagar = (AppState.data.contasPagar || [])
        .filter(c => ['aberta','atrasada','pendente'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Number(c.valor||0), 0);

    const totalFixas = (AppState.data.contasFixas || [])
        .filter(c => !(c.pagoEsteMes||c.pago_este_mes))
        .reduce((sum, c) => sum + Number(c.valorMensal||c.valor_mensal||0), 0);

    if (el('contasReceber')) el('contasReceber').textContent = formatMoney(totalReceber);
    if (el('contasPagar'))   el('contasPagar').textContent   = formatMoney(totalPagar + totalFixas);

    const agendamentosHoje = (agendamentos||[]).filter(a => isToday(a.data) && a.status !== 'atendido').length;
    if (el('agendamentosHoje')) el('agendamentosHoje').textContent = agendamentosHoje;

    const faturamento = ordensServico
        .filter(os => isCurrentMonth(os.data) && os.status === 'concluida')
        .reduce((sum, os) => sum + Number(os.valorTotal||os.valor_total||0), 0);
    if (el('faturamentoMes')) el('faturamentoMes').textContent = formatMoney(faturamento);
}

function renderRecentOS() {
    const tbody = document.getElementById('recentOSTable');
    if (!tbody) return;
    const list = AppState.data.ordensServico.slice(0, 5);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma OS registrada ainda</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(os => `
        <tr>
            <td><strong>${os.numero}</strong></td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td>${getStatusBadge(os.status)}</td>
            <td>${formatDate(os.data)}</td>
            <td><button class="btn-icon" onclick="viewOS('${os.id}')" title="Ver"><i class="fas fa-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const badges = {
        'aguardando':   '<span class="badge badge-warning">Aguardando</span>',
        'em_andamento': '<span class="badge badge-info">Em Andamento</span>',
        'concluida':    '<span class="badge badge-success">Concluida</span>',
        'cancelada':    '<span class="badge badge-danger">Cancelada</span>'
    };
    return badges[status] || status;
}

function updateOficinaNome() {
    const nome      = AppState.oficina.nomeExibicao || AppState.oficina.nome || 'CheckAuto';
    const subtitulo = AppState.oficina.subtitulo || 'Sistema de Gestao';
    const el = id => document.getElementById(id);
    if (el('oficinaNome'))        el('oficinaNome').textContent        = nome;
    if (el('sidebarNomeSistema')) el('sidebarNomeSistema').textContent = nome;
    if (el('oficinaSubtitulo'))   el('oficinaSubtitulo').textContent   = subtitulo;
}

async function logout() {
    if (!confirm('Deseja realmente sair?')) return;
    await supabase.auth.signOut();
    localStorage.removeItem('checkauto_user');
    sessionStorage.removeItem('checkauto_user');
    window.location.href = 'login.html';
}

// ============================================
// HELPERS
// ============================================
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
}
function isToday(dateString) {
    if (!dateString) return false;
    return new Date(dateString + 'T00:00:00').toDateString() === new Date().toDateString();
}
function isCurrentMonth(dateString) {
    if (!dateString) return false;
    const d = new Date(dateString + 'T00:00:00'), t = new Date();
    return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    const colors = { success:'#27ae60', error:'#e74c3c', info:'#3498db', warning:'#f39c12' };
    Object.assign(toast.style, {
        position:'fixed', bottom:'20px', right:'20px',
        padding:'12px 20px', borderRadius:'8px', color:'#fff',
        fontWeight:'500', zIndex:'9999',
        background: colors[type] || colors.info
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ============================================
// EXPORTS GLOBAIS
// ============================================
window.AppState           = AppState;
window.supabase           = supabase;
window.formatMoney        = formatMoney;
window.formatDate         = formatDate;
window.isToday            = isToday;
window.isCurrentMonth     = isCurrentMonth;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromSupabase   = loadFromSupabase;
window.navigateTo         = navigateTo;
window.toggleSidebar      = toggleSidebar;
window.logout             = logout;
window.getStatusBadge     = getStatusBadge;
window.updateDashboard    = updateDashboard;
window.renderRecentOS     = renderRecentOS;
window.updateOficinaNome  = updateOficinaNome;
window.showToast          = showToast;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
