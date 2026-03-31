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
                ${f.auth_id ? `<button class="btn-icon btn-warning" onclick="openResetSenhaModal('${_escFN(f.id)}', '${_escFN(f.auth_id)}', '${_escFN(f.nome)}')" title="Redefinir Senha"><i class="fas fa-key"></i></button>` : ''}
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
// MODAL REDEFINIR SENHA
// ============================================
function _injetarModalResetSenha() {
    if (document.getElementById('modal-reset-senha')) return;
    const div = document.createElement('div');
    div.innerHTML = `
    <div class="modal-overlay" id="modal-reset-senha">
        <div class="modal-container" style="max-width:420px">
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> Redefinir Senha</h3>
                <button class="btn-close" onclick="closeResetSenhaModal()">&times;</button>
            </div>
            <div style="padding:16px 20px 4px">
                <p style="color:#6b7280;font-size:14px;margin-bottom:16px">
                    Definindo nova senha para: <strong id="resetSenhaNomeFunc"></strong>
                </p>
                <input type="hidden" id="resetSenhaAuthId">
                <div class="form-group" style="margin-bottom:14px">
                    <label>Nova senha <span style="color:#ef4444">*</span></label>
                    <div style="position:relative">
                        <input type="password" id="resetSenhaInput" placeholder="M\u00ednimo 6 caracteres"
                            style="width:100%;padding-right:40px"
                            oninput="_validarResetSenha()">
                        <button type="button" onclick="_toggleVerResetSenha()"
                            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6b7280">
                            <i class="fas fa-eye" id="iconVerResetSenha"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:6px">
                    <label>Confirmar senha <span style="color:#ef4444">*</span></label>
                    <input type="password" id="resetSenhaConfirm" placeholder="Repita a nova senha"
                        oninput="_validarResetSenha()">
                </div>
                <p id="resetSenhaErro" style="color:#ef4444;font-size:13px;min-height:18px;margin:4px 0 12px"></p>
            </div>
            <div class="modal-actions" style="padding:12px 20px 20px">
                <button type="button" class="btn btn-secondary" onclick="closeResetSenhaModal()">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnConfirmarResetSenha" onclick="confirmarResetSenha()" disabled>
                    <i class="fas fa-save"></i> Salvar Nova Senha
                </button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(div.firstElementChild);
}

function openResetSenhaModal(funcId, authId, nome) {
    _injetarModalResetSenha();
    document.getElementById('resetSenhaNomeFunc').textContent = nome;
    document.getElementById('resetSenhaAuthId').value = authId;
    document.getElementById('resetSenhaInput').value = '';
    document.getElementById('resetSenhaConfirm').value = '';
    document.getElementById('resetSenhaErro').textContent = '';
    document.getElementById('btnConfirmarResetSenha').disabled = true;
    const iconEl = document.getElementById('iconVerResetSenha');
    if (iconEl) iconEl.className = 'fas fa-eye';
    document.getElementById('resetSenhaInput').type = 'password';
    document.getElementById('resetSenhaConfirm').type = 'password';
    document.getElementById('modal-reset-senha').classList.add('active');
    setTimeout(() => document.getElementById('resetSenhaInput')?.focus(), 80);
}

function closeResetSenhaModal() {
    const m = document.getElementById('modal-reset-senha');
    if (m) m.classList.remove('active');
}

function _toggleVerResetSenha() {
    const inp = document.getElementById('resetSenhaInput');
    const con = document.getElementById('resetSenhaConfirm');
    const ico = document.getElementById('iconVerResetSenha');
    const mostrar = inp.type === 'password';
    inp.type = mostrar ? 'text' : 'password';
    con.type = mostrar ? 'text' : 'password';
    if (ico) ico.className = mostrar ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function _validarResetSenha() {
    const senha   = document.getElementById('resetSenhaInput')?.value || '';
    const confirm = document.getElementById('resetSenhaConfirm')?.value || '';
    const erroEl  = document.getElementById('resetSenhaErro');
    const btnEl   = document.getElementById('btnConfirmarResetSenha');
    let erro = '';
    if (senha.length > 0 && senha.length < 6) erro = 'A senha deve ter ao menos 6 caracteres.';
    else if (confirm.length > 0 && senha !== confirm) erro = 'As senhas n\u00e3o coincidem.';
    if (erroEl) erroEl.textContent = erro;
    if (btnEl) btnEl.disabled = !(senha.length >= 6 && senha === confirm);
}

async function confirmarResetSenha() {
    const authId    = document.getElementById('resetSenhaAuthId')?.value;
    const novaSenha = document.getElementById('resetSenhaInput')?.value;
    const btn       = document.getElementById('btnConfirmarResetSenha');
    if (!authId || !novaSenha) return;

    const textoOrig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const sb = await _getSupabaseFN();
        const { data: { session } } = await sb.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Sess\u00e3o expirada. Fa\u00e7a login novamente.');

        const resp = await fetch(
            'https://hefpzigrxyyhvtgkyspr.supabase.co/functions/v1/admin-reset-password',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ auth_id: authId, nova_senha: novaSenha })
            }
        );

        const result = await resp.json();
        if (!resp.ok || result.error) throw new Error(result.error || 'Erro desconhecido');

        showToast('Senha redefinida com sucesso! \u2705', 'success');
        closeResetSenhaModal();
    } catch(e) {
        showToast('Erro: ' + (e.message || e), 'error');
        btn.disabled = false;
        btn.innerHTML = textoOrig;
    }
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

window.renderFuncionarios      = renderFuncionarios;
window.openFuncionarioModal    = openFuncionarioModal;
window.closeFuncionarioModal   = closeFuncionarioModal;
window.salvarFuncionario       = salvarFuncionario;
window.toggleAtivoFuncionario  = toggleAtivoFuncionario;
window.podeAcessar             = podeAcessar;
window.aplicarPermissoesMenu   = aplicarPermissoesMenu;
window.guardNavegacao          = guardNavegacao;
window.openResetSenhaModal     = openResetSenhaModal;
window.closeResetSenhaModal    = closeResetSenhaModal;
window.confirmarResetSenha     = confirmarResetSenha;
window._validarResetSenha      = _validarResetSenha;
window._toggleVerResetSenha    = _toggleVerResetSenha;
