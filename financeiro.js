// ============================================
// MODULO FINANCEIRO — Supabase
// ============================================
async function _getSupabaseFIN() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

let editingContaPagarId = null;
let editingContaReceberId = null;
let editingContaFixaId = null;
let financeiroAbaAtual = 'pagar';


function _getOficinaIdFIN() {
    return window.AppState?.user?.oficina_id || null;
}

function _isSuperadminFIN() {
    return window.AppState?.user?.role === 'superadmin';
}

function _scopeFinanceiroQuery(query) {
    if (_isSuperadminFIN()) return query;
    const oficinaId = _getOficinaIdFIN();
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}


// ============================================
// INIT
// ============================================
async function initFinanceiro() {
    ensureFinanceiroData();
    await syncContasReceberFromOS();
    renderFinanceiroDashboard();
    renderContasPagar();
    renderContasReceber();
    renderContasFixas();
    renderFluxoCaixa();
    updateDashboard();
}

function ensureFinanceiroData() {
    if (!Array.isArray(AppState.data.contasPagar)) AppState.data.contasPagar = [];
    if (!Array.isArray(AppState.data.contasReceber)) AppState.data.contasReceber = [];
    if (!Array.isArray(AppState.data.contasFixas)) AppState.data.contasFixas = [];
}

// ============================================
// HELPERS
// ============================================
function getCompetenciaAtual() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getContaFixaCompetencia(contaFixa, competencia = getCompetenciaAtual()) {
    const [ano, mes] = competencia.split('-').map(Number);
    const dia = Math.min(31, Math.max(1, Number(contaFixa.diaVencimento || contaFixa.dia_vencimento || 1)));
    const vencimento = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return {
        id: `fixa-${contaFixa.id}-${competencia}`,
        source: 'fixa',
        contaFixaId: contaFixa.id,
        fornecedor: contaFixa.descricao,
        valor: Number(contaFixa.valorMensal || contaFixa.valor_mensal || 0),
        vencimento,
        status: (contaFixa.pagoEsteMes || contaFixa.pago_este_mes) ? 'paga' : 'aberta',
        categoria: contaFixa.categoria || 'fixa',
        observacao: 'Gerada automaticamente'
    };
}

function getContasPagarComFixas() {
    const competencia = getCompetenciaAtual();
    const contasNormais = (AppState.data.contasPagar || []).map(c => ({ ...c, source: c.source || 'manual' }));
    const fixasGeradas = (AppState.data.contasFixas || []).map(c => getContaFixaCompetencia(c, competencia));
    return [...contasNormais, ...fixasGeradas];
}

function getContaPagarEditAction(conta) {
    if (conta.source === 'fixa') return `openContaFixaModal('${conta.contaFixaId}')`;
    return `openContaPagarModal('${conta.id}')`;
}

function getStatusReceberByParcelas(parcelasRecebidas, parcelasTotal, vencimento) {
    const hoje = new Date();
    const venc = vencimento ? new Date(vencimento + 'T00:00:00') : null;
    if (parcelasRecebidas >= parcelasTotal) return 'recebida';
    if (parcelasRecebidas > 0) return 'parcial';
    if (venc && venc < hoje) return 'atrasada';
    return 'aberta';
}

function getBadgeFinanceiro(status, vencimento) {
    const s = status || 'aberta';
    if (s === 'aberta' && vencimento && new Date(vencimento + 'T00:00:00') < new Date())
        return '<span class="badge badge-danger">Vencida</span>';
    const badges = {
        aberta: '<span class="badge badge-warning">Aberta</span>',
        parcial: '<span class="badge badge-info">Parcial</span>',
        recebida: '<span class="badge badge-success">Recebida</span>',
        paga: '<span class="badge badge-success">Paga</span>',
        atrasada: '<span class="badge badge-danger">Atrasada</span>'
    };
    return badges[s] || badges.aberta;
}

function parseMoneyInput(value) {
    if (!value) return 0;
    return Number(String(value).replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
}

function formatMoneyInput(value) { return formatMoney(Number(value || 0)); }
function capitalize(v) { return v ? v.charAt(0).toUpperCase() + v.slice(1) : ''; }

// ============================================
// SYNC OS → CONTAS RECEBER
// ============================================
async function syncContasReceberFromOS() {
    ensureFinanceiroData();
    const ordens = AppState.data.ordensServico || [];
    const sb = await _getSupabaseFIN();

    for (const os of ordens) {
        if (!os || os.status === 'cancelada') continue;
        const valorTotal = Number(os.valorTotal || os.valor_total || 0);
        if (valorTotal <= 0) continue;

        const osId = os.id;
        const existente = AppState.data.contasReceber.find(c => c.origem === 'os' && String(c.osId || c.os_id) === String(osId));
        const contaOS = {
            origem: 'os',
            os_id: osId,
            os_numero: os.numero || osId,
            cliente: os.cliente || '-',
            pagador_tipo: os.pagadorTipo || 'cliente',
            pagador_nome: os.pagadorNome || os.cliente || 'Cliente',
            forma_pagamento: os.formaPagamento || 'a_definir',
            parcelas_total: 1,
            parcelas_recebidas: 0,
            valor: valorTotal,
            valor_recebido: 0,
            vencimento: os.vencimentoRecebimento || os.data,
            status: 'aberta',
            observacao: os.observacaoFinanceira || ''
        };

        if (!existente) {
            const { data, error } = await sb.from('contas_receber').insert({ ...contaOS, oficina_id: _getOficinaIdFIN() }).select().single();
            if (!error && data) {
                AppState.data.contasReceber.push(_normalizeContaReceber(data));
            }
        }
    }
}

function _normalizeContaReceber(c) {
    return {
        ...c,
        osId: c.os_id,
        osNumero: c.os_numero,
        pagadorTipo: c.pagador_tipo,
        pagadorNome: c.pagador_nome,
        formaPagamento: c.forma_pagamento,
        parcelasTotal: c.parcelas_total,
        parcelasRecebidas: c.parcelas_recebidas,
        valorRecebido: c.valor_recebido
    };
}

function _normalizeContaFixa(c) {
    return {
        ...c,
        valorMensal: c.valor_mensal,
        diaVencimento: c.dia_vencimento,
        pagoEsteMes: c.pago_este_mes
    };
}

// ============================================
// DASHBOARD
// ============================================
function renderFinanceiroDashboard() {
    ensureFinanceiroData();
    const totalPagar = getContasPagarComFixas()
        .filter(c => ['aberta', 'atrasada'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    const totalReceber = (AppState.data.contasReceber || [])
        .filter(c => ['aberta', 'parcial', 'atrasada'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Math.max(0, Number(c.valor || 0) - Number(c.valorRecebido || c.valor_recebido || 0)), 0);
    const saldo = calcularSaldo();
    const el = (id) => document.getElementById(id);
    if (el('totalPagar')) el('totalPagar').textContent = formatMoney(totalPagar);
    if (el('totalReceber')) el('totalReceber').textContent = formatMoney(totalReceber);
    if (el('saldoFinanceiro')) el('saldoFinanceiro').textContent = formatMoney(saldo);
}

function calcularSaldo() {
    const entradas = (AppState.data.contasReceber || []).reduce((sum, c) => sum + Number(c.valorRecebido || c.valor_recebido || 0), 0);
    const saidas = getContasPagarComFixas().filter(c => c.status === 'paga').reduce((sum, c) => sum + Number(c.valor || 0), 0);
    return entradas - saidas;
}

// ============================================
// RENDER CONTAS A PAGAR
// ============================================
function renderContasPagar() {
    const tbody = document.getElementById('contasPagarTableBody');
    if (!tbody) return;
    const contas = filtrarContas('pagar', true);
    if (!contas.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma conta a pagar</td></tr>'; return; }
    tbody.innerHTML = contas.map(conta => `
        <tr>
            <td><strong>${conta.fornecedor}</strong><br><small>${conta.categoria || '-'}</small></td>
            <td>${formatMoney(conta.valor)}</td>
            <td>${formatDate(conta.vencimento)}</td>
            <td>${getBadgeFinanceiro(conta.status, conta.vencimento)}</td>
            <td>
                <button class="btn-icon" onclick="${getContaPagarEditAction(conta)}" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-success" onclick="pagarConta('${conta.id}')" title="Marcar como paga"><i class="fas fa-check"></i></button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// RENDER CONTAS A RECEBER
// ============================================
function renderContasReceber() {
    const tbody = document.getElementById('contasReceberTableBody');
    if (!tbody) return;
    const contas = filtrarContas('receber', true);
    if (!contas.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma conta a receber</td></tr>'; return; }
    tbody.innerHTML = contas.map(conta => {
        const falta = Math.max(0, Number(conta.valor || 0) - Number(conta.valorRecebido || conta.valor_recebido || 0));
        const parcelasTotal = conta.parcelasTotal || conta.parcelas_total || 1;
        const parcelasRecebidas = conta.parcelasRecebidas || conta.parcelas_recebidas || 0;
        return `
            <tr>
                <td><strong>${conta.osNumero || conta.os_numero || '-'}</strong> / ${conta.cliente || '-'}<br><small>${conta.pagadorNome || conta.pagador_nome || '-'}</small><br><small>${parcelasRecebidas}/${parcelasTotal} parcela(s)</small></td>
                <td>${formatMoney(conta.valor)}<br><small>Falta: ${formatMoney(falta)}</small></td>
                <td>${formatDate(conta.vencimento)}</td>
                <td>${getBadgeFinanceiro(conta.status, conta.vencimento)}</td>
                <td>
                    <button class="btn-icon" onclick="openContaReceberModal('${conta.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-success" onclick="receberConta('${conta.id}')" title="Receber parcela"><i class="fas fa-hand-holding-usd"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// RENDER CONTAS FIXAS
// ============================================
function renderContasFixas() {
    const tbody = document.getElementById('contasFixasTableBody');
    if (!tbody) return;
    const contas = filtrarContas('fixas', true);
    if (!contas.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma conta fixa</td></tr>'; return; }
    tbody.innerHTML = contas.map(conta => `
        <tr>
            <td><strong>${conta.descricao}</strong></td>
            <td>${formatMoney(conta.valorMensal || conta.valor_mensal || 0)}</td>
            <td>${conta.diaVencimento || conta.dia_vencimento}</td>
            <td><input type="checkbox" ${(conta.pagoEsteMes || conta.pago_este_mes) ? 'checked' : ''} onchange="toggleContaFixaPaga('${conta.id}', this.checked)"></td>
            <td>${conta.categoria || '-'}</td>
            <td><button class="btn-icon" onclick="openContaFixaModal('${conta.id}')" title="Editar"><i class="fas fa-edit"></i></button></td>
        </tr>
    `).join('');
}

// ============================================
// RENDER FLUXO DE CAIXA
// ============================================
function renderFluxoCaixa() {
    const tbody = document.getElementById('fluxoCaixaTableBody');
    if (!tbody) return;
    const fluxo = filtrarContas('fluxo', true);
    if (!fluxo.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum movimento</td></tr>'; return; }
    let saldoAcumulado = 0;
    tbody.innerHTML = fluxo.map(item => {
        saldoAcumulado += Number(item.entrada || 0) - Number(item.saida || 0);
        return `<tr><td>${formatDate(item.data)}</td><td>${item.entrada ? formatMoney(item.entrada) : '-'}</td><td>${item.saida ? formatMoney(item.saida) : '-'}</td><td>${formatMoney(saldoAcumulado)}</td><td>${item.observacao || '-'}</td></tr>`;
    }).join('');
}

// ============================================
// MODAL CONTAS A PAGAR
// ============================================
function openContaPagarModal(editId = null) {
    const modal = document.getElementById('contaPagarModal');
    const title = document.getElementById('contaPagarModalTitle');
    const form = document.getElementById('contaPagarForm');
    if (!modal) return;
    if (editId) {
        const conta = (AppState.data.contasPagar || []).find(c => String(c.id) === String(editId));
        if (!conta) return;
        editingContaPagarId = editId;
        title.textContent = 'Editar Conta a Pagar';
        document.getElementById('contaPagarFornecedor').value = conta.fornecedor || '';
        document.getElementById('contaPagarValor').value = formatMoneyInput(conta.valor);
        document.getElementById('contaPagarCategoria').value = conta.categoria || '';
        document.getElementById('contaPagarVencimento').value = conta.vencimento || '';
        document.getElementById('contaPagarObs').value = conta.observacao || '';
        const statusEl = document.getElementById('contaPagarStatus');
        if (statusEl) statusEl.value = conta.status || 'aberta';
    } else {
        editingContaPagarId = null;
        title.textContent = 'Nova Conta a Pagar';
        form.reset();
        const statusEl = document.getElementById('contaPagarStatus');
        if (statusEl) statusEl.value = 'aberta';
    }
    modal.classList.add('active');
}

function closeContaPagarModal() {
    const modal = document.getElementById('contaPagarModal');
    const form = document.getElementById('contaPagarForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    editingContaPagarId = null;
}

async function salvarContaPagar() {
    const form = document.getElementById('contaPagarForm');
    if (form && !form.reportValidity()) return;
    const conta = {
        fornecedor: document.getElementById('contaPagarFornecedor').value.trim(),
        valor: parseMoneyInput(document.getElementById('contaPagarValor').value),
        categoria: document.getElementById('contaPagarCategoria').value.trim(),
        vencimento: document.getElementById('contaPagarVencimento').value,
        observacao: document.getElementById('contaPagarObs').value.trim(),
        status: (document.getElementById('contaPagarStatus') || { value: 'aberta' }).value
    };
    const sb = await _getSupabaseFIN();
    if (editingContaPagarId) {
        const { error } = await _scopeFinanceiroQuery(sb.from('contas_pagar').update(conta)).eq('id', editingContaPagarId);
        if (error) { showToast('Erro ao atualizar!', 'error'); console.error(error); return; }
        const idx = AppState.data.contasPagar.findIndex(c => String(c.id) === String(editingContaPagarId));
        if (idx !== -1) AppState.data.contasPagar[idx] = { ...AppState.data.contasPagar[idx], ...conta };
    } else {
        const { data, error } = await sb.from('contas_pagar').insert({ ...conta, oficina_id: _getOficinaIdFIN() }).select().single();
        if (error) { showToast('Erro ao criar conta!', 'error'); console.error(error); return; }
        AppState.data.contasPagar.push(data);
    }
    persistAndRefreshFinanceiro('Conta a pagar salva!');
    closeContaPagarModal();
}

// ============================================
// MODAL CONTAS A RECEBER
// ============================================
function popularSelectOS() {
    const select = document.getElementById('contaReceberOS');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione uma OS</option>' +
        (AppState.data.ordensServico || []).map(os => `<option value="${os.id}">${os.numero} - ${os.cliente}</option>`).join('');
}

function openContaReceberModal(editId = null) {
    popularSelectOS();
    const modal = document.getElementById('contaReceberModal');
    const title = document.getElementById('contaReceberModalTitle');
    const form = document.getElementById('contaReceberForm');
    if (!modal) return;
    if (editId) {
        const conta = (AppState.data.contasReceber || []).find(c => String(c.id) === String(editId));
        if (!conta) return;
        editingContaReceberId = editId;
        title.textContent = 'Editar Conta a Receber';
        document.getElementById('contaReceberOS').value = conta.osId || conta.os_id || '';
        document.getElementById('contaReceberValor').value = formatMoneyInput(conta.valor);
        document.getElementById('contaReceberVencimento').value = conta.vencimento || '';
        document.getElementById('contaReceberObs').value = conta.observacao || '';
        document.getElementById('contaReceberPagadorTipo').value = conta.pagadorTipo || conta.pagador_tipo || 'cliente';
        document.getElementById('contaReceberPagadorNome').value = conta.pagadorNome || conta.pagador_nome || '';
        document.getElementById('contaReceberFormaPagamento').value = conta.formaPagamento || conta.forma_pagamento || 'a_definir';
        document.getElementById('contaReceberParcelasTotal').value = conta.parcelasTotal || conta.parcelas_total || 1;
        document.getElementById('contaReceberParcelasRecebidas').value = conta.parcelasRecebidas || conta.parcelas_recebidas || 0;
        document.getElementById('contaReceberStatus').value = conta.status || 'aberta';
    } else {
        editingContaReceberId = null;
        title.textContent = 'Nova Conta a Receber';
        form.reset();
        document.getElementById('contaReceberParcelasTotal').value = 1;
        document.getElementById('contaReceberParcelasRecebidas').value = 0;
        document.getElementById('contaReceberStatus').value = 'aberta';
    }
    modal.classList.add('active');
}

function closeContaReceberModal() {
    const modal = document.getElementById('contaReceberModal');
    const form = document.getElementById('contaReceberForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    editingContaReceberId = null;
}

async function salvarContaReceber() {
    const form = document.getElementById('contaReceberForm');
    if (form && !form.reportValidity()) return;
    const osId = document.getElementById('contaReceberOS').value;
    const osData = (AppState.data.ordensServico || []).find(os => String(os.id) === String(osId));
    const parcelasTotal = Math.max(1, Number(document.getElementById('contaReceberParcelasTotal').value || 1));
    const parcelasRecebidas = Math.min(parcelasTotal, Math.max(0, Number(document.getElementById('contaReceberParcelasRecebidas').value || 0)));
    const valor = parseMoneyInput(document.getElementById('contaReceberValor').value);
    const valorRecebido = Number(((valor / parcelasTotal) * parcelasRecebidas).toFixed(2));
    const statusVal = document.getElementById('contaReceberStatus').value;
    const conta = {
        origem: 'manual',
        os_id: osId || null,
        os_numero: osData ? osData.numero : osId,
        cliente: osData ? osData.cliente : 'Cliente nao informado',
        pagador_tipo: document.getElementById('contaReceberPagadorTipo').value,
        pagador_nome: document.getElementById('contaReceberPagadorNome').value.trim(),
        forma_pagamento: document.getElementById('contaReceberFormaPagamento').value,
        parcelas_total: parcelasTotal,
        parcelas_recebidas: parcelasRecebidas,
        valor,
        valor_recebido: statusVal === 'recebida' ? valor : valorRecebido,
        vencimento: document.getElementById('contaReceberVencimento').value,
        observacao: document.getElementById('contaReceberObs').value.trim(),
        status: statusVal
    };
    const sb = await _getSupabaseFIN();
    if (editingContaReceberId) {
        const { error } = await _scopeFinanceiroQuery(sb.from('contas_receber').update(conta)).eq('id', editingContaReceberId);
        if (error) { showToast('Erro ao atualizar!', 'error'); console.error(error); return; }
        const idx = (AppState.data.contasReceber || []).findIndex(c => String(c.id) === String(editingContaReceberId));
        if (idx !== -1) AppState.data.contasReceber[idx] = { ...AppState.data.contasReceber[idx], ..._normalizeContaReceber(conta), id: editingContaReceberId };
    } else {
        const { data, error } = await sb.from('contas_receber').insert({ ...conta, oficina_id: _getOficinaIdFIN() }).select().single();
        if (error) { showToast('Erro ao criar conta!', 'error'); console.error(error); return; }
        AppState.data.contasReceber.push(_normalizeContaReceber(data));
    }
    persistAndRefreshFinanceiro('Conta a receber salva!');
    closeContaReceberModal();
}

// ============================================
// MODAL CONTAS FIXAS
// ============================================
function openContaFixaModal(editId = null) {
    const modal = document.getElementById('contaFixaModal');
    const title = document.getElementById('contaFixaModalTitle');
    const form = document.getElementById('contaFixaForm');
    if (!modal) return;
    if (editId) {
        const conta = (AppState.data.contasFixas || []).find(c => String(c.id) === String(editId));
        if (!conta) return;
        editingContaFixaId = editId;
        title.textContent = 'Editar Conta Fixa';
        document.getElementById('contaFixaDescricao').value = conta.descricao || '';
        document.getElementById('contaFixaValor').value = formatMoneyInput(conta.valorMensal || conta.valor_mensal);
        document.getElementById('contaFixaDia').value = conta.diaVencimento || conta.dia_vencimento || '';
        document.getElementById('contaFixaCategoria').value = conta.categoria || '';
    } else {
        editingContaFixaId = null;
        title.textContent = 'Nova Conta Fixa';
        form.reset();
    }
    modal.classList.add('active');
}

function closeContaFixaModal() {
    const modal = document.getElementById('contaFixaModal');
    const form = document.getElementById('contaFixaForm');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    editingContaFixaId = null;
}

async function salvarContaFixa() {
    const form = document.getElementById('contaFixaForm');
    if (form && !form.reportValidity()) return;
    const conta = {
        descricao: document.getElementById('contaFixaDescricao').value.trim(),
        valor_mensal: parseMoneyInput(document.getElementById('contaFixaValor').value),
        dia_vencimento: Number(document.getElementById('contaFixaDia').value),
        categoria: document.getElementById('contaFixaCategoria').value,
        pago_este_mes: editingContaFixaId ? !!(AppState.data.contasFixas.find(c => String(c.id) === String(editingContaFixaId))?.pagoEsteMes) : false
    };
    const sb = await _getSupabaseFIN();
    if (editingContaFixaId) {
        const { error } = await _scopeFinanceiroQuery(sb.from('contas_fixas').update(conta)).eq('id', editingContaFixaId);
        if (error) { showToast('Erro ao atualizar!', 'error'); return; }
        const idx = (AppState.data.contasFixas || []).findIndex(c => String(c.id) === String(editingContaFixaId));
        if (idx !== -1) AppState.data.contasFixas[idx] = { ...AppState.data.contasFixas[idx], ..._normalizeContaFixa(conta), id: editingContaFixaId };
    } else {
        const { data, error } = await sb.from('contas_fixas').insert({ ...conta, oficina_id: _getOficinaIdFIN() }).select().single();
        if (error) { showToast('Erro ao criar conta fixa!', 'error'); return; }
        AppState.data.contasFixas.push(_normalizeContaFixa(data));
    }
    persistAndRefreshFinanceiro('Conta fixa salva!');
    closeContaFixaModal();
}

// ============================================
// ACOES
// ============================================
async function pagarConta(id) {
    if (!confirm('Confirmar pagamento desta conta?')) return;
    const idStr = String(id);
    const sb = await _getSupabaseFIN();
    if (idStr.startsWith('fixa-')) {
        const partes = idStr.split('-');
        const fixaId = partes[1];
        const { error } = await _scopeFinanceiroQuery(sb.from('contas_fixas').update({ pago_este_mes: true })).eq('id', fixaId);
        if (error) { showToast('Erro!', 'error'); return; }
        const fixa = (AppState.data.contasFixas || []).find(c => String(c.id) === String(fixaId));
        if (fixa) { fixa.pagoEsteMes = true; fixa.pago_este_mes = true; }
    } else {
        const { error } = await _scopeFinanceiroQuery(sb.from('contas_pagar').update({ status: 'paga' })).eq('id', id);
        if (error) { showToast('Erro!', 'error'); return; }
        const conta = (AppState.data.contasPagar || []).find(c => String(c.id) === String(id));
        if (conta) conta.status = 'paga';
    }
    persistAndRefreshFinanceiro('Conta marcada como paga!');
}

async function receberConta(id) {
    const conta = (AppState.data.contasReceber || []).find(c => String(c.id) === String(id));
    if (!conta) return;
    if (!confirm('Confirmar recebimento de mais uma parcela?')) return;
    const total = Math.max(1, Number(conta.parcelasTotal || conta.parcelas_total || 1));
    const novasParcelas = Math.min(total, Number(conta.parcelasRecebidas || conta.parcelas_recebidas || 0) + 1);
    const novoValorRecebido = Number(((Number(conta.valor) / total) * novasParcelas).toFixed(2));
    const novoStatus = getStatusReceberByParcelas(novasParcelas, total, conta.vencimento);
    const sb = await _getSupabaseFIN();
    const { error } = await _scopeFinanceiroQuery(sb.from('contas_receber').update({ parcelas_recebidas: novasParcelas, valor_recebido: novoValorRecebido, status: novoStatus })).eq('id', id);
    if (error) { showToast('Erro!', 'error'); return; }
    conta.parcelasRecebidas = novasParcelas;
    conta.parcelas_recebidas = novasParcelas;
    conta.valorRecebido = novoValorRecebido;
    conta.valor_recebido = novoValorRecebido;
    conta.status = novoStatus;
    persistAndRefreshFinanceiro('Parcela recebida!');
}

async function toggleContaFixaPaga(id, checked) {
    const sb = await _getSupabaseFIN();
    const { error } = await _scopeFinanceiroQuery(sb.from('contas_fixas').update({ pago_este_mes: checked })).eq('id', id);
    if (error) { showToast('Erro!', 'error'); return; }
    const conta = (AppState.data.contasFixas || []).find(c => String(c.id) === String(id));
    if (conta) { conta.pagoEsteMes = checked; conta.pago_este_mes = checked; }
    persistAndRefreshFinanceiro('Status atualizado!');
}

// ============================================
// FILTROS
// ============================================
function showFinanceiroTab(tab, event) {
    financeiroAbaAtual = tab;
    document.querySelectorAll('#page-financeiro .checklist-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#page-financeiro .tab-content').forEach(content => content.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const content = document.getElementById(`financeiro-tab-${tab}`);
    if (content) content.classList.add('active');
}

function filtrarContas(tab = financeiroAbaAtual, returnData = false) {
    const el = (id) => document.getElementById(id);
    const inicio = el(`filtro${capitalize(tab)}Inicio`)?.value || '';
    const fim = el(`filtro${capitalize(tab)}Fim`)?.value || '';
    const status = el(`filtro${capitalize(tab)}Status`)?.value || 'todos';
    const busca = (el(`filtro${capitalize(tab)}Busca`)?.value || '').toLowerCase();
    let resultado = [];

    if (tab === 'pagar') {
        resultado = getContasPagarComFixas().filter(c => {
            const dataOk = (!inicio || c.vencimento >= inicio) && (!fim || c.vencimento <= fim);
            const statusOk = status === 'todos' || c.status === status;
            const buscaOk = !busca || `${c.fornecedor} ${c.categoria}`.toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        });
    } else if (tab === 'receber') {
        resultado = (AppState.data.contasReceber || []).filter(c => {
            const dataOk = (!inicio || c.vencimento >= inicio) && (!fim || c.vencimento <= fim);
            const statusOk = status === 'todos' || c.status === status;
            const buscaOk = !busca || `${c.osNumero || c.os_numero} ${c.cliente} ${c.pagadorNome || c.pagador_nome}`.toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        });
    } else if (tab === 'fixas') {
        resultado = (AppState.data.contasFixas || []).filter(c => {
            const statusConta = (c.pagoEsteMes || c.pago_este_mes) ? 'pago' : 'pendente';
            const statusOk = status === 'todos' || status === statusConta;
            const buscaOk = !busca || `${c.descricao} ${c.categoria}`.toLowerCase().includes(busca);
            return statusOk && buscaOk;
        });
    } else if (tab === 'fluxo') {
        const movimentos = [];
        (AppState.data.contasReceber || []).forEach(c => {
            const vr = Number(c.valorRecebido || c.valor_recebido || 0);
            if (vr > 0) movimentos.push({ data: c.vencimento, entrada: vr, saida: 0, observacao: `Recebimento ${c.osNumero || c.os_numero || ''} - ${c.pagadorNome || c.pagador_nome || c.cliente}` });
        });
        getContasPagarComFixas().forEach(c => {
            if (c.status === 'paga') movimentos.push({ data: c.vencimento, entrada: 0, saida: Number(c.valor || 0), observacao: `Pagamento ${c.fornecedor}` });
        });
        resultado = movimentos.filter(m => {
            const dataOk = (!inicio || m.data >= inicio) && (!fim || m.data <= fim);
            const statusMov = m.entrada > 0 ? 'entrada' : 'saida';
            const statusOk = status === 'todos' || statusMov === status;
            const buscaOk = !busca || (m.observacao || '').toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        }).sort((a, b) => a.data.localeCompare(b.data));
    }

    if (returnData) return resultado;
    if (tab === 'pagar') renderContasPagar();
    if (tab === 'receber') renderContasReceber();
    if (tab === 'fixas') renderContasFixas();
    if (tab === 'fluxo') renderFluxoCaixa();
}

function persistAndRefreshFinanceiro(message) {
    renderFinanceiroDashboard();
    renderContasPagar();
    renderContasReceber();
    renderContasFixas();
    renderFluxoCaixa();
    updateDashboard();
    showToast(message, 'success');
}
