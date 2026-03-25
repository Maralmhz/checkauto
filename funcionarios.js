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

// Gera email ficticio para login sem e-mail real
function _gerarEmailFicticio(usuario, oficina_id) {
    const slug = String(usuario).toLowerCase().replace(/[^a-z0-9]/g, '') || 'func';
    return `${slug}@of-${oficina_id}.checkauto.app`;
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
// HELPERS DO MODAL (index.html: #modal-funcionarios)
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
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum funcionário cadastrado</td></tr>';
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
// Usa #modal-funcionarios definido no index.html
// ============================================
function openFuncionarioModal(editId = null) {
    const modal = document.getElementById('modal-funcionarios');
    const title = document.getElementById('funcionarioModalTitle');
    const form  = document.getElementById('form-funcionarios');
    if (!modal || !form) return;

    form.reset();
    _fSet('ativo', true);

    // Campo usuario_login: editavel so na criacao
    const usuarioField = _fField('usuario_login');

    if (editId) {
        const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(editId));
        if (!f) return;
        editingFuncionarioId = editId;
        if (title) title.textContent = 'Editar Funcionário';

        _fSet('funcionario_id', f.id);
        _fSet('nome',          f.nome       || '');
        _fSet('cpf',           f.cpf        || '');
        _fSet('telefone',      f.telefone   || '');
        _fSet('cargo',         f.cargo      || 'Técnico');
        _fSet('comissao',      f.comissao   ?? 0);
        _fSet('usuario_login', f.usuario_login || '');
        _fSet('perfil_acesso', f.role || '');
        _fSet('senha_acesso',  '');
        _fSet('ativo',         f.ativo !== false);

        if (usuarioField) usuarioField.readOnly = true; // imutavel apos criacao
    } else {
        editingFuncionarioId = null;
        if (title) title.textContent = 'Novo Funcionário';
        _fSet('funcionario_id', '');
        if (usuarioField) usuarioField.readOnly = false;
    }

    // Garante que submit chama salvarFuncionario
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
    const nome          = String(_fVal('nome')).trim();
    const cpf           = String(_fVal('cpf')).trim();
    const telefone      = String(_fVal('telefone')).trim();
    const cargo         = String(_fVal('cargo')).trim();
    const comissao      = parseFloat(_fVal('comissao')) || 0;
    const usuario_login = String(_fVal('usuario_login')).trim().toLowerCase().replace(/\s+/g, '');
    const perfil_acesso = String(_fVal('perfil_acesso')).trim();  // '' | 'operacional' | 'administrativo'
    const senha         = String(_fVal('senha_acesso')).trim();
    const ativo         = Boolean(_fVal('ativo'));

    if (!nome) { showToast('Nome é obrigatório.', 'error'); return; }

    // Se informou usuario_login, precisa de perfil e senha (na criação)
    if (usuario_login) {
        if (!perfil_acesso) { showToast('Selecione o perfil de acesso.', 'error'); return; }
        if (!editingFuncionarioId && (!senha || senha.length < 6)) {
            showToast('Senha deve ter no mínimo 6 caracteres.', 'error'); return;
        }
        if (senha && senha.length > 0 && senha.length < 6) {
            showToast('Senha deve ter no mínimo 6 caracteres.', 'error'); return;
        }
    }

    const oficina_id = _getOficinaIdFN();
    if (!oficina_id) { showToast('Erro: oficina não identificada.', 'error'); return; }

    // Botão de salvar
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

            // Troca senha no Auth se informada
            if (senha && senha.length >= 6) {
                const { error: rpcErr } = await sb.rpc('admin_update_user_password', {
                    p_user_id: editingFuncionarioId,
                    p_password: senha
                });
                if (rpcErr) { showToast('Erro ao atualizar senha: ' + rpcErr.message, 'error'); resetBtn(); return; }
            }

            const { error } = await sb.from('usuarios').update(update).eq('id', editingFuncionarioId);
            if (error) { showToast('Erro ao atualizar: ' + error.message, 'error'); resetBtn(); return; }

            const idx = AppState.data.funcionarios.findIndex(f => String(f.id) === String(editingFuncionarioId));
            if (idx !== -1) AppState.data.funcionarios[idx] = { ...AppState.data.funcionarios[idx], ...update };

        } else {
            // ---- CRIAR ----
            let userId = null;

            if (usuario_login) {
                // Verifica usuario_login duplicado na oficina
                const { data: existente } = await sb.from('usuarios')
                    .select('id')
                    .eq('usuario_login', usuario_login)
                    .eq('oficina_id', oficina_id)
                    .maybeSingle();
                if (existente) { showToast('Este nome de usuário já existe nesta oficina.', 'error'); resetBtn(); return; }

                const email_ficticio = _gerarEmailFicticio(usuario_login, oficina_id);

                // Verifica se email ficticio já está no Auth
                const { data: existeEmail } = await sb.from('usuarios')
                    .select('id').eq('email', email_ficticio).maybeSingle();
                if (existeEmail) { showToast('Nome de usuário já em uso. Tente outro.', 'error'); resetBtn(); return; }

                // Cria usuário no Supabase Auth
                const { data: authData, error: authErr } = await sb.auth.signUp({
                    email: email_ficticio,
                    password: senha,
                    options: { data: { nome } }
                });

                if (authErr || !authData?.user?.id) {
                    showToast('Erro ao criar acesso: ' + (authErr?.message || 'Erro desconhecido'), 'error');
                    resetBtn(); return;
                }
                userId = authData.user.id;

                // Aguarda trigger do Supabase
                await new Promise(r => setTimeout(r, 700));

                // Insere na tabela usuarios
                const { data: novoUser, error: dbErr } = await sb.from('usuarios').upsert({
                    id:             userId,
                    nome,
                    cpf,
                    telefone,
                    cargo,
                    comissao,
                    email:          email_ficticio,
                    usuario_login,
                    role:           perfil_acesso,
                    oficina_id,
                    ativo,
                    primeiro_acesso: false
                }, { onConflict: 'id' }).select().single();

                if (dbErr) { showToast('Usuário criado no Auth mas erro no banco: ' + dbErr.message, 'error'); resetBtn(); return; }
                AppState.data.funcionarios.push(novoUser);

            } else {
                // Sem acesso ao sistema — cadastra só na tabela usuarios (sem Auth)
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
        showToast('Funcionário salvo com sucesso!', 'success');

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
    if (!confirm(`Deseja ${acao} este funcionário?`)) return;
    const sb = await _getSupabaseFN();
    const { error } = await sb.from('usuarios').update({ ativo }).eq('id', id);
    if (error) { showToast('Erro ao atualizar!', 'error'); return; }
    const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(id));
    if (f) f.ativo = ativo;
    renderFuncionarios();
    showToast(`Funcionário ${ativo ? 'ativado' : 'desativado'}!`, 'success');
}

// ============================================
// PERMISSOES POR ROLE
// Retorna true se o role pode acessar a pagina
// ============================================
const PERMISSOES = {
    // pagina: ['roles permitidos'] — admin sempre pode tudo
    dashboard:          ['operacional', 'administrativo'],
    clientes:           ['operacional', 'administrativo'],
    veiculos:           ['operacional', 'administrativo'],
    'ordens-servico':   ['operacional', 'administrativo'],
    agendamento:        ['operacional', 'administrativo'],
    checklist:          ['operacional', 'administrativo'],
    'checklists-salvos':['operacional', 'administrativo'],
    estoque:            ['administrativo'],
    fornecedores:       ['administrativo'],
    financeiro:         [],  // apenas admin
    funcionarios:       [],  // apenas admin
    configuracoes:      []   // apenas admin
};

function podeAcessar(page) {
    const role = window.AppState?.user?.role;
    if (!role) return false;
    if (role === 'admin' || role === 'superadmin') return true;
    const permitidos = PERMISSOES[page];
    if (!permitidos) return true; // paginas nao listadas: liberadas
    return permitidos.includes(role);
}

// Esconde itens do menu que o usuário não pode acessar
function aplicarPermissoesMenu() {
    const role = window.AppState?.user?.role;
    if (!role || role === 'admin' || role === 'superadmin') return;

    // Adiciona badge de role no header
    const userRoleEl = document.getElementById('sidebarUserRole');
    if (userRoleEl) userRoleEl.textContent = ROLES_LABEL[role] || role;

    const userNameEl = document.getElementById('sidebarUserName');
    if (userNameEl) userNameEl.textContent = window.AppState?.user?.nome || 'Usuário';

    // Esconde itens de menu sem permissão
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        const page = item.getAttribute('data-page');
        if (!podeAcessar(page)) item.style.display = 'none';
    });
}

// Guard chamado no navigateTo do app.js
function guardNavegacao(page) {
    if (podeAcessar(page)) return true;
    showToast('Você não tem permissão para acessar esta área.', 'error');
    return false;
}

// Conecta o botão + Novo Funcionário ao modal correto
document.addEventListener('DOMContentLoaded', () => {
    const btnNovo = document.getElementById('btnNovoFuncionario');
    if (btnNovo) btnNovo.addEventListener('click', () => openFuncionarioModal());

    // Fecha modal ao clicar fora ou em [data-modal-close]
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
