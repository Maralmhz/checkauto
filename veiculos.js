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
let showArchivedVeiculos = false;

function _escVEI(s = '') {
    return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function _veiculoField(...ids) {
    const modal = _getVeiculoModal();
    for (const id of ids) {
        if (modal) {
            const scoped = modal.querySelector(`#${id}`);
            if (scoped) return scoped;
        }
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

function _setFieldValue(el, value = '') {
    if (!el) return;
    el.value = value;
}

function _getClienteIdField(modal = _getVeiculoModal()) {
    return modal?.querySelector('#veiculoCliente, #clienteVeiculo') || document.getElementById('veiculoCliente') || document.getElementById('clienteVeiculo');
}

function _getClienteBuscaField(modal = _getVeiculoModal()) {
    return modal?.querySelector('#veiculoClienteBusca') || document.getElementById('veiculoClienteBusca');
}

function _clienteDisplay(c) {
    const tel = (c.telefone || '').trim();
    return tel ? `${c.nome} • ${tel}` : c.nome;
}

function _getVeiculoModal() {
    const candidates = [
        document.getElementById('veiculoModal'),
        document.getElementById('modalVeiculo')
    ].filter(Boolean);
    return candidates.find(el => el.classList.contains('active')) || candidates[0] || null;
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

function _missingVeiculoColumn(error) {
    const msg = error?.message || '';
    if (error?.code !== 'PGRST204') return null;
    const match = msg.match(/Could not find the '([^']+)' column/i);
    return match ? match[1] : null;
}

async function _insertVeiculoCompat(sb, payload) {
    const dataToSend = { ...payload };
    for (let i = 0; i < 3; i += 1) {
        const { data, error } = await sb.from('veiculos').insert(dataToSend).select().single();
        if (!error) return { data, error: null };
        const missingCol = _missingVeiculoColumn(error);
        if (!missingCol || !(missingCol in dataToSend)) return { data: null, error };
        delete dataToSend[missingCol];
    }
    return { data: null, error: { message: 'Não foi possível salvar veículo por incompatibilidade de colunas.' } };
}

async function _updateVeiculoCompat(sb, id, payload) {
    const dataToSend = { ...payload };
    for (let i = 0; i < 3; i += 1) {
        const { error } = await _scopeVeiculoQuery(sb.from('veiculos').update(dataToSend)).eq('id', id);
        if (!error) return { error: null };
        const missingCol = _missingVeiculoColumn(error);
        if (!missingCol || !(missingCol in dataToSend)) return { error };
        delete dataToSend[missingCol];
    }
    return { error: { message: 'Não foi possível atualizar veículo por incompatibilidade de colunas.' } };
}


// ============================================
// RENDER
// ============================================
function renderVeiculos() {
    const tbody = document.getElementById('veiculosTableBody');
    if (!tbody) return;

    const veiculos  = AppState.data.veiculos  || [];
    const clientes  = AppState.data.clientes  || [];
    const btnToggleArquivados = document.getElementById('btnToggleVeiculosArquivados');

    if (btnToggleArquivados) {
        btnToggleArquivados.innerHTML = showArchivedVeiculos
            ? '<i class="fas fa-list"></i> Mostrar Ativos'
            : '<i class="fas fa-archive"></i> Mostrar Arquivados';
    }

    const veiculosFiltrados = veiculos.filter(v => {
        const arquivado = v.ativo === false;
        return showArchivedVeiculos ? arquivado : !arquivado;
    });

    if (veiculosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum veiculo cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = veiculosFiltrados.map(v => {
        const cliente = clientes.find(c => c.id === (v.clienteId || v.cliente_id));
        const acoes = showArchivedVeiculos
            ? `
                <button class="btn-icon" onclick="restaurarVeiculo('${v.id}')" title="Restaurar">
                    <i class="fas fa-undo"></i>
                </button>
              `
            : `
                <button class="btn-icon" onclick="editVeiculo('${v.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteVeiculo('${v.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
              `;
        return `
            <tr>
                <td><strong>${_escVEI(v.marca)} ${_escVEI(v.modelo)}</strong></td>
                <td>${_escVEI(v.placa || '-')}</td>
                <td>${_escVEI(v.ano   || '-')}</td>
                <td>${_escVEI(v.cor   || '-')}</td>
                <td>${_escVEI(cliente ? cliente.nome : '-')}</td>
                <td>${acoes}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MODAL
// ============================================
function openVeiculoModal(veiculoId = null) {
    const modal = _getVeiculoModal() || document.getElementById('veiculoModal') || document.getElementById('modalVeiculo');
    const title = document.getElementById('veiculoModalTitle') || document.getElementById('modalVeiculoTitle');
    const form  = document.getElementById('veiculoForm')  || document.getElementById('formVeiculo');
    if (!modal || !title || !form) return;

    if (veiculoId) {
        editingVeiculoId = veiculoId;
        populateClienteSelect();
        const v = AppState.data.veiculos.find(x => x.id === veiculoId);
        if (v) {
            title.textContent = 'Editar Veiculo';
            _setFieldValue(_veiculoField('veiculoMarca', 'marcaVeiculo'), v.marca || '');
            _setFieldValue(_veiculoField('veiculoModelo', 'modeloVeiculo'), v.modelo || '');
            _setFieldValue(_veiculoField('veiculoPlaca', 'placaVeiculo'), v.placa || '');
            _setFieldValue(_veiculoField('veiculoAno', 'anoVeiculo'), v.ano || '');
            _setFieldValue(_veiculoField('veiculoCor', 'corVeiculo'), v.cor || '');
            const clienteId = v.clienteId || v.cliente_id || '';
            const clienteIdField = _getClienteIdField(modal);
            const clienteBuscaField = _getClienteBuscaField(modal);
            _setFieldValue(clienteIdField, clienteId);
            if (clienteBuscaField) {
                const cliente = (AppState.data.clientes || []).find(c => c.id === clienteId);
                clienteBuscaField.value = cliente ? _clienteDisplay(cliente) : '';
            }
        }
    } else {
        editingVeiculoId = null;
        title.textContent = 'Novo Veiculo';
        form.reset();
        populateClienteSelect();
        const clientePreselecionadoId = window.__veiculoClientePreSelecionadoId;
        if (clientePreselecionadoId) {
            const clienteIdField = _getClienteIdField(modal);
            const clienteBuscaField = _getClienteBuscaField(modal);
            if (clienteIdField) clienteIdField.value = clientePreselecionadoId;
            const cliente = (AppState.data.clientes || []).find(c => c.id === clientePreselecionadoId);
            if (clienteBuscaField && cliente) clienteBuscaField.value = _clienteDisplay(cliente);
            window.__veiculoClientePreSelecionadoId = null;
        }
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
    const modal = _getVeiculoModal();
    const campoId = _getClienteIdField(modal);
    const campoBusca = _getClienteBuscaField(modal);
    if (!campoId && !campoBusca) return;
    const clientes = AppState.data.clientes || [];
    const lookup = new Map();
    clientes.forEach((c) => lookup.set(_clienteDisplay(c), c.id));
    window.__veiculoClienteLookup = lookup;

    if (campoBusca) {
        let datalist = modal?.querySelector('#veiculoClienteDatalist') || document.getElementById('veiculoClienteDatalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'veiculoClienteDatalist';
            campoBusca.insertAdjacentElement('afterend', datalist);
        }
        datalist.innerHTML = clientes.map(c => `<option value="${_escVEI(_clienteDisplay(c))}"></option>`).join('');
        campoBusca.setAttribute('list', datalist.id);

        if (!campoBusca.dataset.boundClienteLookup) {
            campoBusca.addEventListener('input', () => {
                if (!campoId) return;
                campoId.value = lookup.get(campoBusca.value) || '';
            });
            campoBusca.addEventListener('change', () => {
                if (!campoId) return;
                campoId.value = lookup.get(campoBusca.value) || '';
            });
            campoBusca.dataset.boundClienteLookup = '1';
        }
    }
}

function openVeiculoClientePreCadastro(event) {
    if (event) event.preventDefault();
    const modalVeiculo = document.getElementById('veiculoModal') || document.getElementById('modalVeiculo');
    if (modalVeiculo) modalVeiculo.classList.remove('active');
    if (typeof openClienteModal === 'function') {
        window.__returnToVeiculoAfterCliente = true;
        openClienteModal();
        showToast('Após salvar o cliente, volte para Veículos e selecione-o no cadastro.', 'info');
        return;
    }
    showToast('Não foi possível abrir o cadastro de cliente.', 'error');
}

function openClientePickerModal() {
    const modal = document.getElementById('clientePickerModal');
    if (!modal) return;
    const search = document.getElementById('clientePickerSearch');
    if (search) search.value = '';
    renderClientePickerList();
    modal.classList.add('active');
}

function closeClientePickerModal() {
    const modal = document.getElementById('clientePickerModal');
    if (modal) modal.classList.remove('active');
}

function renderClientePickerList() {
    const tbody = document.getElementById('clientePickerTableBody');
    if (!tbody) return;
    const term = (document.getElementById('clientePickerSearch')?.value || '').trim().toLowerCase();
    const clientes = (AppState.data.clientes || []).filter(c => {
        if (!term) return true;
        return (c.nome || '').toLowerCase().includes(term) || (c.telefone || '').toLowerCase().includes(term);
    });
    if (!clientes.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum cliente encontrado</td></tr>';
        return;
    }
    tbody.innerHTML = clientes.map(c => `
        <tr>
            <td>${_escVEI(c.nome || '-')}</td>
            <td>${_escVEI(c.telefone || '-')}</td>
            <td><button class="btn btn-primary" type="button" onclick="selectClienteFromPicker('${c.id}')">Selecionar</button></td>
        </tr>
    `).join('');
}

function selectClienteFromPicker(clienteId) {
    const modal = _getVeiculoModal();
    const clienteIdField = _getClienteIdField(modal);
    const clienteBuscaField = _getClienteBuscaField(modal);
    const cliente = (AppState.data.clientes || []).find(c => c.id === clienteId);
    if (clienteIdField) clienteIdField.value = clienteId;
    if (clienteBuscaField && cliente) clienteBuscaField.value = _clienteDisplay(cliente);
    closeClientePickerModal();
}

// ============================================
// SALVAR
// ============================================
async function saveVeiculo(event) {
    if (event) event.preventDefault();

    const modal = _getVeiculoModal();
    const clienteIdField = _getClienteIdField(modal);
    const clienteBuscaField = _getClienteBuscaField(modal);
    const clienteRawValue = (clienteBuscaField?.value || clienteIdField?.value || '').trim();
    const clienteLookupId = window.__veiculoClienteLookup?.get(clienteRawValue) || '';
    const clienteByName = (AppState.data.clientes || []).find(c => (c.nome || '').toLowerCase() === clienteRawValue.toLowerCase());
    const idEmCampoOculto = (clienteIdField?.value || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idEmCampoOculto || clienteRawValue);
    const clienteIdResolvido = idEmCampoOculto || clienteLookupId || clienteByName?.id || (isUuid ? (idEmCampoOculto || clienteRawValue) : '');

    if (!clienteIdResolvido) {
        showToast('Selecione um cliente válido para vincular ao veículo.', 'error');
        if (clienteBuscaField) clienteBuscaField.focus();
        return;
    }

    const veiculoData = {
        marca:      _veiculoField('veiculoMarca', 'marcaVeiculo')?.value || '',
        modelo:     _veiculoField('veiculoModelo', 'modeloVeiculo')?.value || '',
        placa:      _veiculoField('veiculoPlaca', 'placaVeiculo')?.value || '',
        ano:        _veiculoField('veiculoAno', 'anoVeiculo')?.value || '',
        cor:        _veiculoField('veiculoCor', 'corVeiculo')?.value || '',
        cliente_id: clienteIdResolvido
    };

    const sb = await _getSupabaseV();

    if (editingVeiculoId) {
        const { error } = await _updateVeiculoCompat(sb, editingVeiculoId, veiculoData);
        if (error) { showToast('Erro ao atualizar veiculo!', 'error'); console.error(error); return; }
        const idx = AppState.data.veiculos.findIndex(v => v.id === editingVeiculoId);
        if (idx !== -1) AppState.data.veiculos[idx] = { ...AppState.data.veiculos[idx], ...veiculoData, clienteId: veiculoData.cliente_id };
        showToast('Veiculo atualizado com sucesso!', 'success');
    } else {
        const oficina_id = _getOficinaIdV();
        const { data, error } = await _insertVeiculoCompat(sb, { ...veiculoData, oficina_id });
        if (error) { showToast('Erro ao cadastrar veiculo!', 'error'); console.error(error); return; }
        AppState.data.veiculos.push({ ...data, clienteId: data.cliente_id });
        showToast('Veiculo cadastrado com sucesso!', 'success');
    }

    renderVeiculos();
    if (typeof renderClienteVeiculosModal === 'function') renderClienteVeiculosModal();
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
            const arquivar = confirm('Este veículo possui checklists vinculados e não pode ser excluído. Deseja arquivar este veículo?');
            if (arquivar) {
                const { error: archiveError } = await _scopeVeiculoQuery(sb.from('veiculos').update({ ativo: false })).eq('id', id);
                if (!archiveError) {
                    const idx = AppState.data.veiculos.findIndex(v => v.id === id);
                    if (idx !== -1) AppState.data.veiculos[idx] = { ...AppState.data.veiculos[idx], ativo: false };
                    renderVeiculos();
                    if (typeof renderClienteVeiculosModal === 'function') renderClienteVeiculosModal();
                    updateDashboard();
                    showToast('Veículo arquivado com sucesso.', 'success');
                    return;
                }
                if (archiveError.code === '42703') {
                    showToast('Não foi possível arquivar automaticamente (campo ativo inexistente). Solicite a migração da base.', 'info');
                    return;
                }
            }
            showToast('Não é possível excluir: este veículo possui checklists vinculados. Arquive/desvincule antes de excluir.', 'info');
            return;
        }
        showToast('Erro ao excluir veiculo!', 'error');
        console.error(error);
        return;
    }
    AppState.data.veiculos = AppState.data.veiculos.filter(v => v.id !== id);
    renderVeiculos();
    if (typeof renderClienteVeiculosModal === 'function') renderClienteVeiculosModal();
    updateDashboard();
    showToast('Veiculo excluido com sucesso!', 'success');
}

async function restaurarVeiculo(id) {
    const sb = await _getSupabaseV();
    const { error } = await _scopeVeiculoQuery(sb.from('veiculos').update({ ativo: true })).eq('id', id);
    if (error) {
        if (error.code === '42703') {
            showToast('Não foi possível restaurar: campo ativo inexistente na base.', 'info');
            return;
        }
        showToast('Erro ao restaurar veículo.', 'error');
        return;
    }
    const idx = AppState.data.veiculos.findIndex(v => v.id === id);
    if (idx !== -1) AppState.data.veiculos[idx] = { ...AppState.data.veiculos[idx], ativo: true };
    renderVeiculos();
    if (typeof renderClienteVeiculosModal === 'function') renderClienteVeiculosModal();
    showToast('Veículo restaurado com sucesso.', 'success');
}

function toggleVeiculosArquivados() {
    showArchivedVeiculos = !showArchivedVeiculos;
    renderVeiculos();
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
