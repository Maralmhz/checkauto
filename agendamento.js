// ============================================
// GESTAO DE AGENDAMENTOS — Supabase
// ============================================
async function _getSupabaseAG() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

let editingAgendamentoId = null;
let _agendamentoClienteNomeBindingsReady = false;


function _getOficinaIdAG() {
    return window.getCurrentOficinaId ? window.getCurrentOficinaId() : (window.AppState?.user?.oficina_id || window.AppState?.oficina?.id || null);
}

function _isSuperadminAG() {
    return window.AppState?.user?.role === 'superadmin';
}

function _scopeAgendamentoQuery(query) {
    if (_isSuperadminAG()) return query;
    const oficinaId = _getOficinaIdAG();
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}

function _escAG(s = '') {
    return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function _bindClienteNomeLivreAgendamento() {
    if (_agendamentoClienteNomeBindingsReady) return;
    const clienteSelect = document.getElementById('agendamentoCliente');
    const nomeLivreInput = document.getElementById('agendamentoNomeLivre');
    if (!clienteSelect || !nomeLivreInput) return;

    nomeLivreInput.placeholder = 'Ou digite nome pré-cadastro';

    clienteSelect.addEventListener('change', () => {
        if (clienteSelect.value) {
            nomeLivreInput.value = '';
        }
    });

    nomeLivreInput.addEventListener('input', () => {
        if (nomeLivreInput.value.trim()) {
            clienteSelect.value = '';
            updateVeiculoSelectAgendamento('');
        }
    });

    _agendamentoClienteNomeBindingsReady = true;
}

function _getAgendamentoField(fieldId, event) {
    const formEl = event?.target?.closest?.('form');
    if (formEl) {
        const inForm = formEl.querySelector(`#${fieldId}`);
        if (inForm) return inForm;
    }
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        const inActiveModal = activeModal.querySelector(`#${fieldId}`);
        if (inActiveModal) return inActiveModal;
    }
    return document.getElementById(fieldId);
}


// ============================================
// RENDER
// ============================================
function renderAgendamentos() {
    renderCalendario();
    renderAgendamentosHoje();
    renderListaAgendamentos();
    updateAgendamentoStats();
}

function renderAgendamentosHoje() {
    const tbody = document.getElementById('agendamentosHojeTable');
    if (!tbody) return;
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = (AppState.data.agendamentos || []).filter(a => a.data === hoje);
    if (agendamentosHoje.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum agendamento para hoje</td></tr>';
        return;
    }
    tbody.innerHTML = agendamentosHoje
        .sort((a, b) => a.hora.localeCompare(b.hora))
        .map(ag => {
            const clienteId = ag.clienteId || ag.cliente_id;
            const veiculoId = ag.veiculoId || ag.veiculo_id;
            const cliente = AppState.data.clientes.find(c => c.id === clienteId);
            const nomeCliente = cliente?.nome || ag.cliente_nome || ag.nome_pre_cadastro || 'N/A';
            const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
            return `
                <tr>
                    <td><strong>${ag.hora}</strong></td>
                    <td>${_escAG(nomeCliente)}</td>
                    <td>${_escAG(veiculo?.modelo || 'N/A')} - ${_escAG(veiculo?.placa || '')}</td>
                    <td>${_escAG(ag.tipoServico || ag.tipo_servico || '')}</td>
                    <td>${getAgendamentoStatusBadge(ag.status)}</td>
                    <td>
                        <button class="btn-icon" onclick="viewAgendamento('${ag.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        ${ag.status === 'confirmado' ? `<button class="btn-icon btn-success" onclick="converterEmOS('${ag.id}')" title="Converter em OS"><i class="fas fa-check-circle"></i></button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
}

function renderListaAgendamentos() {
    const tbody = document.getElementById('listaAgendamentosTable');
    if (!tbody) return;
    const filteredAgendamentos = filterAgendamentos();
    if (filteredAgendamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum agendamento encontrado</td></tr>';
        return;
    }
    tbody.innerHTML = filteredAgendamentos.map(ag => {
        const clienteId = ag.clienteId || ag.cliente_id;
        const veiculoId = ag.veiculoId || ag.veiculo_id;
        const cliente = AppState.data.clientes.find(c => c.id === clienteId);
            const nomeCliente = cliente?.nome || ag.cliente_nome || ag.nome_pre_cadastro || 'N/A';
        const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
        return `
            <tr>
                <td>${formatDate(ag.data)}</td>
                <td><strong>${ag.hora}</strong></td>
                <td>${_escAG(nomeCliente)}</td>
                <td>${_escAG(veiculo?.modelo || 'N/A')} - ${_escAG(veiculo?.placa || '')}</td>
                <td>${_escAG(ag.tipoServico || ag.tipo_servico || '')}</td>
                <td>${getAgendamentoStatusBadge(ag.status)}</td>
                <td>
                    <button class="btn-icon" onclick="viewAgendamento('${ag.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="editAgendamento('${ag.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    ${getAgendamentoActions(ag)}
                </td>
            </tr>
        `;
    }).join('');
}

function getAgendamentoActions(ag) {
    if (ag.status === 'pendente') {
        return `<button class="btn-icon btn-success" onclick="confirmarAgendamento('${ag.id}')" title="Confirmar"><i class="fas fa-check"></i></button>`;
    } else if (ag.status === 'confirmado') {
        return `<button class="btn-icon btn-success" onclick="converterEmOS('${ag.id}')" title="Converter em OS"><i class="fas fa-clipboard-check"></i></button>`;
    } else if (ag.status === 'cancelado') {
        return `<button class="btn-icon btn-danger" onclick="deleteAgendamento('${ag.id}')" title="Excluir"><i class="fas fa-trash"></i></button>`;
    }
    return '';
}

function filterAgendamentos() {
    const statusFilter = document.getElementById('filterAgendamentoStatus')?.value || 'todos';
    const searchTerm = document.getElementById('searchAgendamentos')?.value.toLowerCase() || '';
    return (AppState.data.agendamentos || []).filter(ag => {
        const clienteId = ag.clienteId || ag.cliente_id;
        const veiculoId = ag.veiculoId || ag.veiculo_id;
        const cliente = AppState.data.clientes.find(c => c.id === clienteId);
            const nomeCliente = cliente?.nome || ag.cliente_nome || ag.nome_pre_cadastro || 'N/A';
        const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
        const matchStatus = statusFilter === 'todos' || ag.status === statusFilter;
        const matchSearch = !searchTerm ||
            cliente?.nome.toLowerCase().includes(searchTerm) ||
            veiculo?.placa.toLowerCase().includes(searchTerm) ||
            (ag.tipoServico || ag.tipo_servico || '').toLowerCase().includes(searchTerm);
        return matchStatus && matchSearch;
    });
}

function getAgendamentoStatusBadge(status) {
    const badges = {
        'pendente': '<span class="badge badge-warning">Pendente</span>',
        'confirmado': '<span class="badge badge-success">Confirmado</span>',
        'cancelado': '<span class="badge badge-danger">Cancelado</span>',
        'atendido': '<span class="badge badge-info">Atendido</span>'
    };
    return badges[status] || status;
}

// ============================================
// MODAL
// ============================================
function openAgendamentoModal(agendamentoId = null) {
    const modal = document.getElementById('agendamentoModal') || document.getElementById('modalAgendamento');
    const title = document.getElementById('agendamentoModalTitle') || document.getElementById('modalAgendamentoTitle');
    populateClienteSelectAgendamento();
    _bindClienteNomeLivreAgendamento();
    if (agendamentoId) {
        editingAgendamentoId = agendamentoId;
        const ag = (AppState.data.agendamentos || []).find(a => a.id === agendamentoId);
        if (ag) {
            title.textContent = 'Editar Agendamento';
            const clienteId = ag.clienteId || ag.cliente_id;
            const veiculoId = ag.veiculoId || ag.veiculo_id;
            document.getElementById('agendamentoCliente').value = clienteId || '';
            const nomeLivreInput = document.getElementById('agendamentoNomeLivre');
            if (nomeLivreInput) nomeLivreInput.value = ag.cliente_nome || ag.nome_pre_cadastro || '';
            updateVeiculoSelectAgendamento(clienteId, veiculoId);
            document.getElementById('agendamentoData').value = ag.data || '';
            document.getElementById('agendamentoHora').value = ag.hora || '';
            (document.getElementById('agendamentoTipo') || document.getElementById('agendamentoServico')).value = ag.tipoServico || ag.tipo_servico || '';
            (document.getElementById('agendamentoObservacoes') || document.getElementById('agendamentoObs')).value = ag.observacoes || '';
        }
    } else {
        editingAgendamentoId = null;
        title.textContent = 'Novo Agendamento';
        (document.getElementById('agendamentoForm') || document.getElementById('formAgendamento')).reset();
        document.getElementById('agendamentoData').value = new Date().toISOString().split('T')[0];
    }
    modal.classList.add('active');
    document.getElementById('agendamentoNomeLivre').addEventListener('input', function(e) {
      console.log('Digitando nome livre:', e.target.value);
      document.getElementById('agendamentoCliente').value = '';
    });
}

function closeAgendamentoModal() {
    const modal = document.getElementById('agendamentoModal') || document.getElementById('modalAgendamento');
    if (modal) modal.classList.remove('active');
    (document.getElementById('agendamentoForm') || document.getElementById('formAgendamento')).reset();
    editingAgendamentoId = null;
}

function populateClienteSelectAgendamento() {
    const select = document.getElementById('agendamentoCliente');
    select.innerHTML = '<option value="">Selecione um cliente</option>' +
        (AppState.data.clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function updateVeiculoSelectAgendamento(clienteId, selectedVeiculoId = null) {
    const select = document.getElementById('agendamentoVeiculo');
    const veiculos = (AppState.data.veiculos || []).filter(v => (v.clienteId || v.cliente_id) == clienteId);
    select.innerHTML = '<option value="">Selecione um veiculo</option>' +
        veiculos.map(v => `<option value="${v.id}" ${v.id == selectedVeiculoId ? 'selected' : ''}>${v.modelo} - ${v.placa}</option>`).join('');
    select.disabled = veiculos.length === 0;
}

function atualizarVeiculosAgendamento() {
    const clienteId = document.getElementById('agendamentoCliente')?.value;
    updateVeiculoSelectAgendamento(clienteId);
}

// ============================================
// SALVAR (INSERT / UPDATE)
// ============================================
function saveAgendamento(e) {
    e.preventDefault();

    const nomeLivre = document.getElementById('agendamentoNomeLivre').value;
    const clienteId = document.getElementById('agendamentoCliente').value;

    console.log('IMEDIATO:', {clienteId, nomeLivre});

    if (!clienteId && !nomeLivre?.trim()) {
        showToast('Digite nome pré-cadastro!', 'error');
        return;
    }

    const OFICINA_ID = '0a2ff212-2b02-45c7-828b-9a749444e256';

    const agData = {
        oficina_id: OFICINA_ID,
        cliente_id: clienteId || null,
        veiculo_id: null,
        data: document.getElementById('agendamentoData').value,
        hora: document.getElementById('agendamentoHora').value,
        tipo_servico: document.getElementById('agendamentoTipo').value,
        observacoes: nomeLivre ? `Pré-cadastro: ${nomeLivre}` : '',
        status: 'pendente'
    };

    _getSupabaseAG().then((sb) => sb.from('agendamentos').insert(agData)).then(({data, error}) => {
        if (error) {
            console.error(error);
            showToast(error.message, 'error');
        } else {
            showToast('✅ Agendamento criado!');
            closeAgendamentoModal();
        }
    });
}

function salvarAgendamento() {
    const form = document.getElementById('agendamentoForm');
    if (form && !form.reportValidity()) return;
    saveAgendamento({ preventDefault() {} });
}

// ============================================
// CONFIRMAR
// ============================================
async function confirmarAgendamento(id) {
    if (!confirm('Confirmar este agendamento?')) return;
    const sb = await _getSupabaseAG();
    const { error } = await _scopeAgendamentoQuery(sb.from('agendamentos').update({ status: 'confirmado' })).eq('id', id);
    if (error) { showToast('Erro ao confirmar!', 'error'); return; }
    const ag = (AppState.data.agendamentos || []).find(a => a.id === id);
    if (ag) ag.status = 'confirmado';
    renderAgendamentos();
    showToast('Agendamento confirmado!', 'success');
}

// ============================================
// CONVERTER EM OS
// ============================================
async function converterEmOS(agendamentoId) {
    const ag = (AppState.data.agendamentos || []).find(a => a.id === agendamentoId);
    if (!ag) return;
    if (!confirm('Converter este agendamento em Ordem de Servico?')) return;

    const clienteId = ag.clienteId || ag.cliente_id;
    const veiculoId = ag.veiculoId || ag.veiculo_id;
    const cliente = AppState.data.clientes.find(c => c.id === clienteId);
            const nomeCliente = cliente?.nome || ag.cliente_nome || ag.nome_pre_cadastro || 'N/A';
    const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);

    if (!cliente) { showToast('Cliente nao encontrado.', 'info'); return; }
    if (!veiculo) { showToast('Veiculo nao vinculado. Cadastre um veiculo primeiro.', 'info'); return; }

    const sb = await _getSupabaseAG();
    const nextNumero = ((AppState.data.ordensServico || []).length + 1).toString().padStart(6, '0');
    const osId = `OS-${Date.now()}`;
    const osData = {
        id: osId,
        numero: nextNumero,
        status: 'aguardando',
        cliente_id: clienteId,
        cliente: cliente.nome,
        veiculo_id: veiculoId,
        veiculo: `${veiculo.modelo} - ${veiculo.placa}`,
        data: new Date().toISOString().split('T')[0],
        descricao: `${ag.tipoServico || ag.tipo_servico} - Agendado para ${ag.data} ${ag.hora}`,
        observacoes: ag.observacoes || '',
        valor_total: 0,
        oficina_id: _getOficinaIdAG()
    };

    const { error: errOS } = await sb.from('ordens_servico').insert(osData);
    if (errOS) { showToast('Erro ao criar OS!', 'error'); console.error(errOS); return; }

    const { error: errAg } = await _scopeAgendamentoQuery(sb.from('agendamentos').update({ status: 'atendido' })).eq('id', agendamentoId);
    if (errAg) {
        await sb.from('ordens_servico').delete().eq('id', osId);
        showToast('Erro ao atualizar agendamento apos criar OS!', 'error');
        console.error(errAg);
        return;
    }
    ag.status = 'atendido';
    AppState.data.ordensServico = AppState.data.ordensServico || [];
    AppState.data.ordensServico.unshift({ ...osData, clienteId, veiculoId, valorTotal: 0, servicos: [] });

    renderAgendamentos();
    updateDashboard();
    showToast('OS criada! Numero: ' + nextNumero, 'success');
    setTimeout(() => { if (confirm('Deseja ir para a OS criada?')) navigateTo('ordens-servico'); }, 1000);
}

function editAgendamento(id) { openAgendamentoModal(id); }

// ============================================
// EXCLUIR
// ============================================
async function deleteAgendamento(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    const sb = await _getSupabaseAG();
    const { error } = await _scopeAgendamentoQuery(sb.from('agendamentos').delete()).eq('id', id);
    if (error) { showToast('Erro ao excluir!', 'error'); return; }
    AppState.data.agendamentos = (AppState.data.agendamentos || []).filter(a => a.id !== id);
    renderAgendamentos();
    updateDashboard();
    showToast('Agendamento excluido!', 'success');
}

// ============================================
// VER
// ============================================
function viewAgendamento(id) {
    const ag = (AppState.data.agendamentos || []).find(a => a.id === id);
    if (!ag) return;
    const clienteId = ag.clienteId || ag.cliente_id;
    const veiculoId = ag.veiculoId || ag.veiculo_id;
    const cliente = AppState.data.clientes.find(c => c.id === clienteId);
            const nomeCliente = cliente?.nome || ag.cliente_nome || ag.nome_pre_cadastro || 'N/A';
    const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    const modal = document.getElementById('modalViewAgendamento') || document.getElementById('viewAgendamentoModal');
    const content = document.getElementById('viewAgendamentoContent');
    content.innerHTML = `
        <div class="agendamento-view-section">
            <h4>Informacoes do Agendamento</h4>
            <p><strong>Data:</strong> ${formatDate(ag.data)}</p>
            <p><strong>Horario:</strong> ${_escAG(ag.hora || '-')}</p>
            <p><strong>Status:</strong> ${getAgendamentoStatusBadge(ag.status)}</p>
            <p><strong>Tipo de Servico:</strong> ${_escAG(ag.tipoServico || ag.tipo_servico || '-')}</p>
        </div>
        <div class="agendamento-view-section">
            <h4>Cliente e Veiculo</h4>
            <p><strong>Cliente:</strong> ${_escAG(cliente?.nome || 'N/A')}</p>
            <p><strong>Telefone:</strong> ${_escAG(cliente?.telefone || 'N/A')}</p>
            <p><strong>Veiculo:</strong> ${_escAG(veiculo?.modelo || 'N/A')}</p>
            <p><strong>Placa:</strong> ${_escAG(veiculo?.placa || 'N/A')}</p>
        </div>
        ${ag.observacoes ? `<div class="agendamento-view-section"><h4>Observacoes</h4><p>${_escAG(ag.observacoes)}</p></div>` : ''}
    `;
    modal.classList.add('active');
}

function closeViewAgendamentoModal() {
    const modal = document.getElementById('modalViewAgendamento') || document.getElementById('viewAgendamentoModal');
    if (modal) modal.classList.remove('active');
}

// ============================================
// STATS
// ============================================
function updateAgendamentoStats() {
    const agendamentos = AppState.data.agendamentos || [];
    const total = agendamentos.length;
    const pendentes = agendamentos.filter(a => a.status === 'pendente').length;
    const confirmados = agendamentos.filter(a => a.status === 'confirmado').length;
    const hoje = new Date().toISOString().split('T')[0];
    const hojeCount = agendamentos.filter(a => a.data === hoje).length;
    const statsEl = document.getElementById('agendamentoStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${total}</span></div>
            <div class="stat-item"><span class="stat-label">Hoje:</span><span class="stat-value badge-info">${hojeCount}</span></div>
            <div class="stat-item"><span class="stat-label">Pendentes:</span><span class="stat-value badge-warning">${pendentes}</span></div>
            <div class="stat-item"><span class="stat-label">Confirmados:</span><span class="stat-value badge-success">${confirmados}</span></div>
        `;
    }
}
