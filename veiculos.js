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

function _escVEI(s = '') {
    return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function _veiculoField(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

function _setFieldValue(el, value = '') {
    if (!el) return;
    el.value = value;
}

function _getClienteField() {
    return _veiculoField('veiculoCliente', 'clienteVeiculo', 'veiculoClienteBusca');
}


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
                <td><strong>${_escVEI(v.marca)} ${_escVEI(v.modelo)}</strong></td>
                <td>${_escVEI(v.placa || '-')}</td>
                <td>${_escVEI(v.ano   || '-')}</td>
                <td>${_escVEI(v.cor   || '-')}</td>
                <td>${_escVEI(cliente ? cliente.nome : '-')}</td>
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
            _setFieldValue(_veiculoField('veiculoMarca', 'marcaVeiculo'), v.marca || '');
            _setFieldValue(_veiculoField('veiculoModelo', 'modeloVeiculo'), v.modelo || '');
            _setFieldValue(_veiculoField('veiculoPlaca', 'placaVeiculo'), v.placa || '');
            _setFieldValue(_veiculoField('veiculoAno', 'anoVeiculo'), v.ano || '');
            _setFieldValue(_veiculoField('veiculoCor', 'corVeiculo'), v.cor || '');
            _setFieldValue(_getClienteField(), v.clienteId || v.cliente_id || '');
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
    const sel = _getClienteField();
    if (!sel) return;
    const clientes = AppState.data.clientes || [];
    const isSelect = sel.tagName === 'SELECT';
    if (isSelect) {
        sel.innerHTML = '<option value="">Selecione um cliente</option>' +
            clientes.map(c => `<option value="${c.id}">${_escVEI(c.nome)}</option>`).join('');
        return;
    }
    const listId = 'veiculoClienteDatalist';
    let datalist = document.getElementById(listId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        sel.insertAdjacentElement('afterend', datalist);
    }
    datalist.innerHTML = clientes.map(c => `<option value="${_escVEI(c.nome)}" data-id="${c.id}"></option>`).join('');
    sel.setAttribute('list', listId);
}

// ============================================
// SALVAR
// ============================================
async function saveVeiculo(event) {
    if (event) event.preventDefault();

    const clienteField = _getClienteField();
    const clienteRawValue = clienteField?.value || '';
    const clienteByName = (AppState.data.clientes || []).find(c => c.nome === clienteRawValue);

    const veiculoData = {
        marca:      _veiculoField('veiculoMarca', 'marcaVeiculo')?.value || '',
        modelo:     _veiculoField('veiculoModelo', 'modeloVeiculo')?.value || '',
        placa:      _veiculoField('veiculoPlaca', 'placaVeiculo')?.value || '',
        ano:        _veiculoField('veiculoAno', 'anoVeiculo')?.value || '',
        cor:        _veiculoField('veiculoCor', 'corVeiculo')?.value || '',
        cliente_id: clienteByName?.id || clienteRawValue
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
    if (error) {
        if (error.code === '23503' || /checklists_veiculo_id_fkey/i.test(error.message || '')) {
            showToast('Não é possível excluir: este veículo possui checklists vinculados. Arquive/desvincule antes de excluir.', 'info');
            return;
        }
        showToast('Erro ao excluir veiculo!', 'error');
        console.error(error);
        return;
    }
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
