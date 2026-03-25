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
// RENDER LISTA DE FUNCIONARIOS
// ============================================
function renderFuncionarios() {
    const tbody = document.getElementById('funcionariosTableBody');
    if (!tbody) return;
    const lista = (AppState.data.funcionarios || []).filter(
        f => f.role !== 'admin' && f.role !== 'superadmin'
    );
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum funcionário cadastrado</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(f => `
        <tr>
            <td><strong>${_escFN(f.nome)}</strong></td>
            <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px;">${_escFN(f.usuario_login || '')}</code></td>
            <td>${ROLES_BADGE[f.role] || f.role}</td>
            <td><span class="badge ${f.ativo !== false ? 'badge-success' : 'badge-danger'}">${f.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
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
    const modal = document.getElementById('funcionarioModal');
    if (!modal) return;
    if (editId) {
        const f = (AppState.data.funcionarios || []).find(x => String(x.id) === String(editId));
        if (!f) return;
        editingFuncionarioId = editId;
        document.getElementById('fnModalTitle').textContent = 'Editar Funcionário';
        document.getElementById('fnNome').value         = f.nome || '';
        document.getElementById('fnUsuario').value      = f.usuario_login || '';
        document.getElementById('fnRole').value         = f.role || 'operacional';
        document.getElementById('fnSenha').value        = '';
        document.getElementById('fnSenhaWrap').style.display = 'block';
        document.getElementById('fnSenhaLabel').textContent  = 'Nova Senha (deixe em branco para não alterar)';
        document.getElementById('fnUsuario').readOnly = true; // usuario_login imutavel apos criacao
    } else {
        editingFuncionarioId = null;
        document.getElementById('fnModalTitle').textContent = 'Novo Funcionário';
        document.getElementById('fnNome').value         = '';
        document.getElementById('fnUsuario').value      = '';
        document.getElementById('fnRole').value         = 'operacional';
        document.getElementById('fnSenha').value        = '';
        document.getElementById('fnSenhaWrap').style.display = 'block';
        document.getElementById('fnSenhaLabel').textContent  = 'Senha';
        document.getElementById('fnUsuario').readOnly = false;
    }
    document.getElementById('fnErro').style.display = 'none';
    modal.classList.add('active');
    setTimeout(() => document.getElementById('fnNome')?.focus(), 80);
}

function closeFuncionarioModal() {
    document.getElementById('funcionarioModal')?.classList.remove('active');
    editingFuncionarioId = null;
}

async function salvarFuncionario() {
    const nome    = document.getElementById('fnNome').value.trim();
    const usuario = document.getElementById('fnUsuario').value.trim().toLowerCase().replace(/\s+/g, '');
    const role    = document.getElementById('fnRole').value;
    const senha   = document.getElementById('fnSenha').value;
    const errEl   = document.getElementById('fnErro');

    const mostrarErro = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };
    errEl.style.display = 'none';

    if (!nome)    { mostrarErro('Nome é obrigatório.'); return; }
    if (!usuario) { mostrarErro('Nome de usuário é obrigatório.'); return; }
    if (!editingFuncionarioId && (!senha || senha.length < 6)) {
        mostrarErro('Senha deve ter no mínimo 6 caracteres.'); return;
    }
    if (senha && senha.length > 0 && senha.length < 6) {
        mostrarErro('Senha deve ter no mínimo 6 caracteres.'); return;
    }

    const oficina_id = _getOficinaIdFN();
    if (!oficina_id) { mostrarErro('Erro: oficina não identificada.'); return; }

    const btnSalvar = document.getElementById('fnBtnSalvar');
    const textoOriginal = btnSalvar?.innerHTML || 'Salvar';
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }
    const resetBtn = () => { if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.innerHTML = textoOriginal; } };

    const sb = await _getSupabaseFN();

    try {
        if (editingFuncionarioId) {
            // --- EDITAR ---
            const update = { nome, role };

            // Troca senha no Auth se informada
            if (senha && senha.length >= 6) {
                const email_ficticio = _gerarEmailFicticio(usuario, oficina_id);
                // Admin API não está disponível no client; usamos RPC
                const { error: rpcErr } = await sb.rpc('admin_update_user_password', {
                    p_user_id: editingFuncionarioId,
                    p_password: senha
                });
                if (rpcErr) { mostrarErro('Erro ao atualizar senha: ' + rpcErr.message); resetBtn(); return; }
            }

            const { error } = await sb.from('usuarios').update(update).eq('id', editingFuncionarioId);
            if (error) { mostrarErro('Erro ao atualizar: ' + error.message); resetBtn(); return; }

            const idx = AppState.data.funcionarios.findIndex(f => String(f.id) === String(editingFuncionarioId));
            if (idx !== -1) AppState.data.funcionarios[idx] = { ...AppState.data.funcionarios[idx], ...update };

        } else {
            // --- CRIAR ---
            // Verifica usuario_login duplicado na oficina
            const { data: existente } = await sb.from('usuarios')
                .select('id')
                .eq('usuario_login', usuario)
                .eq('oficina_id', oficina_id)
                .maybeSingle();

            if (existente) { mostrarErro('Este nome de usuário já existe nesta oficina.'); resetBtn(); return; }

            const email_ficticio = _gerarEmailFicticio(usuario, oficina_id);

            // Verifica se email ficticio já está no Auth
            const { data: existeEmail } = await sb.from('usuarios')
                .select('id').eq('email', email_ficticio).maybeSingle();
            if (existeEmail) { mostrarErro('Nome de usuário já em uso. Tente outro.'); resetBtn(); return; }

            // Cria usuário no Supabase Auth
            const { data: authData, error: authErr } = await sb.auth.signUp({
                email: email_ficticio,
                password: senha,
                options: { data: { nome } }
            });

            if (authErr || !authData?.user?.id) {
                const msg = authErr?.message || 'Erro desconhecido';
                mostrarErro('Erro ao criar acesso: ' + msg);
                resetBtn(); return;
            }

            // Aguarda trigger do Supabase
            await new Promise(r => setTimeout(r, 700));

            // Atualiza/insere na tabela usuarios
            const { data: novoUser, error: dbErr } = await sb.from('usuarios').upsert({
                id: authData.user.id,
                nome,
                email: email_ficticio,
                usuario_login: usuario,
                role,
                oficina_id,
                ativo: true,
                primeiro_acesso: false
            }, { onConflict: 'id' }).select().single();

            if (dbErr) { mostrarErro('Usuário criado no Auth mas erro no banco: ' + dbErr.message); resetBtn(); return; }

            AppState.data.funcionarios.push(novoUser);
        }

        renderFuncionarios();
        closeFuncionarioModal();
        showToast('Funcionário salvo com sucesso!', 'success');

    } catch(e) {
        mostrarErro('Erro inesperado: ' + (e.message || e));
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
    const userRoleEl = document.querySelector('.user-role');
    if (userRoleEl) userRoleEl.textContent = ROLES_LABEL[role] || role;

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

window.renderFuncionarios     = renderFuncionarios;
window.openFuncionarioModal   = openFuncionarioModal;
window.closeFuncionarioModal  = closeFuncionarioModal;
window.salvarFuncionario      = salvarFuncionario;
window.toggleAtivoFuncionario = toggleAtivoFuncionario;
window.podeAcessar            = podeAcessar;
window.aplicarPermissoesMenu  = aplicarPermissoesMenu;
window.guardNavegacao         = guardNavegacao;
