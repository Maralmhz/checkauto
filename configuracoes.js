// ============================================
// CONFIGURACOES DA OFICINA — Supabase
// ============================================
async function _getSupabaseCfg() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient('https://hefpzigrxyyhvtgkyspr.supabase.co','sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk');
    return window._supabase;
}

function aplicarMascaraCNPJ(input) {
    var v = (input.value||'').replace(/\D/g,'').slice(0,14);
    v = v.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
    input.value = v;
}
function aplicarMascaraTelefone(input) {
    var v = (input.value||'').replace(/\D/g,'').slice(0,11);
    if (v.length<=10) v=v.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2');
    else v=v.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2');
    input.value = v;
}
function calcularHoverColor(hex) {
    if (!hex||!/^#[0-9a-f]{6}$/i.test(hex)) return '#219a52';
    const r=Math.max(0,parseInt(hex.slice(1,3),16)-20);
    const g=Math.max(0,parseInt(hex.slice(3,5),16)-20);
    const b=Math.max(0,parseInt(hex.slice(5,7),16)-20);
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

async function carregarOficinaDoDB() {
    try {
        const sb = await _getSupabaseCfg();
        const oficina_id = window.AppState?.user?.oficina_id;
        if (!oficina_id) return null;
        const { data, error } = await sb.from('oficinas').select('*').eq('id', oficina_id).single();
        if (error) { console.error('Erro ao carregar oficina:', error); return null; }
        return data;
    } catch(e) { console.error(e); return null; }
}

function aplicarWhiteLabel(oficina) {
    if (!oficina) return;
    AppState.oficina = Object.assign({}, AppState.oficina, {
        nome:              oficina.nome           || 'Minha Oficina',
        nomeExibicao:      oficina.nome_exibicao  || oficina.nome || 'CheckAuto',
        subtitulo:         oficina.subtitulo      || 'Sistema de Gestao',
        cnpj:              oficina.cnpj           || '',
        endereco:          oficina.endereco       || '',
        telefone:          oficina.telefone       || '',
        telefoneWA:        oficina.telefone_whatsapp  || false,
        telefone2:         oficina.telefone2      || '',
        telefone2WA:       oficina.telefone2_whatsapp || false,
        email:             oficina.email          || '',
        site:              oficina.site           || '',
        corPrimaria:       oficina.cor_primaria   || '#27ae60',
        rodapePDF:         oficina.rodape_pdf     || 'Obrigado pela preferencia!',
        logo:              oficina.logo_url       || ''
    });
    const cor = AppState.oficina.corPrimaria;
    document.documentElement.style.setProperty('--primary-color', cor);
    document.documentElement.style.setProperty('--primary-hover', calcularHoverColor(cor));
    document.title = AppState.oficina.nomeExibicao;
    if (typeof updateOficinaNome === 'function') updateOficinaNome();
    const logoSrc = AppState.oficina.logo || 'logo-default.png';
    document.querySelectorAll('.navbar-logo, .sidebar-logo-img').forEach(img => {
        img.src = logoSrc;
        img.onerror = () => { img.src = 'logo-default.png'; };
    });
}

async function initConfiguracoes() {
    // Mascaras
    const cnpjInput = document.getElementById('cfgCnpj');
    if (cnpjInput && !cnpjInput.dataset.maskBound) {
        cnpjInput.addEventListener('input', () => aplicarMascaraCNPJ(cnpjInput));
        cnpjInput.dataset.maskBound = '1';
    }
    ['cfgTelefone','cfgTelefone2'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.maskBound) {
            el.addEventListener('input', () => aplicarMascaraTelefone(el));
            el.dataset.maskBound = '1';
        }
    });

    // Upload logo — base64 (max 500kb)
    const logoInput = document.getElementById('cfgLogo');
    if (logoInput && !logoInput.dataset.bound) {
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 500*1024) { showToast('Logo muito grande! Max 500KB.','warning'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                AppState.oficina.logo = ev.target.result;
                const preview = document.getElementById('cfgLogoPreview');
                if (preview) preview.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
        logoInput.dataset.bound = '1';
    }

    const oficina = await carregarOficinaDoDB();
    if (oficina) { aplicarWhiteLabel(oficina); loadConfiguracoes(); }
}

function loadConfiguracoes() {
    const o = AppState.oficina || {};
    const map = {
        cfgNomeOficina:  o.nome         || '',
        cfgNomeExibicao: o.nomeExibicao || '',
        cfgCnpj:         o.cnpj         || '',
        cfgEndereco:     o.endereco     || '',
        cfgTelefone:     o.telefone     || '',
        cfgTelefone2:    o.telefone2    || '',
        cfgEmail:        o.email        || '',
        cfgSite:         o.site         || '',
        cfgCorPrimaria:  o.corPrimaria  || '#27ae60',
        cfgRodapePDF:    o.rodapePDF    || 'Obrigado pela preferencia!'
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });
    // Checkboxes WhatsApp
    const wa1 = document.getElementById('cfgTelefoneWA');
    const wa2 = document.getElementById('cfgTelefone2WA');
    if (wa1) wa1.checked = !!o.telefoneWA;
    if (wa2) wa2.checked = !!o.telefone2WA;

    const preview = document.getElementById('cfgLogoPreview');
    if (preview) preview.src = o.logo || 'logo-default.png';
}

async function salvarConfiguracoes(event) {
    if (event) event.preventDefault();
    const val  = id => document.getElementById(id)?.value.trim() || '';
    const chk  = id => document.getElementById(id)?.checked || false;
    const cor  = val('cfgCorPrimaria') || '#27ae60';

    const payload = {
        nome:                 val('cfgNomeOficina'),
        nome_exibicao:        val('cfgNomeExibicao'),
        cnpj:                 val('cfgCnpj'),
        endereco:             val('cfgEndereco'),
        telefone:             val('cfgTelefone'),
        telefone_whatsapp:    chk('cfgTelefoneWA'),
        telefone2:            val('cfgTelefone2'),
        telefone2_whatsapp:   chk('cfgTelefone2WA'),
        email:                val('cfgEmail'),
        site:                 val('cfgSite'),
        cor_primaria:         cor,
        rodape_pdf:           val('cfgRodapePDF') || 'Obrigado pela preferencia!'
    };

    if (AppState.oficina?.logo?.startsWith('data:')) {
        payload.logo_url = AppState.oficina.logo;
    }

    try {
        const sb = await _getSupabaseCfg();
        const oficina_id = window.AppState?.user?.oficina_id;
        if (!oficina_id) { showToast('Oficina nao identificada!','error'); return; }

        const { error } = await sb.from('oficinas').update(payload).eq('id', oficina_id);
        if (error) { showToast('Erro ao salvar!','error'); console.error(error); return; }

        aplicarWhiteLabel({
            ...payload,
            logo_url:            payload.logo_url || AppState.oficina?.logo || '',
            telefone_whatsapp:   payload.telefone_whatsapp,
            telefone2_whatsapp:  payload.telefone2_whatsapp
        });
        showToast('Configuracoes salvas!','success');
    } catch(e) {
        showToast('Erro inesperado!','error'); console.error(e);
    }
}
