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

// ============================================
// TOGGLE campos de veiculo rapido
// ============================================
function _toggleVeiculoRapidoAgendamento() {
    const nomeEl   = document.getElementById('agendamentoClienteNomeRapido');
    const secaoEl  = document.getElementById('agendamentoVeiculoRapidoSecao');
    const clienteEl = document.getElementById('agendamentoCliente');
    if (!secaoEl) return;
    const temNomeLivre = nomeEl && nomeEl.value.trim().length > 0;
    const temClienteSelecionado = clienteEl && clienteEl.value.trim().length > 0;
    secaoEl.style.display = (temNomeLivre && !temClienteSelecionado) ? 'block' : 'none';
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
            const nomeCliente = cliente?.nome || ag.nome_pre_cadastro || 'N/A';
            const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
            return `
                <tr>
                    <td><strong>${ag.hora}</strong></td>
                    <td>${_escAG(nomeCliente)}</td>
                    <td>${_escAG(veiculo?.modelo || '-')} ${veiculo?.placa ? '- ' + _escAG(veiculo.placa) : ''}</td>
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
        const nomeCliente = cliente?.nome || ag.nome_pre_cadastro || 'N/A';
        const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
        return `
            <tr>
                <td>${formatDate(ag.data)}</td>
                <td><strong>${ag.hora}</strong></td>
                <td>${_escAG(nomeCliente)}</td>
                <td>${_escAG(veiculo?.modelo || '-')} ${veiculo?.placa ? '- ' + _escAG(veiculo.placa) : ''}</td>
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
        const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
        const matchStatus = statusFilter === 'todos' || ag.status === statusFilter;
        const matchSearch = !searchTerm ||
            (cliente?.nome || '').toLowerCase().includes(searchTerm) ||
            (ag.nome_pre_cadastro || '').toLowerCase().includes(searchTerm) ||
            (veiculo?.placa || '').toLowerCase().includes(searchTerm) ||
            (veiculo?.modelo || '').toLowerCase().includes(searchTerm) ||
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
async function openAgendamentoModal(agendamentoId = null) {
    const modal = document.getElementById('agendamentoModal');
    const title = document.getElementById('agendamentoModalTitle');

    const form = document.getElementById('agendamentoForm');
    if (form) form.reset();
    editingAgendamentoId = null;

    // Esconde secao de veiculo rapido no inicio
    const secaoVR = document.getElementById('agendamentoVeiculoRapidoSecao');
    if (secaoVR) secaoVR.style.display = 'none';

    await populateClienteSelectAgendamento();

    // Bind: nome livre => toggle veiculo rapido e limpa select
    const nomeEl = document.getElementById('agendamentoClienteNomeRapido');
    if (nomeEl) {
        nomeEl.oninput = () => {
            if (nomeEl.value.trim()) {
                document.getElementById('agendamentoCliente').value = '';
                const sv = document.getElementById('agendamentoVeiculo');
                if (sv) { sv.innerHTML = '<option value="">Selecione um veículo</option>'; sv.disabled = true; }
            }
            _toggleVeiculoRapidoAgendamento();
        };
    }

    // Bind: select cliente => limpa nome livre e esconde veiculo rapido
    const clienteEl = document.getElementById('agendamentoCliente');
    if (clienteEl) {
        clienteEl.onchange = () => {
            if (clienteEl.value) {
                if (nomeEl) nomeEl.value = '';
                if (secaoVR) secaoVR.style.display = 'none';
            }
            atualizarVeiculosAgendamento();
        };
    }

    if (agendamentoId) {
        editingAgendamentoId = agendamentoId;
        const ag = (AppState.data.agendamentos || []).find(a => a.id === agendamentoId);
        if (ag) {
            if (title) title.textContent = 'Editar Agendamento';
            const clienteId = ag.clienteId || ag.cliente_id;
            const veiculoId = ag.veiculoId || ag.veiculo_id;
            document.getElementById('agendamentoCliente').value = clienteId || '';
            if (nomeEl) nomeEl.value = ag.nome_pre_cadastro || '';
            if (clienteId) {
                await updateVeiculoSelectAgendamento(clienteId, veiculoId);
            }
            document.getElementById('agendamentoData').value = ag.data || '';
            document.getElementById('agendamentoHora').value = ag.hora || '';
            const tipoEl = document.getElementById('agendamentoTipo');
            if (tipoEl) tipoEl.value = ag.tipoServico || ag.tipo_servico || '';
            const obsEl = document.getElementById('agendamentoObservacoes');
            if (obsEl) obsEl.value = ag.observacoes || '';
            _toggleVeiculoRapidoAgendamento();
        }
    } else {
        if (title) title.textContent = 'Novo Agendamento';
        document.getElementById('agendamentoData').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
}

function closeAgendamentoModal() {
    const modal = document.getElementById('agendamentoModal');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('agendamentoForm');
    if (form) form.reset();
    const secaoVR = document.getElementById('agendamentoVeiculoRapidoSecao');
    if (secaoVR) secaoVR.style.display = 'none';
    editingAgendamentoId = null;
}

async function populateClienteSelectAgendamento() {
    const select = document.getElementById('agendamentoCliente');
    if (!select) return;

    if (!AppState.data.clientes || AppState.data.clientes.length === 0) {
        try {
            const sb = await _getSupabaseAG();
            const query = _isSuperadminAG()
                ? sb.from('clientes').select('id, nome').order('nome')
                : sb.from('clientes').select('id, nome').eq('oficina_id', _getOficinaIdAG()).order('nome');
            const { data: clientes, error } = await query;
            if (!error && clientes) AppState.data.clientes = clientes;
        } catch (err) {
            console.warn('[AG] Nao foi possivel recarregar clientes:', err);
        }
    }

    select.innerHTML = '<option value="">Selecione um cliente cadastrado</option>' +
        (AppState.data.clientes || []).map(c => `<option value="${c.id}">${_escAG(c.nome)}</option>`).join('');

    console.log('[AG] populate: ' + (AppState.data.clientes || []).length + ' clientes no select.');
}

async function updateVeiculoSelectAgendamento(clienteId, selectedVeiculoId = null) {
    const select = document.getElementById('agendamentoVeiculo');
    if (!select) return;

    if (!AppState.data.veiculos || AppState.data.veiculos.length === 0) {
        try {
            const sb = await _getSupabaseAG();
            const query = _isSuperadminAG()
                ? sb.from('veiculos').select('id, modelo, placa, cliente_id').order('modelo')
                : sb.from('veiculos').select('id, modelo, placa, cliente_id').eq('oficina_id', _getOficinaIdAG()).order('modelo');
            const { data: veiculos, error } = await query;
            if (!error && veiculos) AppState.data.veiculos = veiculos.map(v => ({ ...v, clienteId: v.cliente_id }));
        } catch (err) {
            console.warn('[AG] Nao foi possivel recarregar veiculos:', err);
        }
    }

    const veiculos = (AppState.data.veiculos || []).filter(v => (v.clienteId || v.cliente_id) == clienteId);
    select.innerHTML = '<option value="">Selecione um veículo</option>' +
        veiculos.map(v => `<option value="${v.id}" ${v.id == selectedVeiculoId ? 'selected' : ''}>${_escAG(v.modelo)} - ${_escAG(v.placa)}</option>`).join('');
    select.disabled = veiculos.length === 0;
}

function atualizarVeiculosAgendamento() {
    const clienteId = document.getElementById('agendamentoCliente')?.value;
    updateVeiculoSelectAgendamento(clienteId);
}

// ============================================
// SALVAR — cria cliente+veiculo reais se nome livre preenchido
// ============================================
async function saveAgendamento(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const nomeEl    = document.getElementById('agendamentoClienteNomeRapido');
    const telEl     = document.getElementById('agendamentoClienteTelefoneRapido');
    const clienteEl = document.getElementById('agendamentoCliente');
    const dataEl    = document.getElementById('agendamentoData');
    const horaEl    = document.getElementById('agendamentoHora');
    const tipoEl    = document.getElementById('agendamentoTipo');
    const obsEl     = document.getElementById('agendamentoObservacoes');
    const veiculoEl = document.getElementById('agendamentoVeiculo');
    // campos de veiculo rapido
    const vModeloEl = document.getElementById('agendamentoVeiculoRapidoModelo');
    const vPlacaEl  = document.getElementById('agendamentoVeiculoRapidoPlaca');

    const nomeLivre = nomeEl?.value.trim()    || '';
    const telLivre  = telEl?.value.trim()     || '';
    let   clienteId = clienteEl?.value.trim() || '';
    const data      = dataEl?.value.trim()    || '';
    const hora      = horaEl?.value.trim()    || '';
    const tipo      = tipoEl?.value.trim()    || '';
    const obs       = obsEl?.value.trim()     || '';
    let   veiculoId = veiculoEl?.value.trim() || '';
    const vModelo   = vModeloEl?.value.trim() || '';
    const vPlaca    = vPlacaEl?.value.trim()  || '';

    console.log('[AG] save - valores:', { nomeLivre, telLivre, clienteId, data, hora, tipo, veiculoId, vModelo, vPlaca });

    if (!data || !hora) { showToast('Data e hora são obrigatórios!', 'error'); return; }
    if (!clienteId && !nomeLivre) { showToast('Selecione um cliente ou informe o nome!', 'error'); return; }

    const OFICINA_ID = _getOficinaIdAG();
    const sb = await _getSupabaseAG();

    // --- Se nome livre preenchido: cria cliente real e (se informado) veiculo real ---
    if (nomeLivre && !clienteId) {
        try {
            const novoCliente = {
                nome:       nomeLivre,
                telefone:   telLivre || null,
                oficina_id: OFICINA_ID
            };
            const { data: clienteCriado, error: errC } = await sb
                .from('clientes').insert(novoCliente).select().single();
            if (errC) throw errC;
            clienteId = clienteCriado.id;
            AppState.data.clientes = AppState.data.clientes || [];
            AppState.data.clientes.push(clienteCriado);
            console.log('[AG] ✅ Cliente criado:', clienteCriado);
        } catch (err) {
            showToast('Erro ao criar cliente: ' + (err.message || err), 'error');
            return;
        }

        // Cria veiculo se modelo ou placa informados
        if (vModelo || vPlaca) {
            try {
                const novoVeiculo = {
                    modelo:     vModelo || 'Não informado',
                    placa:      vPlaca  || null,
                    cliente_id: clienteId,
                    oficina_id: OFICINA_ID
                };
                const { data: veiculoCriado, error: errV } = await sb
                    .from('veiculos').insert(novoVeiculo).select().single();
                if (errV) throw errV;
                veiculoId = veiculoCriado.id;
                AppState.data.veiculos = AppState.data.veiculos || [];
                AppState.data.veiculos.push({ ...veiculoCriado, clienteId: veiculoCriado.cliente_id });
                console.log('[AG] ✅ Veículo criado:', veiculoCriado);
            } catch (err) {
                console.warn('[AG] Falha ao criar veículo (agendamento salvo sem veiculo):', err);
            }
        }
    }

    const agData = {
        oficina_id:  OFICINA_ID,
        cliente_id:  clienteId || null,
        veiculo_id:  veiculoId || null,
        data,
        hora,
        tipo_servico: tipo,
        observacoes:  obs || null,
        status:       'pendente'
    };

    console.log('[AG] Payload agendamento:', agData);

    try {
        if (editingAgendamentoId) {
            const { error } = await _scopeAgendamentoQuery(
                sb.from('agendamentos').update(agData)
            ).eq('id', editingAgendamentoId);
            if (error) throw error;
            const idx = (AppState.data.agendamentos || []).findIndex(a => a.id === editingAgendamentoId);
            if (idx !== -1) AppState.data.agendamentos[idx] = { ...AppState.data.agendamentos[idx], ...agData };
            showToast('Agendamento atualizado!', 'success');
        } else {
            const { data: result, error } = await sb.from('agendamentos').insert(agData).select().single();
            if (error) throw error;
            AppState.data.agendamentos = AppState.data.agendamentos || [];
            AppState.data.agendamentos.unshift(result);
            showToast('Agendamento criado!', 'success');
        }
        closeAgendamentoModal();
        renderAgendamentos();
        updateDashboard?.();
    } catch (err) {
        console.error('[AG] ❌ Erro ao salvar:', err);
        showToast('Erro ao salvar: ' + (err.message || err), 'error');
    }
}

function salvarAgendamento() {
    const form = document.getElementById('agendamentoForm');
    if (form && typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    saveAgendamento(null);
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
    if (!confirm('Converter este agendamento em Ordem de Serviço?')) return;

    const clienteId = ag.clienteId || ag.cliente_id;
    const veiculoId = ag.veiculoId || ag.veiculo_id;
    const sb = await _getSupabaseAG();

    let cliente = AppState.data.clientes.find(c => c.id === clienteId);
    if (!cliente && clienteId) {
        const { data: c } = await sb.from('clientes').select('*').eq('id', clienteId).single();
        if (c) { cliente = c; AppState.data.clientes.push(c); }
    }

    let veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    if (!veiculo && veiculoId) {
        const { data: v } = await sb.from('veiculos').select('*').eq('id', veiculoId).single();
        if (v) { veiculo = { ...v, clienteId: v.cliente_id }; AppState.data.veiculos.push(veiculo); }
    }

    if (!cliente) { showToast('Cliente não encontrado. Verifique o cadastro.', 'error'); return; }
    if (!veiculo) { showToast('Veículo não vinculado. Cadastre um veículo primeiro.', 'error'); return; }

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
        descricao: `${ag.tipoServico || ag.tipo_servico || 'Serviço'} — Agendado para ${ag.data} ${ag.hora}`,
        observacoes: ag.observacoes || '',
        valor_total: 0,
        oficina_id: _getOficinaIdAG()
    };

    const { error: errOS } = await sb.from('ordens_servico').insert(osData);
    if (errOS) { showToast('Erro ao criar OS!', 'error'); console.error(errOS); return; }

    const { error: errAg } = await _scopeAgendamentoQuery(
        sb.from('agendamentos').update({ status: 'atendido' })
    ).eq('id', agendamentoId);
    if (errAg) {
        await sb.from('ordens_servico').delete().eq('id', osId);
        showToast('Erro ao atualizar agendamento!', 'error');
        return;
    }

    ag.status = 'atendido';
    AppState.data.ordensServico = AppState.data.ordensServico || [];
    AppState.data.ordensServico.unshift({ ...osData, clienteId, veiculoId, valorTotal: 0, servicos: [] });
    renderAgendamentos();
    updateDashboard();
    showToast('OS criada! Número: ' + nextNumero, 'success');
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
    showToast('Agendamento excluído!', 'success');
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
    const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    const modal = document.getElementById('modalViewAgendamento');
    const content = document.getElementById('viewAgendamentoContent');
    content.innerHTML = `
        <div class="agendamento-view-section">
            <h4>Informações do Agendamento</h4>
            <p><strong>Data:</strong> ${formatDate(ag.data)}</p>
            <p><strong>Horário:</strong> ${_escAG(ag.hora || '-')}</p>
            <p><strong>Status:</strong> ${getAgendamentoStatusBadge(ag.status)}</p>
            <p><strong>Serviço:</strong> ${_escAG(ag.tipoServico || ag.tipo_servico || '-')}</p>
        </div>
        <div class="agendamento-view-section">
            <h4>Cliente e Veículo</h4>
            <p><strong>Cliente:</strong> ${_escAG(cliente?.nome || ag.nome_pre_cadastro || 'N/A')}</p>
            <p><strong>Telefone:</strong> ${_escAG(cliente?.telefone || 'N/A')}</p>
            <p><strong>Veículo:</strong> ${_escAG(veiculo?.modelo || 'N/A')}</p>
            <p><strong>Placa:</strong> ${_escAG(veiculo?.placa || 'N/A')}</p>
        </div>
        ${ag.observacoes ? `<div class="agendamento-view-section"><h4>Observações</h4><p>${_escAG(ag.observacoes)}</p></div>` : ''}
    `;
    modal.classList.add('active');
}

function closeViewAgendamentoModal() {
    const modal = document.getElementById('modalViewAgendamento');
    if (modal) modal.classList.remove('active');
}

// ============================================
// STATS
// ============================================
function updateAgendamentoStats() {
    const agendamentos = AppState.data.agendamentos || [];
    const hoje = new Date().toISOString().split('T')[0];
    const statsEl = document.getElementById('agendamentoStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${agendamentos.length}</span></div>
            <div class="stat-item"><span class="stat-label">Hoje:</span><span class="stat-value badge-info">${agendamentos.filter(a => a.data === hoje).length}</span></div>
            <div class="stat-item"><span class="stat-label">Pendentes:</span><span class="stat-value badge-warning">${agendamentos.filter(a => a.status === 'pendente').length}</span></div>
            <div class="stat-item"><span class="stat-label">Confirmados:</span><span class="stat-value badge-success">${agendamentos.filter(a => a.status === 'confirmado').length}</span></div>
        `;
    }
}
