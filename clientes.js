// ============================================
// GESTAO DE CLIENTES — Supabase
// ============================================
async function _getSupabase() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

function _getOficinaId() {
    return window.AppState?.user?.oficina_id || null;
}

let editingClienteId = null;


function _isSuperadminCliente() {
    return window.AppState?.user?.role === 'superadmin';
}

function _scopeClienteQuery(query) {
    if (_isSuperadminCliente()) return query;
    const oficinaId = _getOficinaId();
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}


// ============================================
// RENDER
// ============================================
function renderClientes() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    const clientes = AppState.data.clientes || [];

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum cliente cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(cliente => {
        const veiculos = (AppState.data.veiculos || []).filter(v => v.clienteId === cliente.id || v.cliente_id === cliente.id);
        return `
            <tr>
                <td><strong>${cliente.nome}</strong></td>
                <td>${cliente.cpf || '-'}</td>
                <td>${cliente.telefone || '-'}</td>
                <td><span class="badge badge-info">${veiculos.length} veiculo(s)</span></td>
                <td>
                    <button class="btn-icon" onclick="editCliente('${cliente.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCliente('${cliente.id}')" title="Excluir">
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
function openClienteModal(clienteId = null) {
    const modal = document.getElementById('clienteModal') || document.getElementById('modalCliente');
    const title = document.getElementById('clienteModalTitle') || document.getElementById('modalClienteTitle');
    const form  = document.getElementById('clienteForm')  || document.getElementById('formCliente');
    const cpfInput = document.getElementById('clienteCPF') || document.getElementById('clienteCpf');

    if (!modal || !title || !form || !cpfInput) return;

    if (clienteId) {
        editingClienteId = clienteId;
        const cliente = AppState.data.clientes.find(c => c.id === clienteId);
        if (cliente) {
            title.textContent = 'Editar Cliente';
            document.getElementById('clienteNome').value     = cliente.nome     || '';
            cpfInput.value                                    = cliente.cpf      || '';
            document.getElementById('clienteTelefone').value = cliente.telefone || '';
            document.getElementById('clienteEmail').value    = cliente.email    || '';
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
    const form  = document.getElementById('clienteForm')  || document.getElementById('formCliente');
    if (modal) modal.classList.remove('active');
    if (form)  form.reset();
    editingClienteId = null;
}

// ============================================
// SALVAR (INSERT / UPDATE)
// ============================================
async function saveCliente(event) {
    if (event) event.preventDefault();
    const cpfInput = document.getElementById('clienteCPF') || document.getElementById('clienteCpf');

    const clienteData = {
        nome:      document.getElementById('clienteNome').value,
        cpf:       cpfInput ? cpfInput.value : '',
        telefone:  document.getElementById('clienteTelefone').value,
        email:     document.getElementById('clienteEmail').value,
        endereco:  document.getElementById('clienteEndereco').value
    };

    const sb = await _getSupabase();

    if (editingClienteId) {
        const { error } = await _scopeClienteQuery(sb.from('clientes').update(clienteData)).eq('id', editingClienteId);
        if (error) { showToast('Erro ao atualizar cliente!', 'error'); console.error(error); return; }
        const idx = AppState.data.clientes.findIndex(c => c.id === editingClienteId);
        if (idx !== -1) AppState.data.clientes[idx] = { ...AppState.data.clientes[idx], ...clienteData };
        showToast('Cliente atualizado com sucesso!', 'success');
    } else {
        const oficina_id = _getOficinaId();
        const { data, error } = await sb.from('clientes').insert({ ...clienteData, oficina_id }).select().single();
        if (error) { showToast('Erro ao cadastrar cliente!', 'error'); console.error(error); return; }
        AppState.data.clientes.push(data);
        showToast('Cliente cadastrado com sucesso!', 'success');
    }

    renderClientes();
    closeClienteModal();
    updateDashboard();
}

function salvarCliente() {
    const form = document.getElementById('clienteForm');
    if (form && !form.reportValidity()) return;
    saveCliente();
}

function editCliente(id) { openClienteModal(id); }

// ============================================
// EXCLUIR
// ============================================
async function deleteCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const veiculos = (AppState.data.veiculos || []).filter(v => v.clienteId === id || v.cliente_id === id);
    if (veiculos.length > 0) {
        if (!confirm(`Este cliente possui ${veiculos.length} veiculo(s) cadastrado(s). Deseja excluir mesmo assim?`)) return;
    }

    const sb = await _getSupabase();
    const { error } = await _scopeClienteQuery(sb.from('clientes').delete()).eq('id', id);
    if (error) { showToast('Erro ao excluir cliente!', 'error'); console.error(error); return; }

    AppState.data.clientes = AppState.data.clientes.filter(c => c.id !== id);
    renderClientes();
    updateDashboard();
    showToast('Cliente excluido com sucesso!', 'success');
}

// ============================================
// FILTRO
// ============================================
function filterClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    const rows = document.querySelectorAll('#clientesTableBody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
}
