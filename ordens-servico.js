// GESTAO DE ORDENS DE SERVICO
let editingOSId = null;
let servicosOS = [];

function renderOrdensServico() {
    const tbody = document.getElementById('ordensServicoTableBody');
    if (!tbody) return;
    
    const ordensServico = AppState.data.ordensServico || [];
    const filteredOS = filterOS(ordensServico);
    
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
            <td><strong>${formatMoney(os.valorTotal)}</strong></td>
            <td>
                <button class="btn-icon" onclick="viewOS('${os.id}')" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editOS('${os.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${getStatusActions(os)}
            </td>
        </tr>
    `).join('');
    
    updateOSStats();
}

function getStatusActions(os) {
    if (os.status === 'aguardando') {
        return `<button class="btn-icon btn-success" onclick="changeOSStatus('${os.id}', 'em_andamento')" title="Iniciar">
                    <i class="fas fa-play"></i>
                </button>`;
    } else if (os.status === 'em_andamento') {
        return `<button class="btn-icon btn-success" onclick="changeOSStatus('${os.id}', 'concluida')" title="Concluir">
                    <i class="fas fa-check"></i>
                </button>`;
    } else if (os.status === 'concluida') {
        return `<button class="btn-icon btn-danger" onclick="deleteOS('${os.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>`;
    }
    return '';
}

function filterOS(ordensServico) {
    const statusFilter = document.getElementById('filterStatus')?.value || 'todos';
    const searchTerm = document.getElementById('searchOS')?.value.toLowerCase() || '';
    
    return ordensServico.filter(os => {
        const matchStatus = statusFilter === 'todos' || os.status === statusFilter;
        const matchSearch = !searchTerm || 
            os.numero.toLowerCase().includes(searchTerm) ||
            os.cliente.toLowerCase().includes(searchTerm) ||
            os.veiculo.toLowerCase().includes(searchTerm);
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
            document.getElementById('osCliente').value = os.clienteId || '';
            updateVeiculoSelect(os.clienteId, os.veiculoId);
            document.getElementById('osData').value = os.data || '';
            document.getElementById('osDescricao').value = os.descricao || '';
            document.getElementById('osObservacoes').value = os.observacoes || '';
            servicosOS = os.servicos || [];
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
    (document.getElementById('osForm') || document.getElementById('formOS')).reset();
    editingOSId = null;
    servicosOS = [];
}

function populateClienteSelect() {
    const select = document.getElementById('osCliente');
    select.innerHTML = '<option value="">Selecione um cliente</option>' +
        AppState.data.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function updateVeiculoSelect(clienteId, selectedVeiculoId = null) {
    const select = document.getElementById('osVeiculo');
    const veiculos = AppState.data.veiculos.filter(v => v.clienteId == clienteId);
    
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
    
    if (!descricao || valor <= 0) {
        showToast('Preencha descricao e valor do servico', 'info');
        return;
    }
    
    servicosOS.push({
        id: Date.now(),
        descricao: descricao,
        valor: valor
    });
    
    document.getElementById('servicoDescricao').value = '';
    document.getElementById('servicoValor').value = '';
    document.getElementById('servicoDescricao').focus();
    
    renderServicosOS();
}

function removeServicoOS(id) {
    servicosOS = servicosOS.filter(s => s.id !== id);
    renderServicosOS();
}

function renderServicosOS() {
    const tbody = document.getElementById('osServicosTable');
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
            <td>
                <button class="btn-icon btn-danger" onclick="removeServicoOS(${s.id})" title="Remover">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('osTotal').textContent = formatMoney(total);
}

function saveOS(event) {
    if (event) event.preventDefault();
    
    const clienteId = parseInt(document.getElementById('osCliente').value);
    const veiculoId = parseInt(document.getElementById('osVeiculo').value);
    
    if (!clienteId || !veiculoId) {
        showToast('Selecione cliente e veiculo', 'info');
        return;
    }
    
    if (servicosOS.length === 0) {
        showToast('Adicione pelo menos um servico', 'info');
        return;
    }
    
    const cliente = AppState.data.clientes.find(c => c.id === clienteId);
    const veiculo = AppState.data.veiculos.find(v => v.id === veiculoId);
    const total = servicosOS.reduce((sum, s) => sum + s.valor, 0);
    
    const osData = {
        clienteId: clienteId,
        cliente: cliente.nome,
        veiculoId: veiculoId,
        veiculo: `${veiculo.modelo} - ${veiculo.placa}`,
        data: document.getElementById('osData').value,
        descricao: document.getElementById('osDescricao').value,
        observacoes: document.getElementById('osObservacoes').value,
        servicos: servicosOS,
        valorTotal: total
    };
    
    if (editingOSId) {
        const index = AppState.data.ordensServico.findIndex(o => o.id === editingOSId);
        if (index !== -1) {
            AppState.data.ordensServico[index] = { ...AppState.data.ordensServico[index], ...osData };
            showToast('OS atualizada com sucesso!', 'success');
        }
    } else {
        const nextNumero = (AppState.data.ordensServico.length + 1).toString().padStart(6, '0');
        const newOS = {
            id: `OS-${Date.now()}`,
            numero: nextNumero,
            status: 'aguardando',
            ...osData
        };
        AppState.data.ordensServico.push(newOS);
        showToast('OS criada com sucesso!', 'success');
    }
    
    saveToLocalStorage();
    renderOrdensServico();
    closeOSModal();
    updateDashboard();
}

function changeOSStatus(osId, newStatus) {
    const os = AppState.data.ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const statusMessages = {
        'em_andamento': 'Iniciar esta OS?',
        'concluida': 'Concluir esta OS?',
        'cancelada': 'Cancelar esta OS?'
    };
    
    if (confirm(statusMessages[newStatus])) {
        os.status = newStatus;
        if (newStatus === 'concluida') {
            os.dataConclusao = new Date().toISOString().split('T')[0];
            if (typeof syncContasReceberFromOS === 'function') syncContasReceberFromOS();
            if (typeof renderContasReceber === 'function') renderContasReceber();
        }
        saveToLocalStorage();
        renderOrdensServico();
        updateDashboard();
        showToast('Status atualizado!', 'success');
    }
}

function deleteOS(osId) {
    if (!confirm('Tem certeza que deseja excluir esta OS?')) return;
    
    AppState.data.ordensServico = AppState.data.ordensServico.filter(o => o.id !== osId);
    saveToLocalStorage();
    renderOrdensServico();
    updateDashboard();
    showToast('OS excluida com sucesso!', 'success');
}

function editOS(osId) {
    openOSModal(osId);
}

function viewOS(osId) {
    const os = AppState.data.ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const modal = document.getElementById('modalViewOS') || document.getElementById('viewOSModal');
    const content = document.getElementById('viewOSContent');
    
    content.innerHTML = `
        <div class="os-view-section">
            <h4>Informacoes Gerais</h4>
            <p><strong>Numero OS:</strong> ${os.numero}</p>
            <p><strong>Cliente:</strong> ${os.cliente}</p>
            <p><strong>Veiculo:</strong> ${os.veiculo}</p>
            <p><strong>Data:</strong> ${formatDate(os.data)}</p>
            <p><strong>Status:</strong> ${getStatusBadge(os.status)}</p>
            ${os.dataConclusao ? `<p><strong>Concluida em:</strong> ${formatDate(os.dataConclusao)}</p>` : ''}
        </div>
        
        <div class="os-view-section">
            <h4>Servicos</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Descricao</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${os.servicos?.map(s => `
                        <tr>
                            <td>${s.descricao}</td>
                            <td>${formatMoney(s.valor)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="2">Nenhum servico</td></tr>'}
                </tbody>
            </table>
            <p class="os-total"><strong>Total: ${formatMoney(os.valorTotal)}</strong></p>
        </div>
        
        ${os.descricao ? `
        <div class="os-view-section">
            <h4>Descricao</h4>
            <p>${os.descricao}</p>
        </div>
        ` : ''}
        
        ${os.observacoes ? `
        <div class="os-view-section">
            <h4>Observacoes</h4>
            <p>${os.observacoes}</p>
        </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
}

function closeViewOSModal() {
    const modal = document.getElementById('modalViewOS') || document.getElementById('viewOSModal');
    if (modal) modal.classList.remove('active');
}

function updateOSStats() {
    const total = AppState.data.ordensServico.length;
    const aguardando = AppState.data.ordensServico.filter(os => os.status === 'aguardando').length;
    const emAndamento = AppState.data.ordensServico.filter(os => os.status === 'em_andamento').length;
    const concluidas = AppState.data.ordensServico.filter(os => os.status === 'concluida').length;
    
    const statsEl = document.getElementById('osStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total:</span>
                <span class="stat-value">${total}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Aguardando:</span>
                <span class="stat-value badge-warning">${aguardando}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Em Andamento:</span>
                <span class="stat-value badge-info">${emAndamento}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Concluidas:</span>
                <span class="stat-value badge-success">${concluidas}</span>
            </div>
        `;
    }
}

function salvarOS() {
    const form = document.getElementById('osForm');
    if (form && !form.reportValidity()) return;
    saveOS();
}
