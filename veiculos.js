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

function _getOficinaIdV() {
    return window.AppState?.user?.oficina_id || null;
}

let editingVeiculoId = null;


function _isSuperadminV() {
    return window.AppState?.user?.role === 'superadmin';
}

function _scopeVeiculoQuery(query) {
    if (_isSuperadminV()) return query;
    const oficinaId = _getOficinaIdV();
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}


// ============================================
// RENDER
// ============================================
function renderVeiculos() {
    const tbody = document.getElementById('veiculosTableBody');
    if (!tbody) return;

    const veiculos  = AppState.data.veiculos  || [];
    const clientes  = AppState.data.clientes  || [];

    if (veiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum veiculo cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = veiculos.map(v => {
        const cliente = clientes.find(c => c.id === (v.clienteId || v.cliente_id));
        return `
            <tr>
                <td><strong>${v.marca} ${v.modelo}</strong></td>
                <td>${v.placa || '-'}</td>
                <td>${v.ano   || '-'}</td>
                <td>${v.cor   || '-'}</td>
                <td>${cliente ? cliente.nome : '-'}</td>
                <td>
                    <button class="btn-icon" onclick="editVeiculo('${v.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteVeiculo('${v.id}')" title="Excluir">
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
    const modal = document.getElementById('veiculoModal') || document.getElementById('modalVeiculo');
    const title = document.getElementById('veiculoModalTitle') || document.getElementById('modalVeiculoTitle');
    const form  = document.getElementById('veiculoForm')  || document.getElementById('formVeiculo');
    if (!modal || !title || !form) return;

    populateClienteSelect();

    if (veiculoId) {
        editingVeiculoId = veiculoId;
        const v = AppState.data.veiculos.find(x => x.id === veiculoId);
        if (v) {
            title.textContent = 'Editar Veiculo';
            document.getElementById('veiculoMarca').value    = v.marca    || '';
            document.getElementById('veiculoModelo').value   = v.modelo   || '';
            document.getElementById('veiculoPlaca').value    = v.placa    || '';
            document.getElementById('veiculoAno').value      = v.ano      || '';
            document.getElementById('veiculoCor').value      = v.cor      || '';
            document.getElementById('veiculoCliente').value  = v.clienteId || v.cliente_id || '';
        }
    } else {
        editingVeiculoId = null;
        title.textContent = 'Novo Veiculo';
        form.reset();
    }
    modal.classList.add('active');
}

function closeVeiculoModal() {
    const modal = document.getElementById('veiculoModal') || document.getElementById('modalVeiculo');
    const form  = document.getElementById('veiculoForm')  || document.getElementById('formVeiculo');
    if (modal) modal.classList.remove('active');
    if (form)  form.reset();
    editingVeiculoId = null;
}

function populateClienteSelect() {
    const sel = document.getElementById('veiculoCliente');
    if (!sel) return;
    const clientes = AppState.data.clientes || [];
    sel.innerHTML = '<option value="">Selecione um cliente</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ============================================
// SALVAR
// ============================================
async function saveVeiculo(event) {
    if (event) event.preventDefault();

    const veiculoData = {
        marca:      document.getElementById('veiculoMarca').value,
        modelo:     document.getElementById('veiculoModelo').value,
        placa:      document.getElementById('veiculoPlaca').value,
        ano:        document.getElementById('veiculoAno').value,
        cor:        document.getElementById('veiculoCor').value,
        cliente_id: document.getElementById('veiculoCliente').value
    };

    const sb = await _getSupabaseV();

    if (editingVeiculoId) {
        const { error } = await _scopeVeiculoQuery(sb.from('veiculos').update(veiculoData)).eq('id', editingVeiculoId);
        if (error) { showToast('Erro ao atualizar veiculo!', 'error'); console.error(error); return; }
        const idx = AppState.data.veiculos.findIndex(v => v.id === editingVeiculoId);
        if (idx !== -1) AppState.data.veiculos[idx] = { ...AppState.data.veiculos[idx], ...veiculoData, clienteId: veiculoData.cliente_id };
        showToast('Veiculo atualizado com sucesso!', 'success');
    } else {
        const oficina_id = _getOficinaIdV();
        const { data, error } = await sb.from('veiculos').insert({ ...veiculoData, oficina_id }).select().single();
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

function editVeiculo(id) { openVeiculoModal(id); }

// ============================================
// EXCLUIR
// ============================================
async function deleteVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir este veiculo?')) return;
    const sb = await _getSupabaseV();
    const { error } = await _scopeVeiculoQuery(sb.from('veiculos').delete()).eq('id', id);
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
        row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
}
