// ============================================
// GESTAO DE ESTOQUE — Supabase
// ============================================
async function _getSupabaseEstoque() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

function _getOficinaIdEstoque() {
    return window.getCurrentOficinaId ? window.getCurrentOficinaId() : (window.AppState?.user?.oficina_id || window.AppState?.oficina?.id || null);
}

function _isSuperadminEstoque() {
    return window.AppState?.user?.role === 'superadmin';
}

function _scopeEstoqueQuery(query) {
    if (_isSuperadminEstoque()) return query;
    const oficina_id = _getOficinaIdEstoque();
    if (!oficina_id) return query;
    return query.eq('oficina_id', oficina_id);
}

let editingEstoqueId = null;
let _movimentoItemId = null;

function _escEST(s = '') {
    return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function _extractMissingColumnEstoque(error) {
    const msg = String(error?.message || '');
    const match = msg.match(/Could not find the '([^']+)' column/);
    return match?.[1] || null;
}

async function _insertMovimentoComFallback(payload) {
    let currentPayload = { ...payload };
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
        const result = await _getSupabaseEstoque().then(sb => sb.from('movimentos_estoque').insert(currentPayload).select().single());
        if (!result?.error) return result;
        const missingColumn = _extractMissingColumnEstoque(result.error);
        if (result.error.code === 'PGRST204' && missingColumn && missingColumn in currentPayload) {
            console.warn('Coluna ausente em movimentos_estoque:', missingColumn, '-> removendo do payload e tentando novamente.');
            delete currentPayload[missingColumn];
            continue;
        }
        return result;
    }
    return { data: null, error: { message: 'Falha ao registrar movimento após tentativas de fallback de schema' } };
}

// ============================================
// CARREGAR DADOS
// ============================================
async function loadEstoque() {
    const sb = await _getSupabaseEstoque();
    const { data, error } = await _scopeEstoqueQuery(
        sb.from('estoque').select('*').order('nome')
    );
    if (error) { console.error('Erro ao carregar estoque:', error); return; }
    if (!AppState.data) AppState.data = {};
    AppState.data.estoque = data || [];
    renderEstoque();
    _renderAlertasEstoque();
}

// ============================================
// RENDER TABELA
// ============================================
function renderEstoque() {
    const tbody = document.getElementById('estoqueTableBody');
    if (!tbody) return;

    const busca = (document.getElementById('estoqueBusca')?.value || '').toLowerCase();
    const itens = (AppState.data.estoque || []).filter(i =>
        !busca || i.nome.toLowerCase().includes(busca) || (i.codigo || '').toLowerCase().includes(busca)
    );

    if (itens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum item no estoque</td></tr>';
        return;
    }

    tbody.innerHTML = itens.map(item => {
        const total = (item.qtd || 0) * (item.valor_unit || 0);
        const alerta = item.qtd_min > 0 && item.qtd <= item.qtd_min;
        return `
            <tr class="${alerta ? 'row-alerta' : ''}">
                <td>
                    ${alerta ? '<i class="fas fa-exclamation-triangle" style="color:#f59e0b" title="Estoque abaixo do mínimo"></i> ' : ''}
                    <strong>${_escEST(item.nome)}</strong>
                </td>
                <td>${_escEST(item.codigo || '-')}</td>
                <td>
                    <span class="badge ${alerta ? 'badge-danger' : 'badge-info'}">${item.qtd || 0}</span>
                </td>
                <td>R$ ${Number(item.valor_unit || 0).toFixed(2)}</td>
                <td>R$ ${total.toFixed(2)}</td>
                <td>${item.qtd_min || 0}</td>
                <td>
                    <button class="btn-icon" onclick="openMovimentoEstoqueModal('${item.id}', 'entrada')" title="Entrada">
                        <i class="fas fa-plus-circle" style="color:#22c55e"></i>
                    </button>
                    <button class="btn-icon" onclick="openMovimentoEstoqueModal('${item.id}', 'saida')" title="Saída">
                        <i class="fas fa-minus-circle" style="color:#ef4444"></i>
                    </button>
                    <button class="btn-icon" onclick="editItemEstoque('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteItemEstoque('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// ALERTAS DE ESTOQUE MINIMO
// ============================================
function _renderAlertasEstoque() {
    const itens = AppState.data.estoque || [];
    const abaixo = itens.filter(i => i.qtd_min > 0 && i.qtd <= i.qtd_min);
    if (abaixo.length > 0) {
        showToast(`⚠️ ${abaixo.length} item(s) com estoque abaixo do mínimo!`, 'warning');
    }
}

// ============================================
// MODAL NOVO / EDITAR ITEM
// ============================================
function openNovoItemEstoqueModal(itemId = null) {
    const modal = document.getElementById('modal-estoque');
    if (!modal) return;

    editingEstoqueId = itemId;
    const form = document.getElementById('form-estoque');
    const header = modal.querySelector('.modal-header h3');

    if (itemId) {
        const item = (AppState.data.estoque || []).find(i => i.id === itemId);
        if (item && form) {
            if (header) header.textContent = 'Editar Item';
            form.nome.value      = item.nome || '';
            form.codigo.value    = item.codigo || '';
            form.qtd.value       = item.qtd || 0;
            form.valor_unit.value = item.valor_unit || 0;
            form.qtd_min.value   = item.qtd_min || 0;
        }
    } else {
        if (form) form.reset();
        if (header) header.textContent = 'Novo Item de Estoque';
        editingEstoqueId = null;
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
}

function editItemEstoque(id) {
    openNovoItemEstoqueModal(id);
}

function closeEstoqueModal() {
    const modal = document.getElementById('modal-estoque');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    editingEstoqueId = null;
}

// ============================================
// SALVAR ITEM (INSERT / UPDATE)
// ============================================
async function saveItemEstoque(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('form-estoque');
    if (!form) return;

    const itemData = {
        nome:       form.nome.value.trim(),
        codigo:     form.codigo.value.trim() || null,
        qtd:        parseFloat(form.qtd.value) || 0,
        valor_unit: parseFloat(form.valor_unit.value) || 0,
        qtd_min:    parseFloat(form.qtd_min.value) || 0,
    };

    if (!itemData.nome) { showToast('Informe o nome do item!', 'error'); return; }

    const sb = await _getSupabaseEstoque();

    if (editingEstoqueId) {
        const { error } = await _scopeEstoqueQuery(
            sb.from('estoque').update(itemData)
        ).eq('id', editingEstoqueId);
        if (error) { showToast('Erro ao atualizar item!', 'error'); console.error(error); return; }
        const idx = AppState.data.estoque.findIndex(i => i.id === editingEstoqueId);
        if (idx !== -1) AppState.data.estoque[idx] = { ...AppState.data.estoque[idx], ...itemData };
        showToast('Item atualizado com sucesso!', 'success');
    } else {
        const oficina_id = _getOficinaIdEstoque();
        const { data, error } = await sb.from('estoque').insert({ ...itemData, oficina_id }).select().single();
        if (error) { showToast('Erro ao cadastrar item!', 'error'); console.error(error); return; }
        AppState.data.estoque.push(data);
        showToast('Item cadastrado com sucesso!', 'success');
    }

    renderEstoque();
    _renderAlertasEstoque();
    closeEstoqueModal();
}

// ============================================
// EXCLUIR ITEM
// ============================================
async function deleteItemEstoque(id) {
    if (!confirm('Tem certeza que deseja excluir este item do estoque?')) return;

    const sb = await _getSupabaseEstoque();
    const { error } = await _scopeEstoqueQuery(
        sb.from('estoque').delete()
    ).eq('id', id);
    if (error) { showToast('Erro ao excluir item!', 'error'); console.error(error); return; }

    AppState.data.estoque = AppState.data.estoque.filter(i => i.id !== id);
    renderEstoque();
    showToast('Item excluído com sucesso!', 'success');
}

// ============================================
// MODAL MOVIMENTO (ENTRADA / SAÍDA)
// ============================================
function openMovimentoEstoqueModal(itemId, tipo) {
    _movimentoItemId = itemId;
    const item = (AppState.data.estoque || []).find(i => i.id === itemId);
    if (!item) return;

    const titulo = tipo === 'entrada' ? '📥 Entrada de Estoque' : '📤 Saída de Estoque';
    const cor    = tipo === 'entrada' ? '#22c55e' : '#ef4444';

    const html = `
        <div class="modal active" id="modalMovEstoque" style="display:flex">
            <div class="modal-content">
                <div class="modal-header" style="border-left:4px solid ${cor}">
                    <h3>${titulo}</h3>
                    <button class="modal-close" onclick="closeMovimentoEstoqueModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p><strong>Item:</strong> ${_escEST(item.nome)}</p>
                    <p><strong>Estoque atual:</strong> ${item.qtd || 0} unidades</p>
                    <div class="form-group" style="margin-top:16px">
                        <label>Quantidade *</label>
                        <input type="number" id="movEstoqueQtd" min="0.01" step="0.01" value="1" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
                    </div>
                    <div class="form-group" style="margin-top:16px">
                        <label>Data</label>
                        <input type="date" id="movEstoqueData" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
                    </div>
                    <div class="form-group" style="margin-top:16px">
                        <label>Observação</label>
                        <input type="text" id="movEstoqueObs" placeholder="Observação (opcional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeMovimentoEstoqueModal()">Cancelar</button>
                    <button id="btnConfirmarMovimentoEstoque" class="btn btn-primary" style="background:${cor}" onclick="confirmarMovimento('${tipo}')">
                        <i class="fas fa-check"></i> Confirmar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </button>
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.id = 'wrapMovEstoque';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeMovimentoEstoqueModal() {
    const el = document.getElementById('wrapMovEstoque');
    if (el) el.remove();
    _movimentoItemId = null;
}

async function confirmarMovimento(tipo) {
    const btn = document.getElementById('btnConfirmarMovimentoEstoque');
    if (btn?.disabled) return;
    const originalText = btn?.textContent;
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Salvando...';
    }

    try {
        const produtoId = _movimentoItemId;
        const quantidade = parseFloat(document.getElementById('movEstoqueQtd')?.value) || 0;
        const obs = (document.getElementById('movEstoqueObs')?.value || '').trim();
        const data = document.getElementById('movEstoqueData')?.value;

        if (!produtoId) {
            showToast('Selecione um produto', 'info');
            return;
        }

        if (!quantidade || quantidade <= 0) {
            showToast('Quantidade deve ser maior que zero', 'info');
            return;
        }

        const item = (AppState.data.estoque || []).find(i => i.id === produtoId);
        if (!item) return;

        if (tipo === 'saida' && quantidade > item.qtd) {
            showToast('Quantidade insuficiente em estoque!', 'error');
            return;
        }

        const sb = await _getSupabaseEstoque();
        const oficinaId = _getOficinaIdEstoque();
        if (!oficinaId) {
            console.error('oficina_id inválido ao salvar movimento de estoque');
            showToast('Erro: oficina não identificada', 'error');
            return;
        }

        const estoqueAtual = Number(item.qtd || 0);
        const novaQtd = tipo === 'entrada' ? estoqueAtual + quantidade : estoqueAtual - quantidade;
        const payload = {
            produto_id: produtoId,
            tipo,
            quantidade: Math.abs(quantidade),
            observacao: obs || null,
            data: data || new Date().toISOString().split('T')[0],
            oficina_id: oficinaId
        };

        const { data: movimento, error: errMov } = await _insertMovimentoComFallback(payload);
        if (errMov) {
            console.error('Supabase error:', errMov);
            showToast('Erro ao registrar movimento!', 'error');
            return;
        }
        if (!movimento) {
            console.error('Insert sem retorno');
            showToast('Falha ao registrar movimento', 'error');
            return;
        }

        const { error } = await sb.from('estoque').update({ qtd: novaQtd }).eq('id', item.id).eq('oficina_id', oficinaId);
        if (error) {
            console.error('Supabase error:', error);
            showToast('Erro ao registrar movimento!', 'error');
            return;
        }

        const idx = AppState.data.estoque.findIndex(i => i.id === item.id);
        if (idx !== -1) AppState.data.estoque[idx].qtd = novaQtd;

        showToast(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`, 'success');
        closeMovimentoEstoqueModal();
        renderEstoque();
        _renderAlertasEstoque();
    } catch (error) {
        console.error('Erro completo:', error);
        showToast('Erro ao salvar', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

// ============================================
// FILTRO POR BUSCA
// ============================================
function filtrarEstoque() {
    renderEstoque();
}

// ============================================
// INIT — chamado pelo app.js ao navegar para estoque
// ============================================
async function initEstoque() {
    if (!AppState.data.estoque) {
        await loadEstoque();
    } else {
        renderEstoque();
    }

    // Botão novo item
    const btnNovo = document.getElementById('btnNovoItemEstoque');
    if (btnNovo && !btnNovo._estoqueListenerAdded) {
        btnNovo.addEventListener('click', () => openNovoItemEstoqueModal());
        btnNovo._estoqueListenerAdded = true;
    }

    // Busca
    const inputBusca = document.getElementById('estoqueBusca');
    if (inputBusca && !inputBusca._estoqueListenerAdded) {
        inputBusca.addEventListener('input', filtrarEstoque);
        inputBusca._estoqueListenerAdded = true;
    }

    // Form salvar
    const form = document.getElementById('form-estoque');
    if (form && !form._estoqueListenerAdded) {
        form.addEventListener('submit', saveItemEstoque);
        form._estoqueListenerAdded = true;
    }

    // Fechar modal pelos botões [data-modal-close]
    document.querySelectorAll('#modal-estoque [data-modal-close]').forEach(btn => {
        if (!btn._closeListenerAdded) {
            btn.addEventListener('click', closeEstoqueModal);
            btn._closeListenerAdded = true;
        }
    });
}
