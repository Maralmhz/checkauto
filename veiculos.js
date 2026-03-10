// GESTAO DE VEICULOS
let editingVeiculoId = null;

function renderVeiculos() {
    const tbody = document.getElementById('veiculosTableBody');
    if (!tbody) return;
    
    const veiculos = AppState.data.veiculos || [];
    
    if (veiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum veiculo cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = veiculos.map(veiculo => {
        const cliente = AppState.data.clientes.find(c => c.id === veiculo.clienteId);
        return `
            <tr>
                <td><strong>${veiculo.placa}</strong></td>
                <td>${veiculo.modelo}</td>
                <td>${cliente ? cliente.nome : 'N/A'}</td>
                <td>${veiculo.chassis || '-'}</td>
                <td>
                    <button class="btn-icon" onclick="editVeiculo(${veiculo.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteVeiculo(${veiculo.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openVeiculoModal(veiculoId = null) {
    const modal = document.getElementById('veiculoModal');
    const title = document.getElementById('veiculoModalTitle');
    const selectCliente = document.getElementById('veiculoCliente');
    
    if (!modal || !title || !selectCliente) {
        console.error('Elementos do modal de veículo não encontrados');
        return;
    }

    // Preencher select de clientes
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>' + 
        (AppState.data.clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    
    if (veiculoId) {
        editingVeiculoId = veiculoId;
        const veiculo = (AppState.data.veiculos || []).find(v => v.id === veiculoId);
        if (veiculo) {
            title.textContent = 'Editar Veiculo';
            document.getElementById('veiculoPlaca').value = veiculo.placa || '';
            document.getElementById('veiculoModelo').value = veiculo.modelo || '';
            document.getElementById('veiculoCliente').value = veiculo.clienteId || '';
            document.getElementById('veiculoChassis').value = veiculo.chassis || '';
            document.getElementById('veiculoAno').value = veiculo.ano || '';
            document.getElementById('veiculoCor').value = veiculo.cor || '';
        }
    } else {
        editingVeiculoId = null;
        title.textContent = 'Novo Veiculo';
        document.getElementById('veiculoPlaca').value = '';
        document.getElementById('veiculoModelo').value = '';
        document.getElementById('veiculoCliente').value = '';
        document.getElementById('veiculoChassis').value = '';
        document.getElementById('veiculoAno').value = '';
        document.getElementById('veiculoCor').value = '';
    }
    
    modal.classList.add('active');
}

function closeVeiculoModal() {
    const modal = document.getElementById('veiculoModal');
    if (modal) modal.classList.remove('active');
    editingVeiculoId = null;
}


function saveVeiculo(event) {
    if (event) event.preventDefault();
    
    const veiculoData = {
        placa: document.getElementById('veiculoPlaca').value.toUpperCase(),
        modelo: document.getElementById('veiculoModelo').value,
        clienteId: parseInt(document.getElementById('veiculoCliente').value),
        chassis: document.getElementById('veiculoChassis').value,
        ano: document.getElementById('veiculoAno').value,
        cor: document.getElementById('veiculoCor').value
    };
    
    if (editingVeiculoId) {
        const index = AppState.data.veiculos.findIndex(v => v.id === editingVeiculoId);
        if (index !== -1) {
            AppState.data.veiculos[index] = { ...AppState.data.veiculos[index], ...veiculoData };
            showToast('Veiculo atualizado com sucesso!', 'success');
        }
    } else {
        const newVeiculo = {
            id: Date.now(),
            ...veiculoData
        };
        AppState.data.veiculos.push(newVeiculo);
        showToast('Veiculo cadastrado com sucesso!', 'success');
    }
    
    saveToLocalStorage();
    renderVeiculos();
    closeVeiculoModal();
    updateDashboard();
}

function editVeiculo(id) {
    openVeiculoModal(id);
}

function deleteVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir este veiculo?')) return;
    
    AppState.data.veiculos = AppState.data.veiculos.filter(v => v.id !== id);
    saveToLocalStorage();
    renderVeiculos();
    updateDashboard();
    showToast('Veiculo excluido com sucesso!', 'success');
}

function filterVeiculos() {
    const searchTerm = document.getElementById('searchVeiculos').value.toLowerCase();
    const rows = document.querySelectorAll('#veiculosTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}


function salvarVeiculo() {
    const form = document.getElementById('veiculoForm');
    if (form && !form.reportValidity()) return;
    saveVeiculo();
}
