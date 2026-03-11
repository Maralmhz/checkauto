// ============================================
// GESTAO DE VEICULOS — Supabase
// ============================================
async function _getSupabaseV() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

let editingVeiculoId = null;

// ============================================
// RENDER
// ============================================
function renderVeiculos() {
    const tbody = document.getElementById('veiculosTableBody');
    if (!tbody) return;

    const veiculos = AppState.data.veiculos || [];

    if (veiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum veiculo cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = veiculos.map(veiculo => {
        const clienteId = veiculo.clienteId || veiculo.cliente_id;
        const cliente = AppState.data.clientes.find(c => c.id === clienteId);
        return `
            <tr>
                <td><strong>${veiculo.placa}</strong></td>
                <td>${veiculo.modelo}</td>
                <td>${cliente ? cliente.nome : 'N/A'}</td>
                <td>${veiculo.chassis || '-'}</td>
                <td>
                    <button class="btn-icon" onclick="editVeiculo('${veiculo.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteVeiculo('${veiculo.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MODAL
// ============================================
function openVeiculoModal(veiculoId = null) {
    const modal = document.getElementById('veiculoModal');
    const title = document.getElementById('veiculoModalTitle');
    const selectCliente = document.getElementById('veiculoCliente');

    if (!modal || !title || !selectCliente) {
        console.error('Elementos do modal de veiculo nao encontrados');
        return;
    }

    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>' +
        (AppState.data.clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    if (veiculoId) {
        editingVeiculoId = veiculoId;
        const veiculo = (AppState.data.veiculos || []).find(v => v.id === veiculoId);
        if (veiculo) {
            title.textContent = 'Editar Veiculo';
            document.getElementById('veiculoPlaca').value = veiculo.placa || '';
            document.getElementById('veiculoModelo').value = veiculo.modelo || '';
            document.getElementById('veiculoCliente').value = veiculo.clienteId || veiculo.cliente_id || '';
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

// ============================================
// SALVAR (INSERT / UPDATE)
// ============================================
async function saveVeiculo(event) {
    if (event) event.preventDefault();

    const veiculoData = {
        placa: document.getElementById('veiculoPlaca').value.toUpperCase(),
        modelo: document.getElementById('veiculoModelo').value,
        cliente_id: document.getElementById('veiculoCliente').value,
        chassis: document.getElementById('veiculoChassis').value,
        ano: document.getElementById('veiculoAno').value,
        cor: document.getElementById('veiculoCor').value
    };

    const sb = await _getSupabaseV();

    if (editingVeiculoId) {
        const { error } = await sb.from('veiculos').update(veiculoData).eq('id', editingVeiculoId);
        if (error) { showToast('Erro ao atualizar veiculo!', 'error'); console.error(error); return; }
        const idx = AppState.data.veiculos.findIndex(v => v.id === editingVeiculoId);
        if (idx !== -1) AppState.data.veiculos[idx] = { ...AppState.data.veiculos[idx], ...veiculoData, clienteId: veiculoData.cliente_id };
        showToast('Veiculo atualizado com sucesso!', 'success');
    } else {
        const { data, error } = await sb.from('veiculos').insert(veiculoData).select().single();
        if (error) { showToast('Erro ao cadastrar veiculo!', 'error'); console.error(error); return; }
        AppState.data.veiculos.push({ ...data, clienteId: data.cliente_id });
        showToast('Veiculo cadastrado com sucesso!', 'success');
    }

    renderVeiculos();
    closeVeiculoModal();
    updateDashboard();
}

function salvarVeiculo() {
    const form = document.getElementById('veiculoForm');
    if (form && !form.reportValidity()) return;
    saveVeiculo();
}

function editVeiculo(id) {
    openVeiculoModal(id);
}

// ============================================
// EXCLUIR
// ============================================
async function deleteVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir este veiculo?')) return;

    const sb = await _getSupabaseV();
    const { error } = await sb.from('veiculos').delete().eq('id', id);
    if (error) { showToast('Erro ao excluir veiculo!', 'error'); console.error(error); return; }

    AppState.data.veiculos = AppState.data.veiculos.filter(v => v.id !== id);
    renderVeiculos();
    updateDashboard();
    showToast('Veiculo excluido com sucesso!', 'success');
}

// ============================================
// FILTRO
// ============================================
function filterVeiculos() {
    const searchTerm = document.getElementById('searchVeiculos').value.toLowerCase();
    const rows = document.querySelectorAll('#veiculosTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}
