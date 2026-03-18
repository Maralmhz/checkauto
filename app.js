// ============================================
// SUPABASE CONFIG
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
window._supabase = supabase;

let _primeiroAcessoPendente = false;

// ============================================
// ESTADO GLOBAL
// ============================================
const AppState = {
    currentPage: 'dashboard',
    user: null,
    oficina: {
        nome: '', nomeExibicao: '', subtitulo: '',
        endereco: '', telefone: '', cnpj: '', email: '',
        site: '', corPrimaria: '#27ae60',
        rodapePDF: 'Obrigado pela preferencia!',
        logo: 'logo-default.png',
        plano: 'TRIAL', status: 'trial', trial_ate: null, created_at: null
    },
    data: {
        clientes: [], veiculos: [], ordensServico: [],
        agendamentos: [], contasReceber: [],
        contasPagar: [], contasFixas: [], checklists: [],
        estoque: [], movimentosEstoque: [], fornecedores: [], funcionarios: []
    }
};

supabase.auth.onAuthStateChange((event) => {
    if (_primeiroAcessoPendente) return;
});

// ============================================
// BANNER TRIAL — CANTO INFERIOR ESQUERDO
// ============================================
function renderTrialCountdownBanner() {
    document.getElementById('trialCountdownBanner')?.remove();

    const plano    = String(AppState.oficina?.plano || 'TRIAL').toUpperCase();
    const status   = String(AppState.oficina?.status || '').toLowerCase();
    const trialAte = AppState.oficina?.trial_ate;

    if (plano !== 'TRIAL' || status === 'vencido' || status === 'ativo') return;
    if (!trialAte) return;

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const fim  = new Date(trialAte); fim.setHours(0,0,0,0);
    const diasRestantes = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    if (diasRestantes < 0) return;

    let cor, emoji;
    if (diasRestantes > 7)      { cor = '#16a34a'; emoji = '🟢'; }
    else if (diasRestantes > 3) { cor = '#d97706'; emoji = '🟡'; }
    else                        { cor = '#dc2626'; emoji = '🔴'; }

    const texto = diasRestantes === 0
        ? '⚠️ Último dia de trial!'
        : diasRestantes === 1
            ? '⚠️ 1 dia restante no trial'
            : `${emoji} Trial: ${diasRestantes} dias restantes`;

    const banner = document.createElement('div');
    banner.id = 'trialCountdownBanner';
    banner.style.cssText = [
        'position:fixed', 'bottom:20px', 'left:20px', 'z-index:8000',
        `background:${cor}`, 'color:#fff', 'border-radius:50px',
        'padding:8px 16px', 'font-size:13px', 'font-weight:600',
        'font-family:Segoe UI,Tahoma,sans-serif', 'display:flex',
        'align-items:center', 'gap:10px', 'box-shadow:0 4px 16px rgba(0,0,0,.25)',
        'cursor:pointer', 'transition:opacity .2s', 'max-width:300px'
    ].join(';');

    banner.innerHTML = `
        <span>${texto}</span>
        <button onclick="window._abrirUpgradeDoCountdown()"
            style="background:rgba(255,255,255,.25);color:#fff;border:1px solid rgba(255,255,255,.5);
                   border-radius:20px;padding:3px 10px;font-size:12px;font-weight:700;
                   cursor:pointer;white-space:nowrap;">
            Assinar
        </button>
        <button onclick="document.getElementById('trialCountdownBanner').style.display='none'"
            style="background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;
                   font-size:16px;line-height:1;padding:0 2px;">
            &times;
        </button>
    `;

    document.body.appendChild(banner);
}

window._abrirUpgradeDoCountdown = function() {
    renderTrialPopup(AppState.oficina);
};

// ============================================
// UPGRADE — REDIRECIONA PARA WHATSAPP
// ============================================
function solicitarUpgrade(plano) {
    const nome      = AppState.oficina?.nome      || AppState.user?.nome  || '';
    const email     = AppState.oficina?.email     || AppState.user?.email || '';
    const whatsapp  = AppState.oficina?.telefone  || '';
    const precos    = { MENSAL: 'R$99,90/mês', ANUAL: 'R$999,90/ano' };
    const preco     = precos[plano.toUpperCase()] || '';

    const msg = [
        `💳 SOLICITAÇÃO DE UPGRADE — CheckAuto`,
        ``,
        `🏢 Oficina: ${nome}`,
        `📧 Email: ${email}`,
        whatsapp ? `📱 WhatsApp: ${whatsapp}` : '',
        ``,
        `🟢 Plano desejado: ${plano.toUpperCase()} ${preco}`,
        ``,
        `Por favor, me envie o link de pagamento para ativar o plano.`
    ].filter(Boolean).join('\n');

    closeTrialPopup();
    window.open(`https://wa.me/5531996766963?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('Abrindo WhatsApp para finalizar sua assinatura 🚀', 'info');
}

function closeTrialPopup() {
    const overlay = document.getElementById('trialUpsellOverlay');
    if (!overlay) return;
    overlay.style.transition = 'opacity .25s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 260);
}

// ============================================
// TELA DE BLOQUEIO TOTAL — TRIAL VENCIDO
// Substitui toda a página, sem botão de fechar
// ============================================
function renderTrialBloqueado(oficina) {
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                    background:linear-gradient(135deg,#0f172a,#1e293b);padding:24px;font-family:'Segoe UI',Tahoma,sans-serif;">
            <div style="max-width:520px;width:100%;text-align:center;">
                <div style="font-size:72px;margin-bottom:16px;">🔒</div>
                <h1 style="color:#fff;font-size:1.8rem;margin:0 0 8px;">Trial Encerrado</h1>
                <p style="color:#94a3b8;font-size:1.05rem;margin:0 0 8px;">
                    O período de trial da <strong style="color:#fff;">${oficina?.nome || 'sua oficina'}</strong> expirou.
                </p>
                <p style="color:#94a3b8;font-size:.95rem;margin:0 0 32px;">
                    Assine um plano para continuar usando o CheckAuto e não perder nenhum dado.
                </p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">
                    <button onclick="window._solicitarUpgradeBloqueio('MENSAL')"
                        style="padding:14px 24px;border:none;border-radius:12px;background:#2563eb;
                               color:#fff;font-weight:700;cursor:pointer;font-size:16px;">
                        📱 MENSAL — R$99,90/mês
                    </button>
                    <button onclick="window._solicitarUpgradeBloqueio('ANUAL')"
                        style="padding:14px 24px;border:none;border-radius:12px;background:#7c3aed;
                               color:#fff;font-weight:700;cursor:pointer;font-size:16px;">
                        🔥 ANUAL — R$999,90/ano
                    </button>
                </div>
                <p style="color:#64748b;font-size:.85rem;margin:0;">
                    Seus dados estão seguros e serão restaurados ao assinar.<br>
                    Dúvidas? <a href="https://wa.me/5531996766963" target="_blank"
                        style="color:#27ae60;">Fale conosco no WhatsApp</a>
                </p>
                <button onclick="window._logoutBloqueio()"
                    style="margin-top:20px;background:none;border:1px solid #334155;
                           color:#64748b;border-radius:8px;padding:8px 20px;cursor:pointer;font-size:13px;">
                    Sair da conta
                </button>
            </div>
        </div>
    `;
}

window._solicitarUpgradeBloqueio = function(plano) {
    const nome  = AppState.oficina?.nome  || '';
    const email = AppState.oficina?.email || '';
    const precos = { MENSAL: 'R$99,90/mês', ANUAL: 'R$999,90/ano' };
    const msg = [
        `💳 SOLICITAÇÃO DE UPGRADE — CheckAuto`,
        `🏢 Oficina: ${nome}`,
        `📧 Email: ${email}`,
        `🟢 Plano desejado: ${plano} ${precos[plano] || ''}`,
        `Por favor, me envie o link de pagamento.`
    ].join('\n');
    window.open(`https://wa.me/5531996766963?text=${encodeURIComponent(msg)}`, '_blank');
};

window._logoutBloqueio = async function() {
    await supabase.auth.signOut();
    localStorage.removeItem('checkauto_user');
    sessionStorage.removeItem('checkauto_user');
    window.location.href = 'login.html';
};

// ============================================
// POPUP TRIAL — MODAL CENTRALIZADO (trial ativo)
// ============================================
function renderTrialPopup(oficina) {
    if (document.getElementById('trialUpsellOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'trialUpsellOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(8,10,20,.82);z-index:999990;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:20px;max-width:780px;width:100%;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.4);font-family:Segoe UI,Tahoma,sans-serif;';
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;">
            <div>
                <h2 style="margin:0 0 6px;color:#111827;">🚀 ATIVE CHECKAUTO PRO JÁ!</h2>
                <p style="margin:0;color:#4b5563;font-size:1.1rem;">Transforme sua oficina em 2026!</p>
            </div>
            <button id="btnCloseTrialPopup" title="Fechar e continuar o trial"
                style="border:none;background:#eef2f7;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px;flex-shrink:0;">×</button>
        </div>
        <ul style="margin:16px 0 18px 18px;color:#1f2937;line-height:1.8;">
            <li>✅ Sem papel perdido</li>
            <li>✅ Reduz 70% tempo OS</li>
            <li>✅ Relatórios faturamento real-time</li>
            <li>✅ Estoque inteligente com alertas</li>
        </ul>
        <p style="margin:0 0 14px;font-size:13px;color:#6b7280;">Ao clicar, você será direcionado ao WhatsApp para finalizar sua assinatura.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button id="btnTrialMensal" style="padding:12px 16px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;font-size:15px;">📱 MENSAL R$99,90/mês</button>
            <button id="btnTrialAnual"  style="padding:12px 16px;border:none;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer;font-size:15px;">🔥 ANUAL R$999,90/ano</button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    document.getElementById('btnCloseTrialPopup')?.addEventListener('click', closeTrialPopup);
    document.getElementById('btnTrialMensal')?.addEventListener('click', () => solicitarUpgrade('MENSAL'));
    document.getElementById('btnTrialAnual')?.addEventListener('click',  () => solicitarUpgrade('ANUAL'));
}

// ============================================
// PRIMEIRO ACESSO — MODAL TROCA DE SENHA
// ============================================
function renderPrimeiroAcessoModal() {
    if (document.getElementById('primeiroAcessoOverlay')) return;
    _primeiroAcessoPendente = true;

    const overlay = document.createElement('div');
    overlay.id = 'primeiroAcessoOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:18px;max-width:420px;width:100%;padding:32px;box-shadow:0 24px 80px rgba(0,0,0,.5);font-family:'Segoe UI',Tahoma,sans-serif;">
            <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:8px;">🔐</div>
                <h2 style="margin:0 0 8px;color:#111827;font-size:1.4rem;">Bem-vindo ao CheckAuto!</h2>
                <p style="margin:0;color:#6b7280;font-size:.95rem;">Para continuar, crie sua senha pessoal.<br>Use algo seguro que só você saiba.</p>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Nova Senha</label>
                <div style="position:relative;">
                    <input id="paNovaSenha" type="password" placeholder="Mínimo 6 caracteres"
                        style="width:100%;padding:12px 40px 12px 14px;border:2px solid #d1d5db;border-radius:10px;font-size:15px;box-sizing:border-box;outline:none;transition:border-color .2s;"
                        onfocus="this.style.borderColor='#27ae60'" onblur="this.style.borderColor='#d1d5db'">
                    <button type="button" onclick="window._togglePaSenha('paNovaSenha','paEye1')"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;font-size:15px;">
                        <i id="paEye1" class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Confirmar Senha</label>
                <div style="position:relative;">
                    <input id="paConfirmarSenha" type="password" placeholder="Repita a senha"
                        style="width:100%;padding:12px 40px 12px 14px;border:2px solid #d1d5db;border-radius:10px;font-size:15px;box-sizing:border-box;outline:none;transition:border-color .2s;"
                        onfocus="this.style.borderColor='#27ae60'" onblur="this.style.borderColor='#d1d5db'">
                    <button type="button" onclick="window._togglePaSenha('paConfirmarSenha','paEye2')"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;font-size:15px;">
                        <i id="paEye2" class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div id="paMsgErro" style="display:none;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;color:#dc2626;font-size:13px;margin-bottom:14px;"></div>
            <button id="paBtnSalvar"
                style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;"
                onclick="window._salvarNovaSenha()">
                <i class="fas fa-check-circle"></i> Criar minha senha
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('paNovaSenha')?.focus(), 100);
    overlay.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') window._salvarNovaSenha(); });
    });
}

window._togglePaSenha = function(inputId, eyeId) {
    const inp = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    if (!inp) return;
    if (inp.type === 'password') { inp.type = 'text'; eye?.classList.replace('fa-eye','fa-eye-slash'); }
    else { inp.type = 'password'; eye?.classList.replace('fa-eye-slash','fa-eye'); }
};

window._salvarNovaSenha = async function() {
    const nova      = document.getElementById('paNovaSenha')?.value.trim();
    const confirmar = document.getElementById('paConfirmarSenha')?.value.trim();
    const msgErro   = document.getElementById('paMsgErro');
    const btn       = document.getElementById('paBtnSalvar');
    const mostrarErro = (msg) => { if (msgErro) { msgErro.textContent = msg; msgErro.style.display = 'block'; } };
    const limparErro  = () => { if (msgErro) msgErro.style.display = 'none'; };
    limparErro();
    if (!nova || nova.length < 6) { mostrarErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (nova !== confirmar)        { mostrarErro('As senhas não coincidem. Tente novamente.'); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    const { error: errAuth } = await supabase.auth.updateUser({ password: nova });
    if (errAuth) {
        mostrarErro('Erro ao salvar senha. Tente novamente.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Criar minha senha';
        return;
    }
    if (AppState.user?.id) {
        await supabase.from('usuarios').update({ primeiro_acesso: false }).eq('id', AppState.user.id);
    }
    _primeiroAcessoPendente = false;
    document.getElementById('primeiroAcessoOverlay')?.remove();
    btn.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Senha salva! Entrando...';
    setTimeout(() => window.location.reload(), 1200);
};

async function checkPrimeiroAcesso() {
    if (!AppState.user?.id) return false;
    const { data: usuario } = await supabase.from('usuarios').select('primeiro_acesso').eq('id', AppState.user.id).single();
    if (usuario && usuario.primeiro_acesso === true) { renderPrimeiroAcessoModal(); return true; }
    return false;
}

// ============================================
// VERIFICAR AUTENTICACAO
// ============================================
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        const { data: usuario, error } = await supabase
            .from('usuarios').select('id, nome, email, role, oficina_id').eq('id', session.user.id).single();
        if (error || !usuario) { console.warn('Usuario nao encontrado na tabela usuarios'); return false; }
        AppState.user = {
            id:         usuario.id,
            email:      usuario.email || session.user.email,
            nome:       usuario.nome  || session.user.email.split('@')[0],
            role:       usuario.role  || 'user',
            oficina_id: usuario.oficina_id,
            loginTime:  new Date().toISOString()
        };
        sessionStorage.setItem('checkauto_user', JSON.stringify(AppState.user));
        return true;
    } catch(e) { console.warn('Erro ao verificar sessao:', e); return false; }
}

// ============================================
// CARREGAR DADOS DO SUPABASE
// ============================================
function applyOficinaScope(query) {
    if (AppState.user?.role === 'superadmin') return query;
    const oficinaId = AppState.user?.oficina_id;
    if (!oficinaId) return query;
    return query.eq('oficina_id', oficinaId);
}

async function loadFromSupabase() {
    try {
        const [
            { data: clientes,          error: errC  },
            { data: veiculos,          error: errV  },
            { data: ordensServico,     error: errOS },
            { data: agendamentos,      error: errAG },
            { data: contasPagar,       error: errCP },
            { data: contasReceber,     error: errCR },
            { data: contasFixas,       error: errCF },
            { data: checklists,        error: errCK },
            { data: estoque,           error: errES },
            { data: movimentosEstoque, error: errME },
            { data: fornecedores,      error: errFO },
            { data: funcionarios,      error: errFU }
        ] = await Promise.all([
            applyOficinaScope(supabase.from('clientes').select('*')).order('nome'),
            applyOficinaScope(supabase.from('veiculos').select('*')).order('modelo'),
            applyOficinaScope(supabase.from('ordens_servico').select('*, os_servicos(*)')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('agendamentos').select('*')).order('data', { ascending: true }),
            applyOficinaScope(supabase.from('contas_pagar').select('*')).order('vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('contas_receber').select('*')).order('vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('contas_fixas').select('*')).order('dia_vencimento', { ascending: true }),
            applyOficinaScope(supabase.from('checklists').select('*')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('estoque').select('*')).order('nome'),
            applyOficinaScope(supabase.from('movimentos_estoque').select('*')).order('created_at', { ascending: false }),
            applyOficinaScope(supabase.from('fornecedores').select('*')).order('nome'),
            applyOficinaScope(supabase.from('usuarios').select('*')).order('nome')
        ]);
        if (errC)  throw errC;  if (errV)  throw errV;  if (errOS) throw errOS;
        if (errAG) throw errAG; if (errCP) throw errCP; if (errCR) throw errCR;
        if (errCF) throw errCF; if (errCK) throw errCK; if (errES) throw errES;
        if (errME) throw errME; if (errFO) throw errFO; if (errFU) throw errFU;

        AppState.data.clientes = clientes || [];
        AppState.data.veiculos = (veiculos || []).map(v => ({ ...v, clienteId: v.cliente_id }));
        AppState.data.ordensServico = (ordensServico || []).map(os => ({
            ...os, clienteId: os.cliente_id, veiculoId: os.veiculo_id,
            valorTotal: os.valor_total, dataConclusao: os.data_conclusao,
            servicos: (os.os_servicos || []).map(s => ({ id: s.id, descricao: s.descricao, valor: s.valor }))
        }));
        AppState.data.agendamentos = (agendamentos || []).map(a => ({
            ...a, clienteId: a.cliente_id, veiculoId: a.veiculo_id, tipoServico: a.tipo_servico
        }));
        AppState.data.contasPagar   = contasPagar || [];
        AppState.data.contasReceber = (contasReceber || []).map(c => ({
            ...c, osId: c.os_id, osNumero: c.os_numero, pagadorTipo: c.pagador_tipo,
            pagadorNome: c.pagador_nome, formaPagamento: c.forma_pagamento,
            parcelasTotal: c.parcelas_total, parcelasRecebidas: c.parcelas_recebidas, valorRecebido: c.valor_recebido
        }));
        AppState.data.contasFixas = (contasFixas || []).map(c => ({
            ...c, valorMensal: c.valor_mensal, diaVencimento: c.dia_vencimento, pagoEsteMes: c.pago_este_mes
        }));
        AppState.data.checklists        = checklists || [];
        AppState.data.estoque           = estoque || [];
        AppState.data.movimentosEstoque = movimentosEstoque || [];
        AppState.data.fornecedores      = fornecedores || [];
        AppState.data.funcionarios      = (funcionarios || []).map(f => ({ ...f, comissao: Number(f.comissao || 0) }));
        console.log('Dados carregados:', { clientes: AppState.data.clientes.length, os: AppState.data.ordensServico.length });
    } catch (e) {
        console.error('Erro ao carregar dados do Supabase:', e);
        showToast('Erro ao carregar dados! Verifique a conexao.', 'error');
    }
}

function saveToLocalStorage() {}
function loadFromLocalStorage() {}
function getTodayISODate() { return new Date().toISOString().slice(0, 10); }
function shouldShowTrialPopupToday(oficinaId) {
    const key = `checkauto_trial_popup_last_${oficinaId}`;
    const today = getTodayISODate();
    if (localStorage.getItem(key) === today) return false;
    localStorage.setItem(key, today);
    return true;
}

// ============================================
// VERIFICA TRIAL E BLOQUEIA SE VENCIDO
// ============================================
async function enforceTrialAndPopup() {
    const oficinaId = AppState.user?.oficina_id;
    if (!oficinaId) return;

    const plano    = String(AppState.oficina?.plano || 'TRIAL').toUpperCase();
    const trialAte = AppState.oficina?.trial_ate;
    const hoje     = new Date();

    // Verifica se trial venceu
    const trialVencido = plano === 'TRIAL' && trialAte && new Date(trialAte) < hoje;

    if (trialVencido) {
        // Atualiza status no banco
        await supabase.from('oficinas').update({ status: 'vencido' }).eq('id', oficinaId);
        AppState.oficina.status = 'vencido';
        // Bloqueia a tela completamente
        renderTrialBloqueado(AppState.oficina);
        return;
    }

    // Trial ativo — mostra popup uma vez por dia
    if (plano === 'TRIAL' && shouldShowTrialPopupToday(oficinaId)) {
        renderTrialPopup(AppState.oficina);
    }
    // Banner discreto sempre visível
    if (plano === 'TRIAL') renderTrialCountdownBanner();
}

function applyOficinaStatusGate() {
    const status = AppState.oficina?.status;
    if (status !== 'pendente' && status !== 'rejeitado') return false;
    const messages = {
        pendente:  'Sua oficina está aguardando aprovação. Em breve você receberá uma confirmação.',
        rejeitado: 'Seu cadastro foi rejeitado. Entre em contato com o suporte.'
    };
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fb;padding:24px;">
            <div style="max-width:680px;width:100%;background:#fff;border-radius:12px;box-shadow:0 6px 30px rgba(0,0,0,.08);padding:32px;text-align:center;">
                <h1 style="margin:0 0 12px;font-size:1.6rem;color:#1f2937;">CheckAuto</h1>
                <p style="margin:0;font-size:1.05rem;color:#4b5563;">${messages[status]}</p>
            </div>
        </div>
    `;
    return true;
}

// ============================================
// INICIALIZACAO
// ============================================
async function initApp() {
    console.log('Iniciando CheckAuto...');
    const autenticado = await checkAuth();
    if (!autenticado) { window.location.href = 'login.html'; return; }
    if (typeof carregarOficinaDoDB === 'function') {
        try {
            const oficina = await carregarOficinaDoDB();
            if (oficina && typeof aplicarWhiteLabel === 'function') {
                aplicarWhiteLabel(oficina);
                AppState.oficina = Object.assign({}, AppState.oficina, {
                    id:        oficina.id,
                    status:    oficina.status,
                    plano:     oficina.plano     || 'TRIAL',
                    trial_ate: oficina.trial_ate || null,
                    created_at: oficina.created_at || null
                });
            }
        } catch(e) { console.warn('Nao foi possivel carregar oficina no boot:', e); }
    }
    if (applyOficinaStatusGate()) return;
    const isPrimeiroAcesso = await checkPrimeiroAcesso();
    if (isPrimeiroAcesso) return;
    await loadFromSupabase();
    await enforceTrialAndPopup();
    if (AppState.oficina?.status === 'vencido') return; // ja bloqueou
    updateDashboard(); updateOficinaNome(); renderRecentOS(); updateUserInfo();
    renderClientes(); renderVeiculos(); renderOrdensServico();
    if (typeof initFinanceiro === 'function') { try { await initFinanceiro(); } catch(e) { console.error('Erro financeiro:', e); } }
    if (typeof setupDashboardCards === 'function') setupDashboardCards();
    if (typeof initPR13Tabs === 'function') initPR13Tabs();
    document.querySelectorAll('.nav-item').forEach(link => { link.addEventListener('click', (e) => e.preventDefault()); });
    console.log('CheckAuto inicializado!');
}

function updateUserInfo() {
    if (!AppState.user) return;
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    if (userNameEl) userNameEl.textContent = AppState.user.nome;
    if (userRoleEl) userRoleEl.textContent = AppState.user.role;
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (activeLink) activeLink.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        AppState.currentPage = page;
        if (page === 'ordens-servico') renderOrdensServico();
        else if (page === 'agendamento') renderAgendamentos();
        else if (typeof renderPR13Page === 'function') renderPR13Page(page);
        else if (page === 'financeiro' && typeof renderFinanceiroDashboard === 'function') {
            renderFinanceiroDashboard(); renderContasPagar(); renderContasReceber(); renderContasFixas(); renderFluxoCaixa();
        }
        if (page === 'configuracoes' && typeof initConfiguracoes === 'function') initConfiguracoes();
    }
    if (window.innerWidth <= 768) toggleSidebar();
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
    document.getElementById('sidebarOverlay')?.classList.toggle('active');
}

function updateDashboard() {
    const { ordensServico, clientes, veiculos, agendamentos } = AppState.data;
    const el = (id) => document.getElementById(id);
    if (el('osAbertas'))     el('osAbertas').textContent     = ordensServico.filter(os => os.status !== 'concluida').length;
    if (el('osHoje'))        el('osHoje').textContent        = ordensServico.filter(os => isToday(os.data)).length;
    if (el('totalClientes')) el('totalClientes').textContent = clientes.length;
    if (el('totalVeiculos')) el('totalVeiculos').textContent = veiculos.length;
    const totalReceber = (AppState.data.contasReceber || []).filter(c => ['aberta','parcial','atrasada','pendente'].includes(c.status || 'aberta')).reduce((sum, c) => sum + Math.max(0, Number(c.valor||0) - Number(c.valorRecebido||c.valor_recebido||0)), 0);
    const totalPagar   = (AppState.data.contasPagar   || []).filter(c => ['aberta','atrasada','pendente'].includes(c.status || 'aberta')).reduce((sum, c) => sum + Number(c.valor||0), 0);
    const totalFixas   = (AppState.data.contasFixas   || []).filter(c => !(c.pagoEsteMes||c.pago_este_mes)).reduce((sum, c) => sum + Number(c.valorMensal||c.valor_mensal||0), 0);
    if (el('contasReceber'))    el('contasReceber').textContent    = formatMoney(totalReceber);
    if (el('contasPagar'))      el('contasPagar').textContent      = formatMoney(totalPagar + totalFixas);
    if (el('agendamentosHoje')) el('agendamentosHoje').textContent = (agendamentos||[]).filter(a => isToday(a.data) && a.status !== 'atendido').length;
    const faturamento = ordensServico.filter(os => isCurrentMonth(os.data) && os.status === 'concluida').reduce((sum, os) => sum + Number(os.valorTotal||os.valor_total||0), 0);
    if (el('faturamentoMes')) el('faturamentoMes').textContent = formatMoney(faturamento);
}

function renderRecentOS() {
    const tbody = document.getElementById('recentOSTable');
    if (!tbody) return;
    const list = AppState.data.ordensServico.slice(0, 5);
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma OS registrada ainda</td></tr>'; return; }
    tbody.innerHTML = list.map(os => `
        <tr>
            <td><strong>${os.numero}</strong></td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td>${getStatusBadge(os.status)}</td>
            <td>${formatDate(os.data)}</td>
            <td><button class="btn-icon" onclick="viewOS('${os.id}')" title="Ver"><i class="fas fa-eye"></i></button></td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const badges = { 'aguardando':'<span class="badge badge-warning">Aguardando</span>', 'em_andamento':'<span class="badge badge-info">Em Andamento</span>', 'concluida':'<span class="badge badge-success">Concluida</span>', 'cancelada':'<span class="badge badge-danger">Cancelada</span>' };
    return badges[status] || status;
}

function updateOficinaNome() {
    const nome      = AppState.oficina.nomeExibicao || AppState.oficina.nome_exibicao || AppState.oficina.nome || 'CheckAuto';
    const subtitulo = AppState.oficina.subtitulo || 'Sistema de Gestao';
    const el = id => document.getElementById(id);
    if (el('oficinaNome'))        el('oficinaNome').textContent        = nome;
    if (el('sidebarNomeSistema')) el('sidebarNomeSistema').textContent = nome;
    if (el('oficinaSubtitulo'))   el('oficinaSubtitulo').textContent   = subtitulo;
}

async function logout() {
    if (!confirm('Deseja realmente sair?')) return;
    await supabase.auth.signOut();
    localStorage.removeItem('checkauto_user');
    sessionStorage.removeItem('checkauto_user');
    window.location.href = 'login.html';
}

function formatMoney(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0); }
function formatDate(dateString) { if (!dateString) return '-'; return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR'); }
function isToday(dateString) { if (!dateString) return false; return new Date(dateString + 'T00:00:00').toDateString() === new Date().toDateString(); }
function isCurrentMonth(dateString) { if (!dateString) return false; const d = new Date(dateString + 'T00:00:00'), t = new Date(); return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); }
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = { success:'#27ae60', error:'#e74c3c', info:'#3498db', warning:'#f39c12' };
    Object.assign(toast.style, { position:'fixed', bottom:'70px', right:'20px', padding:'12px 20px', borderRadius:'8px', color:'#fff', fontWeight:'500', zIndex:'9999', background: colors[type] || colors.info });
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

window.AppState = AppState; window.supabase = supabase;
window.formatMoney = formatMoney; window.formatDate = formatDate;
window.isToday = isToday; window.isCurrentMonth = isCurrentMonth;
window.saveToLocalStorage = saveToLocalStorage; window.loadFromSupabase = loadFromSupabase;
window.navigateTo = navigateTo; window.toggleSidebar = toggleSidebar;
window.logout = logout; window.getStatusBadge = getStatusBadge;
window.updateDashboard = updateDashboard; window.renderRecentOS = renderRecentOS;
window.updateOficinaNome = updateOficinaNome; window.showToast = showToast;

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); }
else { initApp(); }
