// MODULO FINANCEIRO - FASE 6 (INTEGRACAO COMPLETA)
let editingContaPagarId = null;
let editingContaReceberId = null;
let editingContaFixaId = null;
let financeiroAbaAtual = 'pagar';

function ensureFinanceiroData() {
    if (!AppState.data.contasPagar || !Array.isArray(AppState.data.contasPagar)) AppState.data.contasPagar = [];
    if (!AppState.data.contasReceber || !Array.isArray(AppState.data.contasReceber)) AppState.data.contasReceber = [];
    if (!AppState.data.contasFixas || !Array.isArray(AppState.data.contasFixas)) AppState.data.contasFixas = [];
}

function ensureContasFixasBase() {
    const fixasBase = [
        { descricao: 'Salarios', categoria: 'pessoal', valorMensal: 0, diaVencimento: 5 },
        { descricao: 'Aluguel do Galpao', categoria: 'estrutura', valorMensal: 0, diaVencimento: 5 },
        { descricao: 'Agua', categoria: 'estrutura', valorMensal: 0, diaVencimento: 10 },
        { descricao: 'Luz', categoria: 'estrutura', valorMensal: 0, diaVencimento: 10 },
        { descricao: 'Internet', categoria: 'servicos', valorMensal: 0, diaVencimento: 10 }
    ];

    fixasBase.forEach(base => {
        const existe = AppState.data.contasFixas.some(c => (c.descricao || '').toLowerCase() === base.descricao.toLowerCase());
        if (!existe) {
            AppState.data.contasFixas.push({
                id: Date.now() + Math.floor(Math.random() * 9999),
                descricao: base.descricao,
                valorMensal: base.valorMensal,
                diaVencimento: base.diaVencimento,
                categoria: base.categoria,
                pagoEsteMes: false
            });
        }
    });
}


function normalizeFinanceiroData() {
    AppState.data.contasReceber = (AppState.data.contasReceber || []).map(c => {
        const parcelasTotal = Math.max(1, Number(c.parcelasTotal || 1));
        const parcelasRecebidas = Math.min(parcelasTotal, Math.max(0, Number(c.parcelasRecebidas || 0)));
        const valor = Number(c.valor || 0);
        const valorRecebido = Number((c.valorRecebido != null ? c.valorRecebido : (valor / parcelasTotal) * parcelasRecebidas) || 0);
        const status = c.status || getStatusReceberByParcelas(parcelasRecebidas, parcelasTotal, c.vencimento);
        return {
            origem: c.origem || 'manual',
            pagadorTipo: c.pagadorTipo || c.tipoPagador || 'cliente',
            pagadorNome: c.pagadorNome || c.nomePagador || c.cliente || 'Cliente',
            formaPagamento: c.formaPagamento || c.forma_pagamento || 'a_definir',
            osNumero: c.osNumero || c.os_id || c.osId || '-',
            ...c,
            parcelasTotal,
            parcelasRecebidas,
            valor,
            valorRecebido,
            status
        };
    });
}

function seedFinanceiroData() {
    ensureFinanceiroData();

    if (!AppState.data.contasPagar.length) {
        AppState.data.contasPagar = [
            { id: Date.now() + 1, fornecedor: 'Auto Pecas Central', valor: 1250.90, vencimento: '2026-03-08', status: 'aberta', categoria: 'Pecas', observacao: 'Compra mensal' },
            { id: Date.now() + 2, fornecedor: 'Energia Oficina', valor: 680.30, vencimento: '2026-03-12', status: 'aberta', categoria: 'Utilidades', observacao: '' },
            { id: Date.now() + 3, fornecedor: 'Fornecedor Lubrax', valor: 920.50, vencimento: '2026-03-15', status: 'aberta', categoria: 'Lubrificantes', observacao: '' }
        ];
    }

    if (!AppState.data.contasReceber.length) {
        AppState.data.contasReceber = [
            {
                id: Date.now() + 11,
                origem: 'manual',
                osId: 'OS-001',
                osNumero: '000001',
                cliente: 'Joao Silva',
                pagadorTipo: 'cliente',
                pagadorNome: 'Joao Silva',
                formaPagamento: 'pix',
                parcelasTotal: 1,
                parcelasRecebidas: 0,
                valor: 850,
                valorRecebido: 0,
                vencimento: '2026-03-10',
                status: 'aberta',
                observacao: ''
            },
            {
                id: Date.now() + 12,
                origem: 'manual',
                osId: 'OS-002',
                osNumero: '000002',
                cliente: 'Maria Santos',
                pagadorTipo: 'seguradora',
                pagadorNome: 'Seguradora Alpha',
                formaPagamento: 'boleto',
                parcelasTotal: 2,
                parcelasRecebidas: 1,
                valor: 1200,
                valorRecebido: 600,
                vencimento: '2026-03-15',
                status: 'parcial',
                observacao: '2x boleto'
            }
        ];
    }

    ensureContasFixasBase();
}

function syncContasReceberFromOS() {
    ensureFinanceiroData();
    const ordens = AppState.data.ordensServico || [];

    ordens.forEach(os => {
        if (!os || os.status === 'cancelada') return;

        const valorTotal = Number(os.valorTotal || 0);
        if (valorTotal <= 0) return;

        const parcelasTotal = Math.max(1, Number(os.parcelasReceber || 1));
        const parcelasRecebidas = Math.min(parcelasTotal, Math.max(0, Number(os.parcelasRecebidas || 0)));
        const valorRecebido = Number((os.valorRecebido != null ? os.valorRecebido : (valorTotal / parcelasTotal) * parcelasRecebidas) || 0);
        const status = getStatusReceberByParcelas(parcelasRecebidas, parcelasTotal, os.vencimentoRecebimento || os.data);

        const existente = AppState.data.contasReceber.find(c => c.origem === 'os' && String(c.osId) === String(os.id));
        const contaOS = {
            origem: 'os',
            osId: os.id,
            osNumero: os.numero || os.id,
            cliente: os.cliente || '-',
            pagadorTipo: os.pagadorTipo || 'cliente',
            pagadorNome: os.pagadorNome || os.cliente || 'Cliente',
            formaPagamento: os.formaPagamento || 'a_definir',
            parcelasTotal,
            parcelasRecebidas,
            valor: valorTotal,
            valorRecebido,
            vencimento: os.vencimentoRecebimento || os.data,
            status,
            observacao: os.observacaoFinanceira || ''
        };

        if (existente) {
            Object.assign(existente, contaOS);
        } else {
            AppState.data.contasReceber.push({ id: Date.now() + Math.floor(Math.random() * 9999), ...contaOS });
        }
    });
}

function initFinanceiro() {
    ensureFinanceiroData();
    seedFinanceiroData();
    normalizeFinanceiroData();
    syncContasReceberFromOS();
    renderFinanceiroDashboard();
    renderContasPagar();
    renderContasReceber();
    renderContasFixas();
    renderFluxoCaixa();
    updateDashboard();
    console.log('[Financeiro] Modulo inicializado com integracao de OS');
}

function renderFinanceiroDashboard() {
    ensureFinanceiroData();
    syncContasReceberFromOS();

    const totalPagar = AppState.data.contasPagar
        .filter(c => ['aberta', 'atrasada'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);

    const totalReceber = AppState.data.contasReceber
        .filter(c => ['aberta', 'parcial', 'atrasada'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Math.max(0, Number(c.valor || 0) - Number(c.valorRecebido || 0)), 0);

    const saldo = calcularSaldo();

    const totalPagarEl = document.getElementById('totalPagar');
    const totalReceberEl = document.getElementById('totalReceber');
    const saldoEl = document.getElementById('saldoFinanceiro');

    if (totalPagarEl) totalPagarEl.textContent = formatMoney(totalPagar);
    if (totalReceberEl) totalReceberEl.textContent = formatMoney(totalReceber);
    if (saldoEl) saldoEl.textContent = formatMoney(saldo);
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
    const statusNormalizado = status || 'aberta';

    const badges = {
        aberta: '<span class="badge badge-warning">Aberta</span>',
        parcial: '<span class="badge badge-info">Parcial</span>',
        recebida: '<span class="badge badge-success">Recebida</span>',
        paga: '<span class="badge badge-success">Paga</span>',
        atrasada: '<span class="badge badge-danger">Atrasada</span>'
    };

    if (statusNormalizado === 'aberta' && vencimento && new Date(vencimento + 'T00:00:00') < new Date()) {
        return '<span class="badge badge-danger">Vencida</span>';
    }

    return badges[statusNormalizado] || badges.aberta;
}

function renderContasPagar() {
    const tbody = document.getElementById('contasPagarTableBody');
    if (!tbody) return;
    const contas = filtrarContas('pagar', true);

    if (!contas.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma conta a pagar encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = contas.map(conta => `
        <tr>
            <td><strong>${conta.fornecedor}</strong><br><small>${conta.categoria || '-'}</small></td>
            <td>${formatMoney(conta.valor)}</td>
            <td>${formatDate(conta.vencimento)}</td>
            <td>${getBadgeFinanceiro(conta.status, conta.vencimento)}</td>
            <td>
                <button class="btn-icon" onclick="openContaPagarModal(${conta.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-success" onclick="pagarConta(${conta.id})" title="Marcar como paga"><i class="fas fa-check"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderContasReceber() {
    const tbody = document.getElementById('contasReceberTableBody');
    if (!tbody) return;
    const contas = filtrarContas('receber', true);

    if (!contas.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma conta a receber encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = contas.map(conta => {
        const faltaReceber = Math.max(0, Number(conta.valor || 0) - Number(conta.valorRecebido || 0));
        return `
            <tr>
                <td>
                    <strong>${conta.osNumero || conta.osId || '-'}</strong> / ${conta.cliente || '-'}
                    <br><small>${conta.pagadorNome || '-'} (${conta.pagadorTipo || '-'})</small>
                    <br><small>${conta.parcelasRecebidas || 0}/${conta.parcelasTotal || 1} parcela(s)</small>
                </td>
                <td>${formatMoney(conta.valor)}<br><small>Falta: ${formatMoney(faltaReceber)}</small></td>
                <td>${formatDate(conta.vencimento)}</td>
                <td>${getBadgeFinanceiro(conta.status, conta.vencimento)}</td>
                <td>
                    <button class="btn-icon" onclick="openContaReceberModal(${conta.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-success" onclick="receberConta(${conta.id})" title="Receber parcela"><i class="fas fa-hand-holding-usd"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderContasFixas() {
    const tbody = document.getElementById('contasFixasTableBody');
    if (!tbody) return;
    const contas = filtrarContas('fixas', true);

    if (!contas.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma conta fixa encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = contas.map(conta => `
        <tr>
            <td><strong>${conta.descricao}</strong></td>
            <td>${formatMoney(conta.valorMensal)}</td>
            <td>${conta.diaVencimento}</td>
            <td><input type="checkbox" ${conta.pagoEsteMes ? 'checked' : ''} onchange="toggleContaFixaPaga(${conta.id}, this.checked)"></td>
            <td>${conta.categoria || '-'}</td>
            <td><button class="btn-icon" onclick="openContaFixaModal(${conta.id})" title="Editar"><i class="fas fa-edit"></i></button></td>
        </tr>
    `).join('');
}

function renderFluxoCaixa() {
    const tbody = document.getElementById('fluxoCaixaTableBody');
    if (!tbody) return;
    const fluxo = filtrarContas('fluxo', true);

    if (!fluxo.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum movimento de fluxo encontrado</td></tr>';
        return;
    }

    let saldoAcumulado = 0;
    tbody.innerHTML = fluxo.map(item => {
        saldoAcumulado += Number(item.entrada || 0) - Number(item.saida || 0);
        return `
            <tr>
                <td>${formatDate(item.data)}</td>
                <td>${item.entrada ? formatMoney(item.entrada) : '-'}</td>
                <td>${item.saida ? formatMoney(item.saida) : '-'}</td>
                <td>${formatMoney(saldoAcumulado)}</td>
                <td>${item.observacao || '-'}</td>
            </tr>
        `;
    }).join('');
}

function openContaPagarModal(editId = null) {
    const modal = document.getElementById('contaPagarModal');
    const title = document.getElementById('contaPagarModalTitle');
    const form = document.getElementById('contaPagarForm');
    if (!modal || !title || !form) return;

    if (editId) {
        const conta = AppState.data.contasPagar.find(c => c.id === editId);
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

function salvarContaPagar() {
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

    if (editingContaPagarId) {
        const idx = AppState.data.contasPagar.findIndex(c => c.id === editingContaPagarId);
        if (idx !== -1) AppState.data.contasPagar[idx] = { ...AppState.data.contasPagar[idx], ...conta };
        console.log('[Financeiro] Conta a pagar atualizada', editingContaPagarId);
    } else {
        AppState.data.contasPagar.push({ id: Date.now(), ...conta });
        console.log('[Financeiro] Conta a pagar criada');
    }

    persistAndRefreshFinanceiro('Conta a pagar salva com sucesso!');
    closeContaPagarModal();
}

function popularSelectOS() {
    const select = document.getElementById('contaReceberOS');
    if (!select) return;

    const options = ['<option value="">Selecione uma OS</option>'];
    (AppState.data.ordensServico || []).forEach(os => {
        options.push(`<option value="${os.id}">${os.numero} - ${os.cliente}</option>`);
    });

    select.innerHTML = options.join('');
}

function openContaReceberModal(editId = null) {
    popularSelectOS();
    const modal = document.getElementById('contaReceberModal');
    const title = document.getElementById('contaReceberModalTitle');
    const form = document.getElementById('contaReceberForm');
    if (!modal || !title || !form) return;

    if (editId) {
        const conta = AppState.data.contasReceber.find(c => c.id === editId);
        if (!conta) return;
        editingContaReceberId = editId;
        title.textContent = 'Editar Conta a Receber';
        document.getElementById('contaReceberOS').value = conta.osId || '';
        document.getElementById('contaReceberValor').value = formatMoneyInput(conta.valor);
        document.getElementById('contaReceberVencimento').value = conta.vencimento || '';
        document.getElementById('contaReceberObs').value = conta.observacao || '';
        document.getElementById('contaReceberPagadorTipo').value = conta.pagadorTipo || 'cliente';
        document.getElementById('contaReceberPagadorNome').value = conta.pagadorNome || '';
        document.getElementById('contaReceberFormaPagamento').value = conta.formaPagamento || 'a_definir';
        document.getElementById('contaReceberParcelasTotal').value = conta.parcelasTotal || 1;
        document.getElementById('contaReceberParcelasRecebidas').value = conta.parcelasRecebidas || 0;
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

function salvarContaReceber() {
    const form = document.getElementById('contaReceberForm');
    if (form && !form.reportValidity()) return;

    const osId = document.getElementById('contaReceberOS').value;
    const osData = (AppState.data.ordensServico || []).find(os => String(os.id) === String(osId));
    const parcelasTotal = Math.max(1, Number(document.getElementById('contaReceberParcelasTotal').value || 1));
    const parcelasRecebidas = Math.min(parcelasTotal, Math.max(0, Number(document.getElementById('contaReceberParcelasRecebidas').value || 0)));
    const valor = parseMoneyInput(document.getElementById('contaReceberValor').value);
    const valorRecebido = Number(((valor / parcelasTotal) * parcelasRecebidas).toFixed(2));

    const conta = {
        origem: editingContaReceberId ? (AppState.data.contasReceber.find(c => c.id === editingContaReceberId)?.origem || 'manual') : 'manual',
        osId: osId,
        osNumero: osData ? osData.numero : osId,
        cliente: osData ? osData.cliente : 'Cliente nao informado',
        pagadorTipo: document.getElementById('contaReceberPagadorTipo').value,
        pagadorNome: document.getElementById('contaReceberPagadorNome').value.trim() || (osData ? osData.cliente : 'Cliente'),
        formaPagamento: document.getElementById('contaReceberFormaPagamento').value,
        parcelasTotal,
        parcelasRecebidas,
        valor,
        valorRecebido,
        vencimento: document.getElementById('contaReceberVencimento').value,
        observacao: document.getElementById('contaReceberObs').value.trim(),
        status: document.getElementById('contaReceberStatus').value
    };

    if (editingContaReceberId) {
        const idx = AppState.data.contasReceber.findIndex(c => c.id === editingContaReceberId);
        if (idx !== -1) AppState.data.contasReceber[idx] = { ...AppState.data.contasReceber[idx], ...conta };
        console.log('[Financeiro] Conta a receber atualizada', editingContaReceberId);
    } else {
        AppState.data.contasReceber.push({ id: Date.now(), ...conta });
        console.log('[Financeiro] Conta a receber criada');
    }

    persistAndRefreshFinanceiro('Conta a receber salva com sucesso!');
    closeContaReceberModal();
}

function openContaFixaModal(editId = null) {
    const modal = document.getElementById('contaFixaModal');
    const title = document.getElementById('contaFixaModalTitle');
    const form = document.getElementById('contaFixaForm');
    if (!modal || !title || !form) return;

    if (editId) {
        const conta = AppState.data.contasFixas.find(c => c.id === editId);
        if (!conta) return;
        editingContaFixaId = editId;
        title.textContent = 'Editar Conta Fixa';
        document.getElementById('contaFixaDescricao').value = conta.descricao || '';
        document.getElementById('contaFixaValor').value = formatMoneyInput(conta.valorMensal);
        document.getElementById('contaFixaDia').value = conta.diaVencimento || '';
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

function salvarContaFixa() {
    const form = document.getElementById('contaFixaForm');
    if (form && !form.reportValidity()) return;

    const conta = {
        descricao: document.getElementById('contaFixaDescricao').value.trim(),
        valorMensal: parseMoneyInput(document.getElementById('contaFixaValor').value),
        diaVencimento: Number(document.getElementById('contaFixaDia').value),
        categoria: document.getElementById('contaFixaCategoria').value,
        pagoEsteMes: editingContaFixaId ? (AppState.data.contasFixas.find(c => c.id === editingContaFixaId)?.pagoEsteMes || false) : false
    };

    if (editingContaFixaId) {
        const idx = AppState.data.contasFixas.findIndex(c => c.id === editingContaFixaId);
        if (idx !== -1) AppState.data.contasFixas[idx] = { ...AppState.data.contasFixas[idx], ...conta };
    } else {
        AppState.data.contasFixas.push({ id: Date.now(), ...conta });
    }

    persistAndRefreshFinanceiro('Conta fixa salva com sucesso!');
    closeContaFixaModal();
}

function pagarConta(id) {
    const conta = AppState.data.contasPagar.find(c => c.id === id);
    if (!conta) return;
    if (!confirm('Confirmar marcacao desta conta como paga?')) return;
    conta.status = 'paga';
    persistAndRefreshFinanceiro('Conta marcada como paga!');
}

function receberConta(id) {
    const conta = AppState.data.contasReceber.find(c => c.id === id);
    if (!conta) return;
    if (!confirm('Confirmar recebimento de mais uma parcela desta conta?')) return;

    const total = Math.max(1, Number(conta.parcelasTotal || 1));
    conta.parcelasRecebidas = Math.min(total, Number(conta.parcelasRecebidas || 0) + 1);
    conta.valorRecebido = Number(((Number(conta.valor || 0) / total) * conta.parcelasRecebidas).toFixed(2));
    conta.status = getStatusReceberByParcelas(conta.parcelasRecebidas, total, conta.vencimento);

    persistAndRefreshFinanceiro('Parcela recebida com sucesso!');
}

function toggleContaFixaPaga(id, checked) {
    const conta = AppState.data.contasFixas.find(c => c.id === id);
    if (!conta) return;
    conta.pagoEsteMes = checked;
    persistAndRefreshFinanceiro('Status da conta fixa atualizado!');
}

function calcularSaldo() {
    const entradasRecebidas = AppState.data.contasReceber.reduce((sum, c) => sum + Number(c.valorRecebido || 0), 0);
    const saidasPagas = AppState.data.contasPagar
        .filter(c => c.status === 'paga')
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    return entradasRecebidas - saidasPagas;
}

function showFinanceiroTab(tab, event) {
    financeiroAbaAtual = tab;
    document.querySelectorAll('#page-financeiro .checklist-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#page-financeiro .tab-content').forEach(content => content.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const content = document.getElementById(`financeiro-tab-${tab}`);
    if (content) content.classList.add('active');
}

function filtrarContas(tab = financeiroAbaAtual, returnData = false) {
    const inicioEl = document.getElementById(`filtro${capitalize(tab)}Inicio`);
    const fimEl = document.getElementById(`filtro${capitalize(tab)}Fim`);
    const statusEl = document.getElementById(`filtro${capitalize(tab)}Status`);
    const buscaEl = document.getElementById(`filtro${capitalize(tab)}Busca`);

    const inicio = inicioEl ? inicioEl.value : '';
    const fim = fimEl ? fimEl.value : '';
    const status = statusEl ? statusEl.value : 'todos';
    const busca = (buscaEl ? buscaEl.value : '').toLowerCase();

    let resultado = [];

    if (tab === 'pagar') {
        resultado = AppState.data.contasPagar.filter(conta => {
            const dataOk = (!inicio || conta.vencimento >= inicio) && (!fim || conta.vencimento <= fim);
            const statusOk = status === 'todos' || conta.status === status;
            const buscaOk = !busca || `${conta.fornecedor} ${conta.categoria}`.toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        });
    } else if (tab === 'receber') {
        resultado = AppState.data.contasReceber.filter(conta => {
            const dataOk = (!inicio || conta.vencimento >= inicio) && (!fim || conta.vencimento <= fim);
            const statusOk = status === 'todos' || conta.status === status;
            const buscaOk = !busca || `${conta.osNumero} ${conta.cliente} ${conta.pagadorNome}`.toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        });
    } else if (tab === 'fixas') {
        resultado = AppState.data.contasFixas.filter(conta => {
            const dataRef = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(conta.diaVencimento).padStart(2, '0')}`;
            const dataOk = (!inicio || dataRef >= inicio) && (!fim || dataRef <= fim);
            const statusConta = conta.pagoEsteMes ? 'pago' : 'pendente';
            const statusOk = status === 'todos' || status === statusConta;
            const buscaOk = !busca || `${conta.descricao} ${conta.categoria}`.toLowerCase().includes(busca);
            return dataOk && statusOk && buscaOk;
        });
    } else if (tab === 'fluxo') {
        const movimentos = [];
        AppState.data.contasReceber.forEach(c => {
            if (Number(c.valorRecebido || 0) > 0) {
                movimentos.push({
                    data: c.vencimento,
                    entrada: Number(c.valorRecebido || 0),
                    saida: 0,
                    observacao: `Recebimento ${c.osNumero || c.osId} - ${c.pagadorNome || c.cliente}`
                });
            }
        });

        AppState.data.contasPagar.forEach(c => {
            if (c.status === 'paga') {
                movimentos.push({
                    data: c.vencimento,
                    entrada: 0,
                    saida: Number(c.valor || 0),
                    observacao: `Pagamento ${c.fornecedor}`
                });
            }
        });

        resultado = movimentos
            .filter(m => {
                const dataOk = (!inicio || m.data >= inicio) && (!fim || m.data <= fim);
                const statusMov = m.entrada > 0 ? 'entrada' : 'saida';
                const statusOk = status === 'todos' || statusMov === status;
                const buscaOk = !busca || (m.observacao || '').toLowerCase().includes(busca);
                return dataOk && statusOk && buscaOk;
            })
            .sort((a, b) => a.data.localeCompare(b.data));
    }

    if (returnData) return resultado;

    if (tab === 'pagar') renderContasPagar();
    if (tab === 'receber') renderContasReceber();
    if (tab === 'fixas') renderContasFixas();
    if (tab === 'fluxo') renderFluxoCaixa();
}

function parseMoneyInput(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
    return Number(cleaned) || 0;
}

function formatMoneyInput(value) {
    return formatMoney(Number(value || 0));
}

function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function persistAndRefreshFinanceiro(message) {
    saveToLocalStorage();
    renderFinanceiroDashboard();
    renderContasPagar();
    renderContasReceber();
    renderContasFixas();
    renderFluxoCaixa();
    updateDashboard();
    showToast(message, 'success');
}
