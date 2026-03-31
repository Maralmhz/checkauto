// ============================================
// ONBOARDING — BOAS-VINDAS E INSTRUÇÕES
// Aparece em 3 momentos:
//   1. Primeiro acesso TRIAL
//   2. Primeiro acesso após ativar plano MENSAL
//   3. Primeiro acesso após ativar plano ANUAL
// Controlado por oficinas.onboarding_visto
// ============================================

// ----------- DADOS DE CONTEÚDO -----------
const ONBOARDING_STEPS = [
  {
    icon: '🚗',
    titulo: 'Cadastre seus clientes e veículos',
    desc: 'No menu lateral, acesse <strong>Clientes</strong> para cadastrar o cliente, depois <strong>Veículos</strong> para vincular o carro a ele. Isso agiliza toda abertura de OS.',
  },
  {
    icon: '🔧',
    titulo: 'Abra sua primeira Ordem de Serviço',
    desc: 'Vá em <strong>Ordens de Serviço</strong> → botão <strong>Nova OS</strong>. Selecione o cliente, veículo, adicione os serviços e salve. A OS recebe um número automático.',
  },
  {
    icon: '📋',
    titulo: 'Use o Checklist no recebimento',
    desc: 'Em <strong>Checklists</strong>, registre o estado do veículo ao receber (riscos, avarias, nível de combustível). Isso protege você e o cliente.',
  },
  {
    icon: '💰',
    titulo: 'Acompanhe o financeiro',
    desc: 'No módulo <strong>Financeiro</strong> você vê contas a receber, a pagar, contas fixas e o fluxo de caixa do mês em tempo real.',
  },
  {
    icon: '📦',
    titulo: 'Controle seu estoque',
    desc: 'Cadastre peças em <strong>Estoque</strong>. O sistema alerta quando o item estiver abaixo do mínimo e registra toda movimentação de entrada e saída.',
  },
  {
    icon: '⚙️',
    titulo: 'Personalize sua oficina',
    desc: 'Vá em <strong>Configurações</strong> para adicionar logo, cor, endereço, telefone e texto do rodapé do PDF. Essas informações aparecem em todas as OS impressas.',
  },
];

const ONBOARDING_PERSONALIZAR = [
  { icon: '🖼️', label: 'Logo',       desc: 'Configurações → aba Aparência → botão Alterar Logo' },
  { icon: '🎨', label: 'Cor',        desc: 'Configurações → aba Aparência → Cor Principal' },
  { icon: '🏢', label: 'Nome/Endereço', desc: 'Configurações → aba Dados da Oficina' },
  { icon: '📄', label: 'Rodapé PDF', desc: 'Configurações → aba Aparência → Texto do Rodapé' },
  { icon: '👥', label: 'Funcionários', desc: 'Menu lateral → Funcionários → Novo Funcionário' },
  { icon: '📅', label: 'Agendamentos', desc: 'Menu lateral → Agendamentos → marque datas e serviços' },
];

// ----------- HELPERS -----------
function _obStyle(extra = '') {
  return `font-family:'Segoe UI',Tahoma,sans-serif;${extra}`;
}

function _fecharOnboarding(overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;
  el.style.transition = 'opacity .25s';
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 260);
}

async function _marcarOnboardingVisto(tipo) {
  const oficinaId = window.getCurrentOficinaId?.() || window.AppState?.oficina?.id;
  if (!oficinaId) return;
  const sb = window._supabase || window.supabase;
  if (!sb) return;
  await sb.from('oficinas').update({ onboarding_visto: tipo }).eq('id', oficinaId);
  if (window.AppState?.oficina) window.AppState.oficina.onboarding_visto = tipo;
}

// ----------- MODAL TRIAL -----------
function renderOnboardingTrial() {
  if (document.getElementById('obTrialOverlay')) return;

  let stepAtual = 0;
  const total = ONBOARDING_STEPS.length;

  const overlay = document.createElement('div');
  overlay.id = 'obTrialOverlay';
  overlay.style.cssText = _obStyle(
    'position:fixed;inset:0;background:rgba(8,10,20,.88);z-index:999995;'
    + 'display:flex;align-items:center;justify-content:center;padding:20px;'
    + 'opacity:0;transition:opacity .25s;'
  );

  function _html(step) {
    const s = ONBOARDING_STEPS[step];
    const dots = ONBOARDING_STEPS.map((_, i) =>
      `<span style="width:8px;height:8px;border-radius:50%;display:inline-block;margin:0 3px;
        background:${i === step ? '#27ae60' : '#d1d5db'};"></span>`
    ).join('');
    const isUltimo = step === total - 1;
    return `
      <div style="background:#fff;border-radius:20px;max-width:540px;width:100%;padding:36px 32px 28px;
                  box-shadow:0 24px 80px rgba(0,0,0,.45);${_obStyle()}">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <div>
            <span style="font-size:11px;font-weight:700;color:#27ae60;text-transform:uppercase;letter-spacing:1px;">Guia de início rápido</span>
            <h2 style="margin:4px 0 0;font-size:1.35rem;color:#111827;">Bem-vindo ao CheckAuto! 🎉</h2>
          </div>
          <button onclick="window._obFecharTrial()" title="Pular guia"
            style="border:none;background:#f3f4f6;border-radius:50%;width:34px;height:34px;
                   cursor:pointer;font-size:18px;color:#6b7280;flex-shrink:0;">×</button>
        </div>
        <!-- Step -->
        <div style="background:#f0fdf4;border-radius:14px;padding:24px;margin-bottom:20px;min-height:110px;">
          <div style="font-size:42px;margin-bottom:10px;">${s.icon}</div>
          <h3 style="margin:0 0 8px;color:#111827;font-size:1.1rem;">${s.titulo}</h3>
          <p style="margin:0;color:#4b5563;font-size:.95rem;line-height:1.6;">${s.desc}</p>
        </div>
        <!-- Dots -->
        <div style="text-align:center;margin-bottom:20px;">${dots}</div>
        <!-- Personalizar rápido (só no último step) -->
        ${ isUltimo ? `
          <div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 10px;font-weight:600;color:#1e40af;font-size:.9rem;">⚙️ Como personalizar sua oficina:</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              ${ONBOARDING_PERSONALIZAR.map(p =>
                `<div style="font-size:.82rem;color:#374151;"><strong>${p.icon} ${p.label}:</strong><br><span style="color:#6b7280;">${p.desc}</span></div>`
              ).join('')}
            </div>
          </div>` : '' }
        <!-- Botões -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <button onclick="window._obTrialAnterior()" ${ step === 0 ? 'disabled' : '' }
            style="padding:10px 20px;border:1px solid #d1d5db;border-radius:10px;background:#fff;
                   color:#374151;font-size:14px;cursor:pointer;${step===0?'opacity:.4;cursor:default;':''}">
            ← Anterior
          </button>
          <span style="font-size:12px;color:#9ca3af;">${step + 1} / ${total}</span>
          <button onclick="${ isUltimo ? 'window._obFecharTrial()' : 'window._obTrialProximo()' }"
            style="padding:10px 24px;border:none;border-radius:10px;
                   background:${ isUltimo ? '#27ae60' : '#2563eb' };
                   color:#fff;font-size:14px;font-weight:700;cursor:pointer;">
            ${ isUltimo ? '✅ Entendido, vamos lá!' : 'Próximo →' }
          </button>
        </div>
      </div>
    `;
  }

  overlay.innerHTML = _html(0);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  window._obTrialProximo = function() {
    if (stepAtual < total - 1) { stepAtual++; overlay.innerHTML = _html(stepAtual); }
  };
  window._obTrialAnterior = function() {
    if (stepAtual > 0) { stepAtual--; overlay.innerHTML = _html(stepAtual); }
  };
  window._obFecharTrial = async function() {
    _fecharOnboarding('obTrialOverlay');
    await _marcarOnboardingVisto('trial');
  };
}

// ----------- MODAL PLANO PAGO (MENSAL/ANUAL) -----------
function renderOnboardingPlano(plano) {
  if (document.getElementById('obPlanoOverlay')) return;
  const isAnual = String(plano).toUpperCase() === 'ANUAL';

  const overlay = document.createElement('div');
  overlay.id = 'obPlanoOverlay';
  overlay.style.cssText = _obStyle(
    'position:fixed;inset:0;background:rgba(8,10,20,.88);z-index:999995;'
    + 'display:flex;align-items:center;justify-content:center;padding:20px;'
    + 'opacity:0;transition:opacity .25s;'
  );

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;max-width:600px;width:100%;padding:36px 32px 28px;
                box-shadow:0 24px 80px rgba(0,0,0,.45);${_obStyle()}">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;">
        <div>
          <span style="font-size:11px;font-weight:700;color:${ isAnual ? '#7c3aed' : '#2563eb' };
                       text-transform:uppercase;letter-spacing:1px;">
            ${ isAnual ? '🔥 Plano Anual ativado!' : '📱 Plano Mensal ativado!' }
          </span>
          <h2 style="margin:4px 0 0;font-size:1.4rem;color:#111827;">Acesso completo liberado! 🚀</h2>
          <p style="margin:6px 0 0;color:#6b7280;font-size:.95rem;">Aproveite todos os recursos sem limitação.</p>
        </div>
        <button onclick="window._obFecharPlano()" title="Fechar"
          style="border:none;background:#f3f4f6;border-radius:50%;width:34px;height:34px;
                 cursor:pointer;font-size:18px;color:#6b7280;flex-shrink:0;">×</button>
      </div>

      <!-- O que você pode fazer -->
      <div style="background:#f0fdf4;border-radius:14px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-weight:700;color:#166534;">✅ O que você pode fazer agora:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${ ONBOARDING_STEPS.map(s =>
            `<div style="display:flex;gap:8px;align-items:start;">
              <span style="font-size:20px;flex-shrink:0;">${s.icon}</span>
              <div>
                <div style="font-size:.85rem;font-weight:600;color:#111827;">${s.titulo}</div>
                <div style="font-size:.78rem;color:#6b7280;margin-top:2px;">${s.desc.replace(/<[^>]+>/g,'')}</div>
              </div>
            </div>`
          ).join('') }
        </div>
      </div>

      <!-- Personalização -->
      <div style="background:#eff6ff;border-radius:14px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:700;color:#1e40af;">⚙️ Personalize agora:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${ ONBOARDING_PERSONALIZAR.map(p =>
            `<div style="font-size:.82rem;color:#374151;">
              <strong>${p.icon} ${p.label}:</strong><br>
              <span style="color:#6b7280;">${p.desc}</span>
            </div>`
          ).join('') }
        </div>
      </div>

      <!-- Botão fechar -->
      <button onclick="window._obFecharPlano()"
        style="width:100%;padding:14px;border:none;border-radius:12px;
               background:linear-gradient(135deg,${ isAnual ? '#7c3aed,#6d28d9' : '#2563eb,#1d4ed8' });
               color:#fff;font-size:16px;font-weight:700;cursor:pointer;">
        ✅ Entendido — acessar o sistema
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  window._obFecharPlano = async function() {
    _fecharOnboarding('obPlanoOverlay');
    await _marcarOnboardingVisto('plano');
  };
}

// ============================================
// FUNÇÃO PRINCIPAL — chamar no initApp()
// Deve ser chamada APÓS enforceTrialAndPopup()
// ============================================
async function checkOnboarding() {
  const oficina = window.AppState?.oficina;
  if (!oficina) return;

  const plano   = String(oficina.plano || 'TRIAL').toUpperCase();
  const visto   = oficina.onboarding_visto || null;
  const status  = String(oficina.status || '').toLowerCase();

  // Não mostrar se bloqueado
  if (status === 'vencido' || status === 'pendente' || status === 'rejeitado') return;

  // Trial: mostrar se nunca viu nada
  if (plano === 'TRIAL' && !visto) {
    renderOnboardingTrial();
    return;
  }

  // Plano pago: mostrar se nunca viu o modal de plano
  if ((plano === 'MENSAL' || plano === 'ANUAL') && visto !== 'plano') {
    renderOnboardingPlano(plano);
    return;
  }
}

window.checkOnboarding    = checkOnboarding;
window.renderOnboardingTrial = renderOnboardingTrial;
window.renderOnboardingPlano = renderOnboardingPlano;
