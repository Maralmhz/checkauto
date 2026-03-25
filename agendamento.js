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
    const id = _getOficinaIdAG();
    return id ? query.eq('oficina_id', id) : query;
}
function _escAG(s = '') {
    return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

// Helper: busca campo DENTRO do modal (evita conflito com IDs duplicados fora do modal)
function _mqAG(id) {
    const modal = document.getElementById('agendamentoModal');
    return modal ? modal.querySelector('#' + id) : document.getElementById(id);
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
    const lista = (AppState.data.agendamentos || []).filter(a => a.data === hoje);
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum agendamento para hoje</td></tr>'; return; }
    tbody.innerHTML = lista.sort((a,b) => a.hora.localeCompare(b.hora)).map(ag => {
        const cliente = AppState.data.clientes.find(c => c.id === (ag.cliente_id || ag.clienteId));
        const veiculo = AppState.data.veiculos.find(v => v.id === (ag.veiculo_id || ag.veiculoId));
        return `<tr>
            <td><strong>${ag.hora}</strong></td>
            <td>${_escAG(cliente?.nome || ag.nome_pre_cadastro || 'N/A')}</td>
            <td>${_escAG(veiculo?.modelo || '-')} ${veiculo?.placa ? '- '+_escAG(veiculo.placa) : ''}</td>
            <td>${_escAG(ag.tipoServico || ag.tipo_servico || '')}</td>
            <td>${getAgendamentoStatusBadge(ag.status)}</td>
            <td>
                <button class="btn-icon" onclick="viewAgendamento('${ag.id}')" title="Ver"><i class="fas fa-eye"></i></button>
                ${ag.status==='confirmado'?`<button class="btn-icon btn-success" onclick="converterEmOS('${ag.id}')" title="Converter em OS"><i class="fas fa-check-circle"></i></button>`:''}
            </td>
        </tr>`;
    }).join('');
}

function renderListaAgendamentos() {
    const tbody = document.getElementById('listaAgendamentosTable');
    if (!tbody) return;
    const lista = filterAgendamentos();
    if (!lista.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum agendamento encontrado</td></tr>'; return; }
    tbody.innerHTML = lista.map(ag => {
        const cliente = AppState.data.clientes.find(c => c.id === (ag.cliente_id || ag.clienteId));
        const veiculo = AppState.data.veiculos.find(v => v.id === (ag.veiculo_id || ag.veiculoId));
        return `<tr>
            <td>${formatDate(ag.data)}</td>
            <td><strong>${ag.hora}</strong></td>
            <td>${_escAG(cliente?.nome || ag.nome_pre_cadastro || 'N/A')}</td>
            <td>${_escAG(veiculo?.modelo || '-')} ${veiculo?.placa ? '- '+_escAG(veiculo.placa) : ''}</td>
            <td>${_escAG(ag.tipoServico || ag.tipo_servico || '')}</td>
            <td>${getAgendamentoStatusBadge(ag.status)}</td>
            <td>
                <button class="btn-icon" onclick="viewAgendamento('${ag.id}')" title="Ver"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="editAgendamento('${ag.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                ${getAgendamentoActions(ag)}
            </td>
        </tr>`;
    }).join('');
}

function getAgendamentoActions(ag) {
    if (ag.status === 'pendente')   return `<button class="btn-icon btn-success" onclick="confirmarAgendamento('${ag.id}')" title="Confirmar"><i class="fas fa-check"></i></button>`;
    if (ag.status === 'confirmado') return `<button class="btn-icon btn-success" onclick="converterEmOS('${ag.id}')" title="Converter em OS"><i class="fas fa-clipboard-check"></i></button>`;
    if (ag.status === 'cancelado')  return `<button class="btn-icon btn-danger" onclick="deleteAgendamento('${ag.id}')" title="Excluir"><i class="fas fa-trash"></i></button>`;
    return '';
}

function filterAgendamentos() {
    const status = document.getElementById('filterAgendamentoStatus')?.value || 'todos';
    const term   = document.getElementById('searchAgendamentos')?.value.toLowerCase() || '';
    return (AppState.data.agendamentos || []).filter(ag => {
        const cliente = AppState.data.clientes.find(c => c.id === (ag.cliente_id || ag.clienteId));
        const veiculo = AppState.data.veiculos.find(v => v.id === (ag.veiculo_id || ag.veiculoId));
        return (status === 'todos' || ag.status === status) &&
            (!term ||
                (cliente?.nome||'').toLowerCase().includes(term) ||
                (ag.nome_pre_cadastro||'').toLowerCase().includes(term) ||
                (veiculo?.placa||'').toLowerCase().includes(term) ||
                (veiculo?.modelo||'').toLowerCase().includes(term) ||
                (ag.tipoServico||ag.tipo_servico||'').toLowerCase().includes(term));
    });
}

function getAgendamentoStatusBadge(status) {
    return {
        pendente:   '<span class="badge badge-warning">Pendente</span>',
        confirmado: '<span class="badge badge-success">Confirmado</span>',
        cancelado:  '<span class="badge badge-danger">Cancelado</span>',
        atendido:   '<span class="badge badge-info">Atendido</span>'
    }[status] || status;
}

// ============================================
// MODAL — abre e popula
// ============================================
async function openAgendamentoModal(agendamentoId = null) {
    const modal = document.getElementById('agendamentoModal');
    if (!modal) { console.error('[AG] #agendamentoModal nao encontrado'); return; }

    // Reset visual sem usar form.reset() (que limpa selects populados)
    const form = modal.querySelector('#agendamentoForm');
    if (form) form.reset();
    editingAgendamentoId = null;

    const secaoVR = modal.querySelector('#agendamentoVeiculoRapidoSecao');
    if (secaoVR) secaoVR.style.display = 'none';

    // Força recarregar clientes sempre ao abrir (garante novos cadastros aparecerem)
    AppState.data.clientes = [];
    await populateClienteSelectAgendamento();

    const nomeEl    = modal.querySelector('#agendamentoClienteNomeRapido');
    const clienteEl = modal.querySelector('#agendamentoCliente');
    const veiculoEl = modal.querySelector('#agendamentoVeiculo');

    if (nomeEl) {
        nomeEl.oninput = () => {
            if (nomeEl.value.trim()) {
                clienteEl.value = '';
                if (veiculoEl) { veiculoEl.innerHTML = '<option value="">Selecione um veículo</option>'; veiculoEl.disabled = true; }
            }
            if (secaoVR) secaoVR.style.display = nomeEl.value.trim() && !clienteEl.value ? 'block' : 'none';
        };
    }

    if (clienteEl) {
        clienteEl.onchange = () => {
            if (clienteEl.value && nomeEl) nomeEl.value = '';
            if (secaoVR) secaoVR.style.display = 'none';
            updateVeiculoSelectAgendamento(clienteEl.value);
        };
    }

    const title = modal.querySelector('#agendamentoModalTitle');

    if (agendamentoId) {
        editingAgendamentoId = agendamentoId;
        const ag = (AppState.data.agendamentos || []).find(a => a.id === agendamentoId);
        if (ag && title) title.textContent = 'Editar Agendamento';
        if (ag) {
            const cid = ag.cliente_id || ag.clienteId;
            const vid = ag.veiculo_id || ag.veiculoId;
            if (clienteEl) clienteEl.value = cid || '';
            if (cid) await updateVeiculoSelectAgendamento(cid, vid);
            const dataEl = modal.querySelector('#agendamentoData');
            const horaEl = modal.querySelector('#agendamentoHora');
            const tipoEl = modal.querySelector('#agendamentoTipo');
            const obsEl  = modal.querySelector('#agendamentoObservacoes');
            if (dataEl) dataEl.value = ag.data || '';
            if (horaEl) horaEl.value = ag.hora || '';
            if (tipoEl) tipoEl.value = ag.tipoServico || ag.tipo_servico || '';
            if (obsEl)  obsEl.value  = ag.observacoes || '';
        }
    } else {
        if (title) title.textContent = 'Novo Agendamento';
        const dataEl = modal.querySelector('#agendamentoData');
        if (dataEl) dataEl.value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
}

function closeAgendamentoModal() {
    const modal = document.getElementById('agendamentoModal');
    if (!modal) return;
    modal.classList.remove('active');
    const form = modal.querySelector('#agendamentoForm');
    if (form) form.reset();
    const secaoVR = modal.querySelector('#agendamentoVeiculoRapidoSecao');
    if (secaoVR) secaoVR.style.display = 'none';
    editingAgendamentoId = null;
}

async function populateClienteSelectAgendamento() {
    const modal  = document.getElementById('agendamentoModal');
    const select = modal ? modal.querySelector('#agendamentoCliente') : document.getElementById('agendamentoCliente');
    if (!select) return;

    try {
        const sb = await _getSupabaseAG();
        const q = _isSuperadminAG()
            ? sb.from('clientes').select('id, nome').order('nome')
            : sb.from('clientes').select('id, nome').eq('oficina_id', _getOficinaIdAG()).order('nome');
        const { data: clientes, error } = await q;
        if (!error && clientes) AppState.data.clientes = clientes;
    } catch(err) {
        console.warn('[AG] Erro ao carregar clientes:', err);
    }

    select.innerHTML = '<option value="">Selecione um cliente cadastrado</option>' +
        (AppState.data.clientes || []).map(c => `<option value="${c.id}">${_escAG(c.nome)}</option>`).join('');
    console.log('[AG] populate: ' + (AppState.data.clientes||[]).length + ' clientes.');
}

async function updateVeiculoSelectAgendamento(clienteId, selectedId = null) {
    const modal  = document.getElementById('agendamentoModal');
    const select = modal ? modal.querySelector('#agendamentoVeiculo') : document.getElementById('agendamentoVeiculo');
    if (!select) return;

    if (!clienteId) {
        select.innerHTML = '<option value="">Selecione um veículo</option>';
        select.disabled = true;
        return;
    }

    try {
        const sb = await _getSupabaseAG();
        const { data: veiculos, error } = await sb.from('veiculos')
            .select('id, modelo, placa, cliente_id')
            .eq('cliente_id', clienteId)
            .order('modelo');
        if (!error && veiculos) {
            select.innerHTML = '<option value="">Selecione um veículo</option>' +
                veiculos.map(v => `<option value="${v.id}" ${v.id===selectedId?'selected':''}>${_escAG(v.modelo)} - ${_escAG(v.placa||'')}</option>`).join('');
            select.disabled = veiculos.length === 0;
            // atualiza AppState tambem
            veiculos.forEach(v => {
                if (!AppState.data.veiculos.find(x => x.id === v.id))
                    AppState.data.veiculos.push({...v, clienteId: v.cliente_id});
            });
        }
    } catch(err) {
        console.warn('[AG] Erro ao carregar veiculos:', err);
        select.disabled = true;
    }
}

function atualizarVeiculosAgendamento() {
    const modal  = document.getElementById('agendamentoModal');
    const cid    = modal ? modal.querySelector('#agendamentoCliente')?.value : '';
    updateVeiculoSelectAgendamento(cid);
}

// ============================================
// SALVAR
// ============================================
async function saveAgendamento(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const modal = document.getElementById('agendamentoModal');
    const q     = id => modal ? modal.querySelector('#'+id) : document.getElementById(id);

    const nomeEl    = q('agendamentoClienteNomeRapido');
    const telEl     = q('agendamentoClienteTelefoneRapido');
    const clienteEl = q('agendamentoCliente');
    const dataEl    = q('agendamentoData');
    const horaEl    = q('agendamentoHora');
    const tipoEl    = q('agendamentoTipo');
    const obsEl     = q('agendamentoObservacoes');
    const veiculoEl = q('agendamentoVeiculo');
    const vModeloEl = q('agendamentoVeiculoRapidoModelo');
    const vPlacaEl  = q('agendamentoVeiculoRapidoPlaca');

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

    console.log('[AG] save:', { nomeLivre, telLivre, clienteId, data, hora, tipo, veiculoId, vModelo, vPlaca });

    if (!data || !hora) { showToast('Data e hora são obrigatórios!', 'error'); return; }
    if (!clienteId && !nomeLivre) { showToast('Selecione um cliente ou informe o nome!', 'error'); return; }

    const OFICINA_ID = _getOficinaIdAG();
    const sb = await _getSupabaseAG();

    if (nomeLivre && !clienteId) {
        try {
            const { data: c, error: errC } = await sb.from('clientes')
                .insert({ nome: nomeLivre, telefone: telLivre || null, oficina_id: OFICINA_ID })
                .select().single();
            if (errC) throw errC;
            clienteId = c.id;
            AppState.data.clientes = AppState.data.clientes || [];
            AppState.data.clientes.push(c);
            console.log('[AG] ✅ Cliente criado:', c);
        } catch(err) {
            showToast('Erro ao criar cliente: ' + (err.message || err), 'error');
            return;
        }

        if (vModelo || vPlaca) {
            try {
                const { data: v, error: errV } = await sb.from('veiculos')
                    .insert({ modelo: vModelo||'Não informado', placa: vPlaca||null, cliente_id: clienteId, oficina_id: OFICINA_ID })
                    .select().single();
                if (errV) throw errV;
                veiculoId = v.id;
                AppState.data.veiculos = AppState.data.veiculos || [];
                AppState.data.veiculos.push({...v, clienteId: v.cliente_id});
                console.log('[AG] ✅ Veículo criado:', v);
            } catch(err) {
                console.warn('[AG] Falha ao criar veículo:', err);
            }
        }
    }

    const agData = {
        oficina_id:   OFICINA_ID,
        cliente_id:   clienteId || null,
        veiculo_id:   veiculoId || null,
        data, hora,
        tipo_servico: tipo,
        observacoes:  obs || null,
        status:       'pendente'
    };

    console.log('[AG] payload:', agData);

    try {
        if (editingAgendamentoId) {
            const { error } = await _scopeAgendamentoQuery(
                sb.from('agendamentos').update(agData)
            ).eq('id', editingAgendamentoId);
            if (error) throw error;
            const idx = (AppState.data.agendamentos||[]).findIndex(a => a.id === editingAgendamentoId);
            if (idx !== -1) AppState.data.agendamentos[idx] = {...AppState.data.agendamentos[idx], ...agData};
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
    } catch(err) {
        console.error('[AG] ❌ Erro ao salvar:', err);
        showToast('Erro ao salvar: ' + (err.message || err), 'error');
    }
}

function salvarAgendamento() {
    const form = document.getElementById('agendamentoModal')?.querySelector('#agendamentoForm');
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
    const ag = (AppState.data.agendamentos||[]).find(a => a.id === id);
    if (ag) ag.status = 'confirmado';
    renderAgendamentos();
    showToast('Agendamento confirmado!', 'success');
}

// ============================================
// CONVERTER EM OS
// ============================================
async function converterEmOS(agendamentoId) {
    const ag = (AppState.data.agendamentos||[]).find(a => a.id === agendamentoId);
    if (!ag || !confirm('Converter este agendamento em Ordem de Serviço?')) return;

    const clienteId = ag.cliente_id || ag.clienteId;
    const veiculoId = ag.veiculo_id || ag.veiculoId;
    const sb = await _getSupabaseAG();

    let cliente = AppState.data.clientes.find(c => c.id === clienteId);
    if (!cliente && clienteId) {
        const { data: c } = await sb.from('clientes').select('*').eq('id', clienteId).single();
        if (c) { cliente = c; AppState.data.clientes.push(c); }
    }
    let veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    if (!veiculo && veiculoId) {
        const { data: v } = await sb.from('veiculos').select('*').eq('id', veiculoId).single();
        if (v) { veiculo = {...v, clienteId: v.cliente_id}; AppState.data.veiculos.push(veiculo); }
    }

    if (!cliente) { showToast('Cliente não encontrado.', 'error'); return; }
    if (!veiculo) { showToast('Veículo não vinculado. Cadastre um veículo primeiro.', 'error'); return; }

    const nextNumero = ((AppState.data.ordensServico||[]).length + 1).toString().padStart(6,'0');
    const osId = `OS-${Date.now()}`;
    const osData = {
        id: osId, numero: nextNumero, status: 'aguardando',
        cliente_id: clienteId, cliente: cliente.nome,
        veiculo_id: veiculoId, veiculo: `${veiculo.modelo} - ${veiculo.placa}`,
        data: new Date().toISOString().split('T')[0],
        descricao: `${ag.tipoServico||ag.tipo_servico||'Serviço'} — Agendado para ${ag.data} ${ag.hora}`,
        observacoes: ag.observacoes || '', valor_total: 0,
        oficina_id: _getOficinaIdAG()
    };

    const { error: errOS } = await sb.from('ordens_servico').insert(osData);
    if (errOS) { showToast('Erro ao criar OS!', 'error'); return; }

    const { error: errAg } = await _scopeAgendamentoQuery(
        sb.from('agendamentos').update({ status: 'atendido' })
    ).eq('id', agendamentoId);
    if (errAg) { await sb.from('ordens_servico').delete().eq('id', osId); showToast('Erro ao atualizar agendamento!', 'error'); return; }

    ag.status = 'atendido';
    AppState.data.ordensServico = AppState.data.ordensServico || [];
    AppState.data.ordensServico.unshift({...osData, clienteId, veiculoId, valorTotal: 0, servicos: []});
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
    if (!confirm('Excluir este agendamento?')) return;
    const sb = await _getSupabaseAG();
    const { error } = await _scopeAgendamentoQuery(sb.from('agendamentos').delete()).eq('id', id);
    if (error) { showToast('Erro ao excluir!', 'error'); return; }
    AppState.data.agendamentos = (AppState.data.agendamentos||[]).filter(a => a.id !== id);
    renderAgendamentos();
    updateDashboard();
    showToast('Agendamento excluído!', 'success');
}

// ============================================
// VER
// ============================================
function viewAgendamento(id) {
    const ag = (AppState.data.agendamentos||[]).find(a => a.id === id);
    if (!ag) return;
    const cliente = AppState.data.clientes.find(c => c.id === (ag.cliente_id||ag.clienteId));
    const veiculo = AppState.data.veiculos.find(v => v.id === (ag.veiculo_id||ag.veiculoId));
    const modal   = document.getElementById('modalViewAgendamento');
    const content = document.getElementById('viewAgendamentoContent');
    content.innerHTML = `
        <div class="agendamento-view-section">
            <h4>Informações do Agendamento</h4>
            <p><strong>Data:</strong> ${formatDate(ag.data)}</p>
            <p><strong>Horário:</strong> ${_escAG(ag.hora||'-')}</p>
            <p><strong>Status:</strong> ${getAgendamentoStatusBadge(ag.status)}</p>
            <p><strong>Serviço:</strong> ${_escAG(ag.tipoServico||ag.tipo_servico||'-')}</p>
        </div>
        <div class="agendamento-view-section">
            <h4>Cliente e Veículo</h4>
            <p><strong>Cliente:</strong> ${_escAG(cliente?.nome||ag.nome_pre_cadastro||'N/A')}</p>
            <p><strong>Telefone:</strong> ${_escAG(cliente?.telefone||'N/A')}</p>
            <p><strong>Veículo:</strong> ${_escAG(veiculo?.modelo||'N/A')}</p>
            <p><strong>Placa:</strong> ${_escAG(veiculo?.placa||'N/A')}</p>
        </div>
        ${ag.observacoes?`<div class="agendamento-view-section"><h4>Observações</h4><p>${_escAG(ag.observacoes)}</p></div>`:''}
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
    const ags   = AppState.data.agendamentos || [];
    const hoje  = new Date().toISOString().split('T')[0];
    const el    = document.getElementById('agendamentoStats');
    if (el) el.innerHTML = `
        <div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${ags.length}</span></div>
        <div class="stat-item"><span class="stat-label">Hoje:</span><span class="stat-value badge-info">${ags.filter(a=>a.data===hoje).length}</span></div>
        <div class="stat-item"><span class="stat-label">Pendentes:</span><span class="stat-value badge-warning">${ags.filter(a=>a.status==='pendente').length}</span></div>
        <div class="stat-item"><span class="stat-label">Confirmados:</span><span class="stat-value badge-success">${ags.filter(a=>a.status==='confirmado').length}</span></div>
    `;
}
