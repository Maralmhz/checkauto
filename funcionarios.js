// ============================================
// MODULO FUNCIONARIOS — Supabase
// ============================================
async function _getSupabaseFN() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

function _getOficinaIdFN() { return window.AppState?.user?.oficina_id || null; }
function _isAdminFN()      { return ['admin','superadmin'].includes(window.AppState?.user?.role); }
function _escFN(s = '')    { return window.esc ? window.esc(s) : String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

let editingFuncionarioId = null;

const ROLES_LABEL = {
    operacional:    'Operacional',
    administrativo: 'Administrativo'
};

const ROLES_BADGE = {
    operacional:    '<span class="badge badge-info">Operacional</span>',
    administrativo: '<span class="badge badge-warning">Administrativo</span>',
    admin:          '<span class="badge badge-success">Admin</span>',
    superadmin:     '<span class="badge badge-danger">Superadmin</span>'
};

// ============================================
// HELPERS DO MODAL
// ============================================
function _fField(name) {
    return document.querySelector(`#form-funcionarios [name="${name}"]`);
}
function _fVal(name) {
    const el = _fField(name);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value;
}
function _fSet(name, val) {
    const el = _fField(name);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = Boolean(val);
    else el.value = val ?? '';
}

// ============================================
// RENDER LISTA DE FUNCIONARIOS
// ============================================
function renderFuncionarios() {
    const tbody = document.getElementById('funcionariosTableBody');
    if (!tbody) return;
    const lista = (AppState.data.funcionarios || []).filter(
        f => f.role !== 'admin' && f.role !== 'superadmin'
    );
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum funcion\u00e1rio cadastrado</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(f => `
        <tr>
            <td><strong>${_escFN(f.nome)}</strong></td>
            <td>${_escFN(f.cpf || '')}</td>
            <td>${_escFN(f.telefone || '')}</td>
            <td>${_escFN(f.cargo || '')}</td>
            <td>${_escFN(f.comissao != null ? f.comissao + '%' : '')}</td>
            <td><span class="badge ${f.ativo !== false ? 'badge-success' : 'badge-danger'}">${f.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
            <td>${ROLES_BADGE[f.role] || _escFN(f.role || '')}</td>
            <td>
                <button class="btn-icon" onclick="openFuncionarioModal('${f.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-${f.ativo !== false ? 'danger' : 'success'}" onclick="toggleAtivoFuncionario('${f.id}', ${!(f.ativo !== false)})" title="${f.ativo !== false ? 'Desativar' : 'Ativar'}"><i class="fas fa-${f.ativo !== false ? 'ban' : 'check'}"></i></button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// MODAL CRIAR / EDITAR FUNCIONARIO
// ============================================
function openFuncionarioModal(editId = null) {
    const modal = document.getElementById('modal-funcionarios');
    const title = document.getElementById('funcionarioModalTitle');
    const form  = document.getElementById('form-funcionarios');
    if (!modal || !form) return;

    form.reset();
    _fSet('ativo', true);

    if (editId) {
        const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(editId));
        if (!f) return;
        editingFuncionarioId = editId;
        if (title) title.textContent = 'Editar Funcion\u00e1rio';

        _fSet('funcionario_id', f.id);
        _fSet('nome',      f.nome      || '');
        _fSet('cpf',       f.cpf       || '');
        _fSet('telefone',  f.telefone  || '');
        _fSet('cargo',     f.cargo     || 'T\u00e9cnico');
        _fSet('comissao',  f.comissao  ?? 0);
        _fSet('ativo',     f.ativo !== false);
    } else {
        editingFuncionarioId = null;
        if (title) title.textContent = 'Novo Funcion\u00e1rio';
        _fSet('funcionario_id', '');
    }

    form.onsubmit = (e) => { e.preventDefault(); salvarFuncionario(); };
    modal.classList.add('active');
    setTimeout(() => _fField('nome')?.focus(), 80);
}

function closeFuncionarioModal() {
    const modal = document.getElementById('modal-funcionarios');
    modal?.classList.remove('active');
    editingFuncionarioId = null;
}

// ============================================
// SALVAR FUNCIONARIO
// ============================================
async function salvarFuncionario() {
    const nome     = String(_fVal('nome')).trim();
    const cpf      = String(_fVal('cpf')).trim();
    const telefone = String(_fVal('telefone')).trim();
    const cargo    = String(_fVal('cargo')).trim();
    const comissao = parseFloat(_fVal('comissao')) || 0;
    const ativo    = Boolean(_fVal('ativo'));

    if (!nome) { showToast('Nome \u00e9 obrigat\u00f3rio.', 'error'); return; }

    const oficina_id = _getOficinaIdFN();
    if (!oficina_id) { showToast('Erro: oficina n\u00e3o identificada.', 'error'); return; }

    const btnSalvar = document.querySelector('#form-funcionarios button[type="submit"]');
    const textoOriginal = btnSalvar?.innerHTML || 'Salvar';
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }
    const resetBtn = () => { if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.innerHTML = textoOriginal; } };

    const sb = await _getSupabaseFN();

    try {
        if (editingFuncionarioId) {
            // ---- EDITAR ----
            const update = { nome, cpf, telefone, cargo, comissao, ativo };
            const { error } = await sb.from('usuarios').update(update).eq('id', editingFuncionarioId);
            if (error) { showToast('Erro ao atualizar: ' + error.message, 'error'); resetBtn(); return; }

            const idx = AppState.data.funcionarios.findIndex(f => String(f.id) === String(editingFuncionarioId));
            if (idx !== -1) AppState.data.funcionarios[idx] = { ...AppState.data.funcionarios[idx], ...update };

        } else {
            // ---- CRIAR ----
            const { data: novoUser, error: dbErr } = await sb.from('usuarios').insert({
                nome,
                cpf,
                telefone,
                cargo,
                comissao,
                oficina_id,
                role:  'operacional',
                ativo
            }).select().single();

            if (dbErr) { showToast('Erro ao cadastrar: ' + dbErr.message, 'error'); resetBtn(); return; }
            AppState.data.funcionarios.push(novoUser);
        }

        renderFuncionarios();
        closeFuncionarioModal();
        showToast('Funcion\u00e1rio salvo com sucesso!', 'success');

    } catch(e) {
        showToast('Erro inesperado: ' + (e.message || e), 'error');
    } finally {
        resetBtn();
    }
}

// ============================================
// ATIVAR / DESATIVAR FUNCIONARIO
// ============================================
async function toggleAtivoFuncionario(id, ativo) {
    const acao = ativo ? 'ativar' : 'desativar';
    if (!confirm(`Deseja ${acao} este funcion\u00e1rio?`)) return;
    const sb = await _getSupabaseFN();
    const { error } = await sb.from('usuarios').update({ ativo }).eq('id', id);
    if (error) { showToast('Erro ao atualizar!', 'error'); return; }
    const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(id));
    if (f) f.ativo = ativo;
    renderFuncionarios();
    showToast(`Funcion\u00e1rio ${ativo ? 'ativado' : 'desativado'}!`, 'success');
}

// ============================================
// PERMISSOES POR ROLE
// ============================================
const PERMISSOES = {
    dashboard:          ['operacional', 'administrativo'],
    clientes:           ['operacional', 'administrativo'],
    veiculos:           ['operacional', 'administrativo'],
    'ordens-servico':   ['operacional', 'administrativo'],
    agendamento:        ['operacional', 'administrativo'],
    checklist:          ['operacional', 'administrativo'],
    'checklists-salvos':['operacional', 'administrativo'],
    estoque:            ['administrativo'],
    fornecedores:       ['administrativo'],
    financeiro:         [],
    funcionarios:       [],
    configuracoes:      []
};

function podeAcessar(page) {
    const role = window.AppState?.user?.role;
    if (!role) return true;
    if (role === 'admin' || role === 'superadmin') return true;
    const permitidos = PERMISSOES[page];
    if (!permitidos) return true;
    return permitidos.includes(role);
}

function aplicarPermissoesMenu() {
    const role = window.AppState?.user?.role;
    if (!role || role === 'admin' || role === 'superadmin') return;

    const userRoleEl = document.getElementById('sidebarUserRole');
    if (userRoleEl) userRoleEl.textContent = ROLES_LABEL[role] || role;

    const userNameEl = document.getElementById('sidebarUserName');
    if (userNameEl) userNameEl.textContent = window.AppState?.user?.nome || 'Usu\u00e1rio';

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        const page = item.getAttribute('data-page');
        if (!podeAcessar(page)) item.style.display = 'none';
    });
}

function guardNavegacao(page) {
    const role = window.AppState?.user?.role;
    if (!role) return true;
    if (podeAcessar(page)) return true;
    showToast('Voc\u00ea n\u00e3o tem permiss\u00e3o para acessar esta \u00e1rea.', 'error');
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const btnNovo = document.getElementById('btnNovoFuncionario');
    if (btnNovo) btnNovo.addEventListener('click', () => openFuncionarioModal());

    const modal = document.getElementById('modal-funcionarios');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeFuncionarioModal();
        });
        modal.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', closeFuncionarioModal);
        });
    }
});

window.renderFuncionarios     = renderFuncionarios;
window.openFuncionarioModal   = openFuncionarioModal;
window.closeFuncionarioModal  = closeFuncionarioModal;
window.salvarFuncionario      = salvarFuncionario;
window.toggleAtivoFuncionario = toggleAtivoFuncionario;
window.podeAcessar            = podeAcessar;
window.aplicarPermissoesMenu  = aplicarPermissoesMenu;
window.guardNavegacao         = guardNavegacao;
