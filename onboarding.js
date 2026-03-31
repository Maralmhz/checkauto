// ============================================================
// ONBOARDING — Modal de boas-vindas com instruções de uso
// Disparado em 3 momentos:
//   1. Primeiro acesso Trial    (após criar senha)
//   2. Primeiro acesso Mensal   (logo após upgrade)
//   3. Primeiro acesso Anual    (logo após upgrade)
// Controle via campo onboarding_visto na tabela oficinas
// ============================================================

// ----------------------------------------------------------
// Conteúdo de cada passo por contexto
// ----------------------------------------------------------
const ONBOARDING_PASSOS = [
    {
        icon: '🎉',
        titulo: 'Bem-vindo ao CheckAuto!',
        descricao: 'Em poucos passos você vai conhecer tudo que o sistema oferece para transformar sua oficina.',
        dica: null
    },
    {
        icon: '📋',
        titulo: 'Ordens de Serviço',
        descricao: 'Abra, gerencie e conclua OS com rapidez. Cada OS gera automaticamente uma conta a receber no Financeiro.',
        dica: '💡 Dica: no menu lateral clique em <strong>Ordens de Serviço</strong> → botão <strong>Nova OS</strong>.'
    },
    {
        icon: '👥',
        titulo: 'Clientes & Veículos',
        descricao: 'Cadastre clientes e vincule seus veículos. Todo histórico de atendimentos fica salvo por placa.',
        dica: '💡 Dica: use o menu <strong>Clientes</strong> e depois <strong>Veículos</strong>.'
    },
    {
        icon: '📅',
        titulo: 'Agendamentos',
        descricao: 'Programe atendimentos e visualize a agenda do dia. Reduza filas e atrasos na sua oficina.',
        dica: '💡 Dica: menu <strong>Agendamento</strong> → <strong>Novo Agendamento</strong>.'
    },
    {
        icon: '💰',
        titulo: 'Financeiro',
        descricao: 'Acompanhe contas a pagar, a receber, contas fixas e o fluxo de caixa — tudo em tempo real.',
        dica: '💡 Dica: menu <strong>Financeiro</strong> para ver o painel completo.'
    },
    {
        icon: '📦',
        titulo: 'Estoque',
        descricao: 'Controle peças e insumos com alertas de estoque mínimo. Evite faltar produto na hora errada.',
        dica: '💡 Dica: menu <strong>Estoque</strong> → cadastre itens e defina o mínimo.'
    },
    {
        icon: '⚙️',
        titulo: 'Personalize sua Oficina',
        descricao: 'Configure o nome, logo, cor do sistema e informações de contato para deixar o CheckAuto com a cara da sua oficina.',
        dica: '💡 Dica: menu <strong>Configurações</strong> → edite nome, logo, cor e muito mais.'
    }
];

// ----------------------------------------------------------
// Textos do cabeçalho por contexto de plano
// ----------------------------------------------------------
function _onboardingContexto() {
    const plano = String(window.AppState?.oficina?.plano || 'TRIAL').toUpperCase();
    if (plano === 'MENSAL') return {
        badge:    '🟢 Plano Mensal Ativo',
        cor:      '#2563eb',
        intro:    'Seu plano Mensal está ativo! Aproveite todos os recursos sem limitação.'
    };
    if (plano === 'ANUAL') return {
        badge:    '🔥 Plano Anual Ativo',
        cor:      '#7c3aed',
        intro:    'Parabéns! Você ativou o plano Anual e ganhou o melhor custo-benefício do CheckAuto.'
    };
    return {
        badge:    '🚀 Trial Iniciado',
        cor:      '#27ae60',
        intro:    'Seu período de trial está ativo. Explore sem limitações e conheça tudo que o sistema oferece!'
    };
}

// ----------------------------------------------------------
// Renderização principal
// ----------------------------------------------------------
function renderOnboardingModal() {
    if (document.getElementById('onboardingOverlay')) return;

    const ctx    = _onboardingContexto();
    const total  = ONBOARDING_PASSOS.length;
    let   passo  = 0;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'background:rgba(8,10,20,.88)',
        'z-index:9999999', 'display:flex', 'align-items:center', 'justify-content:center',
        'padding:20px', 'opacity:0', 'transition:opacity .3s'
    ].join(';');

    // Card
    const card = document.createElement('div');
    card.id = 'onboardingCard';
    card.style.cssText = [
        'background:#fff', 'border-radius:20px', 'max-width:520px', 'width:100%',
        'padding:32px', 'box-shadow:0 24px 80px rgba(0,0,0,.45)',
        "font-family:'Segoe UI',Tahoma,sans-serif", 'position:relative'
    ].join(';');

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    function renderPasso() {
        const p = ONBOARDING_PASSOS[passo];
        const isUltimo = passo === total - 1;
        const progresso = Math.round(((passo + 1) / total) * 100);

        card.innerHTML = `
            <!-- Badge plano -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <span style="background:${ctx.cor}1a;color:${ctx.cor};border-radius:20px;
                    padding:4px 14px;font-size:12px;font-weight:700;">${ctx.badge}</span>
                <span style="font-size:12px;color:#9ca3af;">${passo + 1} de ${total}</span>
            </div>

            <!-- Barra de progresso -->
            <div style="background:#e5e7eb;border-radius:99px;height:5px;margin-bottom:24px;">
                <div style="background:${ctx.cor};height:5px;border-radius:99px;
                    width:${progresso}%;transition:width .35s ease;"></div>
            </div>

            <!-- Ícone + título -->
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:56px;line-height:1;margin-bottom:12px;">${p.icon}</div>
                <h2 style="margin:0 0 10px;color:#111827;font-size:1.4rem;">${p.titulo}</h2>
                <p style="margin:0;color:#4b5563;font-size:.97rem;line-height:1.6;">${p.descricao}</p>
            </div>

            <!-- Dica -->
            ${p.dica ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:12px 16px;font-size:13px;color:#166534;margin-bottom:20px;line-height:1.5;">
                ${p.dica}
            </div>
            ` : '<div style="margin-bottom:20px;"></div>'}

            <!-- Intro contexto (apenas passo 0) -->
            ${passo === 0 ? `
            <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;
                font-size:13px;color:#475569;margin-bottom:20px;text-align:center;">
                ${ctx.intro}
            </div>
            ` : ''}

            <!-- Botões navegação -->
            <div style="display:flex;gap:10px;">
                ${passo > 0 ? `
                <button id="btnOnbAnterior"
                    style="flex:1;padding:12px;border:2px solid #e5e7eb;background:#fff;
                           color:#374151;border-radius:10px;font-size:15px;
                           font-weight:600;cursor:pointer;">
                    ← Anterior
                </button>
                ` : ''}
                <button id="btnOnbProximo"
                    style="flex:2;padding:12px;border:none;
                           background:${ctx.cor};
                           color:#fff;border-radius:10px;font-size:15px;
                           font-weight:700;cursor:pointer;
                           box-shadow:0 4px 14px ${ctx.cor}55;">
                    ${isUltimo ? '✅ Vamos começar!' : 'Próximo →'}
                </button>
            </div>

            <!-- Pular (passos intermediários) -->
            ${!isUltimo ? `
            <div style="text-align:center;margin-top:12px;">
                <button id="btnOnbPular"
                    style="background:none;border:none;color:#9ca3af;cursor:pointer;
                           font-size:12px;text-decoration:underline;">Pular tour</button>
            </div>
            ` : ''}
        `;

        document.getElementById('btnOnbProximo')?.addEventListener('click', () => {
            if (isUltimo) { _fecharOnboarding(); return; }
            passo++;
            renderPasso();
        });
        document.getElementById('btnOnbAnterior')?.addEventListener('click', () => {
            if (passo > 0) { passo--; renderPasso(); }
        });
        document.getElementById('btnOnbPular')?.addEventListener('click', () => _fecharOnboarding());
    }

    renderPasso();
}

// ----------------------------------------------------------
// Fechar e marcar onboarding_visto no banco
// ----------------------------------------------------------
async function _fecharOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
    try {
        const sb  = window.supabase;
        const oid = window.getCurrentOficinaId ? window.getCurrentOficinaId() : null;
        if (sb && oid) {
            await sb.from('oficinas').update({ onboarding_visto: true }).eq('id', oid);
            if (window.AppState?.oficina) window.AppState.oficina.onboarding_visto = true;
        }
    } catch(e) { console.warn('Erro ao marcar onboarding_visto:', e); }
}

// ----------------------------------------------------------
// Verificar se deve exibir o onboarding
// Retorna true se exibiu, false se não era necessário
// ----------------------------------------------------------
async function checkOnboarding() {
    try {
        const sb  = window.supabase;
        const oid = window.getCurrentOficinaId ? window.getCurrentOficinaId() : null;
        if (!sb || !oid) return false;
        const { data } = await sb.from('oficinas').select('onboarding_visto').eq('id', oid).single();
        if (data && data.onboarding_visto === true) return false;
        renderOnboardingModal();
        return true;
    } catch(e) {
        console.warn('Erro ao verificar onboarding:', e);
        return false;
    }
}

// ----------------------------------------------------------
// Expõe para o app.js
// ----------------------------------------------------------
window.checkOnboarding    = checkOnboarding;
window.renderOnboardingModal = renderOnboardingModal;
