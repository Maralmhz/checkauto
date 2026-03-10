// GESTAO DE CLIENTES
let editingClienteId = null;

function renderClientes() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;
    
    const clientes = AppState.data.clientes || [];
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum cliente cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = clientes.map(cliente => {
        const veiculos = AppState.data.veiculos.filter(v => v.clienteId === cliente.id);
        return `
            <tr>
                <td><strong>${cliente.nome}</strong></td>
                <td>${cliente.cpf || '-'}</td>
                <td>${cliente.telefone || '-'}</td>
                <td><span class="badge badge-info">${veiculos.length} veiculo(s)</span></td>
                <td>
                    <button class="btn-icon" onclick="editCliente(${cliente.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCliente(${cliente.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openClienteModal(clienteId = null) {
    const modal = document.getElementById('clienteModal') || document.getElementById('modalCliente');
    const title = document.getElementById('clienteModalTitle') || document.getElementById('modalClienteTitle');
    const form = document.getElementById('clienteForm') || document.getElementById('formCliente');
    const cpfInput = document.getElementById('clienteCPF') || document.getElementById('clienteCpf');

    if (!modal || !title || !form || !cpfInput) return;
    
    if (clienteId) {
        editingClienteId = clienteId;
        const cliente = AppState.data.clientes.find(c => c.id === clienteId);
        if (cliente) {
            title.textContent = 'Editar Cliente';
            document.getElementById('clienteNome').value = cliente.nome || '';
            cpfInput.value = cliente.cpf || '';
            document.getElementById('clienteTelefone').value = cliente.telefone || '';
            document.getElementById('clienteEmail').value = cliente.email || '';
            document.getElementById('clienteEndereco').value = cliente.endereco || '';
        }
    } else {
        editingClienteId = null;
        title.textContent = 'Novo Cliente';
        form.reset();
    }

    modal.classList.add('active');
}

function closeClienteModal() {
    const modal = document.getElementById('clienteModal') || document.getElementById('modalCliente');
    const form = document.getElementById('clienteForm') || document.getElementById('formCliente');
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    editingClienteId = null;
}

function saveCliente(event) {
    if (event) event.preventDefault();
    const cpfInput = document.getElementById('clienteCPF') || document.getElementById('clienteCpf');
    
    const clienteData = {
        nome: document.getElementById('clienteNome').value,
        cpf: cpfInput ? cpfInput.value : '',
        telefone: document.getElementById('clienteTelefone').value,
        email: document.getElementById('clienteEmail').value,
        endereco: document.getElementById('clienteEndereco').value
    };
    
    if (editingClienteId) {
        const index = AppState.data.clientes.findIndex(c => c.id === editingClienteId);
        if (index !== -1) {
            AppState.data.clientes[index] = { ...AppState.data.clientes[index], ...clienteData };
            showToast('Cliente atualizado com sucesso!', 'success');
        }
    } else {
        const newCliente = {
            id: Date.now(),
            ...clienteData
        };
        AppState.data.clientes.push(newCliente);
        showToast('Cliente cadastrado com sucesso!', 'success');
    }
    
    saveToLocalStorage();
    renderClientes();
    closeClienteModal();
    updateDashboard();
}

function salvarCliente() {
    const form = document.getElementById('clienteForm');
    if (form && !form.reportValidity()) return;
    saveCliente();
}

function editCliente(id) {
    openClienteModal(id);
}

function deleteCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    const veiculos = AppState.data.veiculos.filter(v => v.clienteId === id);
    if (veiculos.length > 0) {
        if (!confirm(`Este cliente possui ${veiculos.length} veiculo(s) cadastrado(s). Deseja excluir mesmo assim?`)) {
            return;
        }
    }
    
    AppState.data.clientes = AppState.data.clientes.filter(c => c.id !== id);
    saveToLocalStorage();
    renderClientes();
    updateDashboard();
    showToast('Cliente excluido com sucesso!', 'success');
}

function filterClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    const rows = document.querySelectorAll('#clientesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}
