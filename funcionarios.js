// ============================================
// MODULO FUNCIONARIOS — Supabase
// Login sem e-mail: gera email ficticio
// usuario@of-{oficina_id}.checkauto.app
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

function _gerarEmailFicticio(usuario, oficina_id) {
    const slug = String(usuario).toLowerCase().replace(/[^a-z0-9]/g, '') || 'func';
    return `${slug}@of-${oficina_id}.checkauto.app`;
}

// Gera PIN aleatorio de 6 digitos
function _gerarPinAleatorio() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

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

    const usuarioField = _fField('usuario_login');
    // Remove preview de senha anterior se existir
    document.getElementById('senhaGeradaPreview')?.remove();

    if (editId) {
        const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(editId));
        if (!f) return;
        editingFuncionarioId = editId;
        if (title) title.textContent = 'Editar Funcion\u00e1rio';

        _fSet('funcionario_id', f.id);
        _fSet('nome',          f.nome       || '');
        _fSet('cpf',           f.cpf        || '');
        _fSet('telefone',      f.telefone   || '');
        _fSet('cargo',         f.cargo      || 'T\u00e9cnico');
        _fSet('comissao',      f.comissao   ?? 0);
        _fSet('usuario_login', f.usuario_login || '');
        _fSet('perfil_acesso', f.role || '');
        _fSet('senha_acesso',  '');
        _fSet('ativo',         f.ativo !== false);

        if (usuarioField) usuarioField.readOnly = true;
    } else {
        editingFuncionarioId = null;
        if (title) title.textContent = 'Novo Funcion\u00e1rio';
        _fSet('funcionario_id', '');
        if (usuarioField) usuarioField.readOnly = false;

        // Gera PIN automatico e exibe preview
        const pinGerado = _gerarPinAleatorio();
        _fSet('senha_acesso', pinGerado);
        _injetarPreviewSenha(pinGerado);
    }

    form.onsubmit = (e) => { e.preventDefault(); salvarFuncionario(); };
    modal.classList.add('active');
    setTimeout(() => _fField('nome')?.focus(), 80);
}

// Injeta card de exibicao do PIN gerado abaixo do campo senha
function _injetarPreviewSenha(pin) {
    const senhaField = _fField('senha_acesso');
    if (!senhaField) return;

    const preview = document.createElement('div');
    preview.id = 'senhaGeradaPreview';
    preview.style.cssText = 'margin-top:8px;padding:10px 14px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;';
    preview.innerHTML = `
        <span style="font-size:13px;color:#166534;">
            🔑 <strong>Senha tempor\u00e1ria:</strong>
            <span id="pinGeradoValor" style="font-size:17px;font-weight:700;letter-spacing:4px;margin-left:6px;">${pin}</span>
        </span>
        <button type="button" id="btnCopiarPin"
            style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">
            <i class="fas fa-copy"></i> Copiar
        </button>
    `;
    senhaField.parentNode.insertBefore(preview, senhaField.nextSibling);

    document.getElementById('btnCopiarPin')?.addEventListener('click', () => {
        navigator.clipboard.writeText(pin).then(() => {
            const btn = document.getElementById('btnCopiarPin');
            if (btn) { btn.textContent = '\u2705 Copiado!'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copiar'; }, 2000); }
        }).catch(() => {
            showToast('PIN: ' + pin, 'info');
        });
    });
}

function closeFuncionarioModal() {
    const modal = document.getElementById('modal-funcionarios');
    modal?.classList.remove('active');
    document.getElementById('senhaGeradaPreview')?.remove();
    editingFuncionarioId = null;
}

// ============================================
// SALVAR FUNCIONARIO
// ============================================
async function salvarFuncionario() {
    const nome          = String(_fVal('nome')).trim();
    const cpf           = String(_fVal('cpf')).trim();
    const telefone      = String(_fVal('telefone')).trim();
    const cargo         = String(_fVal('cargo')).trim();
    const comissao      = parseFloat(_fVal('comissao')) || 0;
    const usuario_login = String(_fVal('usuario_login')).trim().toLowerCase().replace(/\s+/g, '');
    const perfil_acesso = String(_fVal('perfil_acesso')).trim();
    const senha         = String(_fVal('senha_acesso')).trim();
    const ativo         = Boolean(_fVal('ativo'));

    if (!nome) { showToast('Nome \u00e9 obrigat\u00f3rio.', 'error'); return; }

    if (usuario_login) {
        if (!perfil_acesso) { showToast('Selecione o perfil de acesso.', 'error'); return; }
        if (!editingFuncionarioId && (!senha || senha.length < 6)) {
            showToast('Senha deve ter no m\u00ednimo 6 caracteres.', 'error'); return;
        }
        if (senha && senha.length > 0 && senha.length < 6) {
            showToast('Senha deve ter no m\u00ednimo 6 caracteres.', 'error'); return;
        }
    }

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
            if (perfil_acesso) update.role = perfil_acesso;

            if (senha && senha.length >= 6) {
                const { error: rpcErr } = await sb.rpc('admin_update_user_password', {
                    p_user_id: editingFuncionarioId,
                    p_password: senha
                });
                if (rpcErr) { showToast('Erro ao atualizar senha: ' + rpcErr.message, 'error'); resetBtn(); return; }
                // Reativa primeiro_acesso para que o funcionario defina novo PIN
                update.primeiro_acesso = true;
            }

            const { error } = await sb.from('usuarios').update(update).eq('id', editingFuncionarioId);
            if (error) { showToast('Erro ao atualizar: ' + error.message, 'error'); resetBtn(); return; }

            const idx = AppState.data.funcionarios.findIndex(f => String(f.id) === String(editingFuncionarioId));
            if (idx !== -1) AppState.data.funcionarios[idx] = { ...AppState.data.funcionarios[idx], ...update };

        } else {
            // ---- CRIAR ----
            if (usuario_login) {
                const { data: existente } = await sb.from('usuarios')
                    .select('id')
                    .eq('usuario_login', usuario_login)
                    .eq('oficina_id', oficina_id)
                    .maybeSingle();
                if (existente) { showToast('Este nome de usu\u00e1rio j\u00e1 existe nesta oficina.', 'error'); resetBtn(); return; }

                const email_ficticio = _gerarEmailFicticio(usuario_login, oficina_id);

                const { data: existeEmail } = await sb.from('usuarios')
                    .select('id').eq('email', email_ficticio).maybeSingle();
                if (existeEmail) { showToast('Nome de usu\u00e1rio j\u00e1 em uso. Tente outro.', 'error'); resetBtn(); return; }

                const { data: authData, error: authErr } = await sb.auth.signUp({
                    email: email_ficticio,
                    password: senha,
                    options: { data: { nome } }
                });

                if (authErr || !authData?.user?.id) {
                    showToast('Erro ao criar acesso: ' + (authErr?.message || 'Erro desconhecido'), 'error');
                    resetBtn(); return;
                }
                const userId = authData.user.id;

                await new Promise(r => setTimeout(r, 700));

                const { data: novoUser, error: dbErr } = await sb.from('usuarios').upsert({
                    id:              userId,
                    nome,
                    cpf,
                    telefone,
                    cargo,
                    comissao,
                    email:           email_ficticio,
                    usuario_login,
                    role:            perfil_acesso,
                    oficina_id,
                    ativo,
                    primeiro_acesso: true   // <-- forca troca de PIN no primeiro login
                }, { onConflict: 'id' }).select().single();

                if (dbErr) { showToast('Usu\u00e1rio criado no Auth mas erro no banco: ' + dbErr.message, 'error'); resetBtn(); return; }
                AppState.data.funcionarios.push(novoUser);

            } else {
                const { data: novoUser, error: dbErr } = await sb.from('usuarios').insert({
                    nome,
                    cpf,
                    telefone,
                    cargo,
                    comissao,
                    oficina_id,
                    role:   'operacional',
                    ativo
                }).select().single();

                if (dbErr) { showToast('Erro ao cadastrar: ' + dbErr.message, 'error'); resetBtn(); return; }
                AppState.data.funcionarios.push(novoUser);
            }
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
