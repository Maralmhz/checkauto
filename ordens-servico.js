// ============================================
// GESTAO DE ORDENS DE SERVICO — Supabase
// ============================================
async function _getSupabaseOS() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient('https://hefpzigrxyyhvtgkyspr.supabase.co','sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk');
    return window._supabase;
}
function _getOficinaIdOS() { return window.AppState?.user?.oficina_id || null; }


function _isSuperadminOS() { return window.AppState?.user?.role === 'superadmin'; }

function _scopeOSQuery(query) {
    if (_isSuperadminOS()) return query;
    const oficinaId = _getOficinaIdOS();
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}

let editingOSId = null;
let servicosOS = [];

function renderOrdensServico() {
    const tbody = document.getElementById('ordensServicoTableBody');
    if (!tbody) return;
    const filteredOS = filterOS(AppState.data.ordensServico || []);
    if (filteredOS.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma ordem de servico encontrada</td></tr>';
        return;
    }
    tbody.innerHTML = filteredOS.map(os => `
        <tr>
            <td><strong>${os.numero}</strong></td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td>${getStatusBadge(os.status)}</td>
            <td>${formatDate(os.data)}</td>
            <td><strong>${formatMoney(os.valorTotal || os.valor_total || 0)}</strong></td>
            <td>
                <button class="btn-icon" onclick="viewOS('${os.id}')" title="Ver"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="editOS('${os.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                ${getStatusActions(os)}
            </td>
        </tr>
    `).join('');
    updateOSStats();
}

function getStatusActions(os) {
    if (os.status === 'aguardando')   return `<button class="btn-icon btn-success" onclick="changeOSStatus('${os.id}','em_andamento')" title="Iniciar"><i class="fas fa-play"></i></button>`;
    if (os.status === 'em_andamento') return `<button class="btn-icon btn-success" onclick="changeOSStatus('${os.id}','concluida')" title="Concluir"><i class="fas fa-check"></i></button>`;
    if (os.status === 'concluida')    return `<button class="btn-icon btn-danger" onclick="deleteOS('${os.id}')" title="Excluir"><i class="fas fa-trash"></i></button>`;
    return '';
}

function filterOS(ordensServico) {
    const statusFilter = document.getElementById('filterStatus')?.value || 'todos';
    const searchTerm   = document.getElementById('searchOS')?.value.toLowerCase() || '';
    return ordensServico.filter(os => {
        const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
        const matchSearch = !searchTerm || os.numero?.toLowerCase().includes(searchTerm) || os.cliente?.toLowerCase().includes(searchTerm) || os.veiculo?.toLowerCase().includes(searchTerm);
        return matchStatus && matchSearch;
    });
}

function openOSModal(osId = null) {
    const modal = document.getElementById('osModal') || document.getElementById('modalOS');
    const title = document.getElementById('osModalTitle') || document.getElementById('modalOSTitle');
    populateClienteSelect();
    servicosOS = [];
    if (osId) {
        editingOSId = osId;
        const os = AppState.data.ordensServico.find(o => o.id === osId);
        if (os) {
            title.textContent = 'Editar Ordem de Servico';
            const clienteId = os.clienteId || os.cliente_id;
            const veiculoId = os.veiculoId || os.veiculo_id;
            document.getElementById('osCliente').value = clienteId || '';
            updateVeiculoSelect(clienteId, veiculoId);
            document.getElementById('osData').value = os.data || '';
            document.getElementById('osDescricao').value = os.descricao || '';
            document.getElementById('osObservacoes').value = os.observacoes || '';
            servicosOS = (os.servicos || os.os_servicos || []).map(s => ({ id: s.id, descricao: s.descricao, valor: s.valor }));
            renderServicosOS();
        }
    } else {
        editingOSId = null;
        title.textContent = 'Nova Ordem de Servico';
        (document.getElementById('osForm') || document.getElementById('formOS')).reset();
        document.getElementById('osData').value = new Date().toISOString().split('T')[0];
        servicosOS = [];
        renderServicosOS();
    }
    modal.classList.add('active');
}

function closeOSModal() {
    const modal = document.getElementById('osModal') || document.getElementById('modalOS');
    if (modal) modal.classList.remove('active');
    (document.getElementById('osForm') || document.getElementById('formOS'))?.reset();
    editingOSId = null;
    servicosOS = [];
}

function populateClienteSelect() {
    const select = document.getElementById('osCliente');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente</option>' +
        AppState.data.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function updateVeiculoSelect(clienteId, selectedVeiculoId = null) {
    const select = document.getElementById('osVeiculo');
    if (!select) return;
    const veiculos = AppState.data.veiculos.filter(v => (v.clienteId || v.cliente_id) == clienteId);
    select.innerHTML = '<option value="">Selecione um veiculo</option>' +
        veiculos.map(v => `<option value="${v.id}" ${v.id == selectedVeiculoId ? 'selected' : ''}>${v.modelo} - ${v.placa}</option>`).join('');
    select.disabled = veiculos.length === 0;
}

function atualizarVeiculosOS() {
    const clienteId = document.getElementById('osCliente')?.value;
    updateVeiculoSelect(clienteId);
}

function addServicoOS() {
    const descricao = document.getElementById('servicoDescricao').value;
    const valor = parseFloat(document.getElementById('servicoValor').value) || 0;
    if (!descricao || valor <= 0) { showToast('Preencha descricao e valor', 'info'); return; }
    servicosOS.push({ id: Date.now(), descricao, valor });
    document.getElementById('servicoDescricao').value = '';
    document.getElementById('servicoValor').value = '';
    document.getElementById('servicoDescricao').focus();
    renderServicosOS();
}

function removeServicoOS(id) {
    servicosOS = servicosOS.filter(s => s.id != id);
    renderServicosOS();
}

function renderServicosOS() {
    const tbody = document.getElementById('osServicosTable');
    if (!tbody) return;
    const total = servicosOS.reduce((sum, s) => sum + s.valor, 0);
    if (servicosOS.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum servico adicionado</td></tr>';
        document.getElementById('osTotal').textContent = formatMoney(0);
        return;
    }
    tbody.innerHTML = servicosOS.map(s => `
        <tr>
            <td>${s.descricao}</td>
            <td>${formatMoney(s.valor)}</td>
            <td><button class="btn-icon btn-danger" onclick="removeServicoOS(${s.id})"><i class="fas fa-times"></i></button></td>
        </tr>
    `).join('');
    document.getElementById('osTotal').textContent = formatMoney(total);
}

async function saveOS(event) {
    if (event) event.preventDefault();
    const clienteId = document.getElementById('osCliente').value;
    const veiculoId = document.getElementById('osVeiculo').value;
    if (!clienteId || !veiculoId) { showToast('Selecione cliente e veiculo', 'info'); return; }
    if (servicosOS.length === 0) { showToast('Adicione pelo menos um servico', 'info'); return; }

    const cliente = AppState.data.clientes.find(c => c.id === clienteId);
    const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    const total   = servicosOS.reduce((sum, s) => sum + s.valor, 0);
    const sb      = await _getSupabaseOS();

    if (editingOSId) {
        const osData = {
            cliente_id: clienteId, cliente: cliente.nome,
            veiculo_id: veiculoId, veiculo: `${veiculo.modelo} - ${veiculo.placa}`,
            data: document.getElementById('osData').value,
            descricao: document.getElementById('osDescricao').value,
            observacoes: document.getElementById('osObservacoes').value,
            valor_total: total
        };
        const { error } = await _scopeOSQuery(sb.from('ordens_servico').update(osData)).eq('id', editingOSId);
        if (error) { showToast('Erro ao atualizar OS!', 'error'); console.error(error); return; }
        await sb.from('os_servicos').delete().eq('os_id', editingOSId);
        if (servicosOS.length > 0) await sb.from('os_servicos').insert(servicosOS.map(s => ({ os_id: editingOSId, descricao: s.descricao, valor: s.valor })));
        const idx = AppState.data.ordensServico.findIndex(o => o.id === editingOSId);
        if (idx !== -1) AppState.data.ordensServico[idx] = { ...AppState.data.ordensServico[idx], ...osData, clienteId, veiculoId, valorTotal: total, servicos: servicosOS };
        showToast('OS atualizada!', 'success');
    } else {
        const osId = `OS-${Date.now()}`;
        const oficina_id = _getOficinaIdOS();
        const osData = {
            id: osId,
            numero: (AppState.data.ordensServico.length + 1).toString().padStart(6, '0'),
            status: 'aguardando',
            cliente_id: clienteId, cliente: cliente.nome,
            veiculo_id: veiculoId, veiculo: `${veiculo.modelo} - ${veiculo.placa}`,
            data: document.getElementById('osData').value,
            descricao: document.getElementById('osDescricao').value,
            observacoes: document.getElementById('osObservacoes').value,
            valor_total: total,
            oficina_id
        };
        const { error } = await sb.from('ordens_servico').insert(osData);
        if (error) { showToast('Erro ao criar OS!', 'error'); console.error(error); return; }
        if (servicosOS.length > 0) await sb.from('os_servicos').insert(servicosOS.map(s => ({ os_id: osId, descricao: s.descricao, valor: s.valor })));
        AppState.data.ordensServico.unshift({ ...osData, clienteId, veiculoId, valorTotal: total, servicos: servicosOS });
        showToast('OS criada!', 'success');
    }
    renderOrdensServico();
    closeOSModal();
    updateDashboard();
}

function salvarOS() {
    const form = document.getElementById('osForm');
    if (form && !form.reportValidity()) return;
    saveOS();
}

async function changeOSStatus(osId, newStatus) {
    const os = AppState.data.ordensServico.find(o => o.id === osId);
    if (!os) return;
    const msgs = { 'em_andamento': 'Iniciar esta OS?', 'concluida': 'Concluir esta OS?', 'cancelada': 'Cancelar esta OS?' };
    if (!confirm(msgs[newStatus])) return;
    const sb = await _getSupabaseOS();
    const updateData = { status: newStatus };
    if (newStatus === 'concluida') updateData.data_conclusao = new Date().toISOString().split('T')[0];
    const { error } = await _scopeOSQuery(sb.from('ordens_servico').update(updateData)).eq('id', osId);
    if (error) { showToast('Erro ao atualizar status!', 'error'); return; }
    os.status = newStatus;
    if (newStatus === 'concluida') os.dataConclusao = updateData.data_conclusao;
    if (typeof syncContasReceberFromOS === 'function') syncContasReceberFromOS();
    if (typeof renderContasReceber === 'function') renderContasReceber();
    updateDashboard();
    renderOrdensServico();
    showToast('Status atualizado!', 'success');
}

async function deleteOS(osId) {
    if (!confirm('Excluir esta OS?')) return;
    const sb = await _getSupabaseOS();
    const { error } = await _scopeOSQuery(sb.from('ordens_servico').delete()).eq('id', osId);
    if (error) { showToast('Erro ao excluir OS!', 'error'); return; }
    AppState.data.ordensServico = AppState.data.ordensServico.filter(o => o.id !== osId);
    renderOrdensServico();
    updateDashboard();
    showToast('OS excluida!', 'success');
}

function editOS(osId) { openOSModal(osId); }

function viewOS(osId) {
    const os = AppState.data.ordensServico.find(o => o.id === osId);
    if (!os) return;
    const modal   = document.getElementById('modalViewOS') || document.getElementById('viewOSModal');
    const content = document.getElementById('viewOSContent');
    const servicos = os.servicos || os.os_servicos || [];
    const valorTotal = os.valorTotal || os.valor_total || 0;
    const dataConclusao = os.dataConclusao || os.data_conclusao;
    content.innerHTML = `
        <div class="os-view-section">
            <h4>Informacoes Gerais</h4>
            <p><strong>Numero OS:</strong> ${os.numero}</p>
            <p><strong>Cliente:</strong> ${os.cliente}</p>
            <p><strong>Veiculo:</strong> ${os.veiculo}</p>
            <p><strong>Data:</strong> ${formatDate(os.data)}</p>
            <p><strong>Status:</strong> ${getStatusBadge(os.status)}</p>
            ${dataConclusao ? `<p><strong>Concluida em:</strong> ${formatDate(dataConclusao)}</p>` : ''}
        </div>
        <div class="os-view-section">
            <h4>Servicos</h4>
            <table class="table"><thead><tr><th>Descricao</th><th>Valor</th></tr></thead>
            <tbody>${servicos.map(s => `<tr><td>${s.descricao}</td><td>${formatMoney(s.valor)}</td></tr>`).join('') || '<tr><td colspan="2">Nenhum servico</td></tr>'}</tbody></table>
            <p class="os-total"><strong>Total: ${formatMoney(valorTotal)}</strong></p>
        </div>
        ${os.descricao ? `<div class="os-view-section"><h4>Descricao</h4><p>${os.descricao}</p></div>` : ''}
        ${os.observacoes ? `<div class="os-view-section"><h4>Observacoes</h4><p>${os.observacoes}</p></div>` : ''}
    `;
    modal.classList.add('active');
}

function closeViewOSModal() {
    const modal = document.getElementById('modalViewOS') || document.getElementById('viewOSModal');
    if (modal) modal.classList.remove('active');
}

function updateOSStats() {
    const oss = AppState.data.ordensServico;
    const statsEl = document.getElementById('osStats');
    if (!statsEl) return;
    statsEl.innerHTML = `
        <div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${oss.length}</span></div>
        <div class="stat-item"><span class="stat-label">Aguardando:</span><span class="stat-value badge-warning">${oss.filter(o=>o.status==='aguardando').length}</span></div>
        <div class="stat-item"><span class="stat-label">Em Andamento:</span><span class="stat-value badge-info">${oss.filter(o=>o.status==='em_andamento').length}</span></div>
        <div class="stat-item"><span class="stat-label">Concluidas:</span><span class="stat-value badge-success">${oss.filter(o=>o.status==='concluida').length}</span></div>
    `;
}
