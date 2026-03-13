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
        logo: 'logo-default.png',
        plano: 'TRIAL', plano_status: 'trial', trial_fim: null, created_at: null
    },
    data: {
        clientes: [], veiculos: [], ordensServico: [],
        agendamentos: [], contasReceber: [],
        contasPagar: [], contasFixas: [], checklists: [],
        estoque: [], movimentosEstoque: [], fornecedores: [], funcionarios: []
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

function applyOficinaScope(query) {
    if (AppState.user?.role === 'superadmin') return query;
    const oficinaId = AppState.user?.oficina_id;
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}

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
            { data: checklists,    error: errCK },
            { data: estoque,       error: errES },
            { data: movimentosEstoque, error: errME },
            { data: fornecedores,  error: errFO },
            { data: funcionarios,  error: errFU }
        ] = await Promise.all([
            applyOficinaScope(supabase.from('clientes').select('*')).order('nome'),
            applyOficinaScope(supabase.from('veiculos').select('*')).order('modelo'),
            applyOficinaScope(supabase.from('ordens_servico').select('*, os_servicos(*)')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('agendamentos').select('*')).order('data', { ascending: true }),
            applyOficinaScope(supabase.from('contas_pagar').select('*')).order('vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('contas_receber').select('*')).order('vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('contas_fixas').select('*')).order('dia_vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('checklists').select('*')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('estoque').select('*')).order('nome'),
            applyOficinaScope(supabase.from('movimentos_estoque').select('*')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('fornecedores').select('*')).order('nome'),
            applyOficinaScope(supabase.from('usuarios').select('*')).order('nome')
        ]);

        if (errC)  throw errC;
        if (errV)  throw errV;
        if (errOS) throw errOS;
        if (errAG) throw errAG;
        if (errCP) throw errCP;
        if (errCR) throw errCR;
        if (errCF) throw errCF;
        if (errCK) throw errCK;
        if (errES) throw errES;
        if (errME) throw errME;
        if (errFO) throw errFO;
        if (errFU) throw errFU;

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
        AppState.data.estoque = estoque || [];
        AppState.data.movimentosEstoque = movimentosEstoque || [];
        AppState.data.fornecedores = fornecedores || [];
        AppState.data.funcionarios = (funcionarios || []).map(f => ({ ...f, comissao: Number(f.comissao || 0) }));

        console.log('Dados carregados:', {
            clientes:     AppState.data.clientes.length,
            veiculos:     AppState.data.veiculos.length,
            os:           AppState.data.ordensServico.length,
            agendamentos: AppState.data.agendamentos.length,
            estoque: AppState.data.estoque.length,
            fornecedores: AppState.data.fornecedores.length,
            funcionarios: AppState.data.funcionarios.length
        });
    } catch (e) {
        console.error('Erro ao carregar dados do Supabase:', e);
        showToast('Erro ao carregar dados! Verifique a conexao.', 'error');
    }
}

function saveToLocalStorage() {}
function loadFromLocalStorage() {}


function getTodayISODate() {
    return new Date().toISOString().slice(0, 10);
}

function shouldShowTrialPopupToday(oficinaId) {
    const key = `checkauto_trial_popup_last_${oficinaId}`;
    const today = getTodayISODate();
    if (localStorage.getItem(key) === today) return false;
    localStorage.setItem(key, today);
    return true;
}

function closeTrialPopup() {
    document.getElementById('trialUpsellOverlay')?.remove();
}

async function ativarPlanoUpgrade(novoPlano) {
    const oficinaId = AppState.user?.oficina_id;
    if (!oficinaId) return;

    const plano = String(novoPlano || '').toUpperCase();
    const payload = {
        plano,
        plano_status: 'ativo',
        trial_fim: null,
        status: 'aprovado'
    };

    const { error } = await supabase.from('oficinas').update(payload).eq('id', oficinaId);
    if (error) {
        console.error('Erro ao ativar upgrade:', error);
        showToast('Nao foi possivel concluir o upgrade agora.', 'error');
        return;
    }

    AppState.oficina = Object.assign({}, AppState.oficina, payload);
    closeTrialPopup();
    showToast(`Plano ${plano} ativado com sucesso!`, 'success');
}

function renderTrialPopup(oficina) {
    if (document.getElementById('trialUpsellOverlay')) return;

    const vencido = (oficina?.plano_status || '').toLowerCase() === 'vencido' || (oficina?.status || '').toLowerCase() === 'vencido';
    const titulo = vencido ? '⚠️ TRIAL VENCEU: FAÇA UPGRADE AGORA!' : '🚀 ATIVE CHECKAUTO PRO JÁ!';

    const overlay = document.createElement('div');
    overlay.id = 'trialUpsellOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(8,10,16,.72);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:20px;max-width:780px;width:100%;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.4);font-family:Segoe UI,Tahoma,sans-serif;';
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;">
            <div>
                <h2 style="margin:0 0 6px;color:#111827;">${titulo}</h2>
                <p style="margin:0;color:#4b5563;font-size:1.1rem;">Transforme sua oficina em 2026!</p>
            </div>
            <button id="btnCloseTrialPopup" style="border:none;background:#eef2f7;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px;">×</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px;">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px;"><strong>ANTES 📄</strong><p style="margin:6px 0 0;color:#6b7280;">Papel perdido, tempo gasto, peças quebradas pré-existentes.</p></div>
            <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:12px;"><strong>DEPOIS ⚡</strong><p style="margin:6px 0 0;color:#6b7280;">Digital, rápido, seguro e mais faturamento.</p></div>
        </div>

        <div style="margin-top:16px;display:grid;gap:10px;">
            <div>✅ TRIAL 15 dias (usando)</div>
            <div>💎 MENSAL R$99,90 → Relatórios + Estoque ilimitado</div>
            <div>💎 ANUAL R$999,90 → Economia R$197! Suporte VIP 🔥</div>
        </div>

        <ul style="margin:16px 0 18px 18px;color:#1f2937;line-height:1.6;">
            <li>✅ Sem papel perdido</li>
            <li>✅ Reduz 70% tempo OS</li>
            <li>✅ Zero peças quebradas pré-existentes</li>
            <li>✅ Relatórios faturamento real-time</li>
            <li>✅ Estoque inteligente alertas</li>
        </ul>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button id="btnTrialMensal" style="padding:12px 16px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">ATIVAR MENSAL</button>
            <button id="btnTrialAnual" style="padding:12px 16px;border:none;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer;">ATIVAR ANUAL</button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('btnCloseTrialPopup')?.addEventListener('click', closeTrialPopup);
    document.getElementById('btnTrialMensal')?.addEventListener('click', () => ativarPlanoUpgrade('MENSAL'));
    document.getElementById('btnTrialAnual')?.addEventListener('click', () => ativarPlanoUpgrade('ANUAL'));
}

async function enforceTrialAndPopup() {
    const oficinaId = AppState.user?.oficina_id;
    if (!oficinaId) return;

    const plano = String(AppState.oficina?.plano || 'TRIAL').toUpperCase();
    const today = getTodayISODate();
    const trialFim = AppState.oficina?.trial_fim;

    if (plano === 'TRIAL' && trialFim && trialFim < today) {
        const { error } = await supabase.from('oficinas').update({ plano_status: 'vencido', status: 'vencido' }).eq('id', oficinaId);
        if (!error) {
            AppState.oficina.plano_status = 'vencido';
            AppState.oficina.status = 'vencido';
        }
    }

    const isTrial = plano === 'TRIAL';
    const isExpired = String(AppState.oficina?.plano_status || '').toLowerCase() === 'vencido' || String(AppState.oficina?.status || '').toLowerCase() === 'vencido';

    if ((isTrial || isExpired) && shouldShowTrialPopupToday(oficinaId)) {
        renderTrialPopup(AppState.oficina);
    }
}



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
                AppState.oficina = Object.assign({}, AppState.oficina, {
                    id: oficina.id,
                    status: oficina.status,
                    plano: oficina.plano || 'TRIAL',
                    plano_status: oficina.plano_status || 'trial',
                    trial_fim: oficina.trial_fim || null,
                    created_at: oficina.created_at || null
                });
            }
        } catch(e) {
            console.warn('Nao foi possivel carregar oficina no boot:', e);
        }
    }

    if (applyOficinaStatusGate()) return;

    await loadFromSupabase();
    await enforceTrialAndPopup();

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
    if (typeof initPR13Tabs === 'function') initPR13Tabs();

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
        else if (typeof renderPR13Page === 'function') renderPR13Page(page);
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
