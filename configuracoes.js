// ============================================
// CONFIGURACOES DA OFICINA — Supabase
// ============================================
async function _getSupabaseCfg() {
    if (window._supabase) return window._supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    window._supabase = createClient(
        'https://hefpzigrxyyhvtgkyspr.supabase.co',
        'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'
    );
    return window._supabase;
}

// ============================================
// MASCARAS
// ============================================
function aplicarMascaraCNPJ(input) {
    var v = (input.value || '').replace(/\D/g, '').slice(0, 14);
    v = v.replace(/(\d{2})(\d)/, '$1.$2')
         .replace(/(\d{3})(\d)/, '$1.$2')
         .replace(/(\d{3})(\d)/, '$1/$2')
         .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    input.value = v;
}

function aplicarMascaraTelefone(input) {
    var v = (input.value || '').replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        v = v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    }
    input.value = v;
}

// ============================================
// COR HOVER CALCULADA
// ============================================
function calcularHoverColor(hex) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return '#219a52';
    var r = Math.max(0, parseInt(hex.slice(1,3), 16) - 20);
    var g = Math.max(0, parseInt(hex.slice(3,5), 16) - 20);
    var b = Math.max(0, parseInt(hex.slice(5,7), 16) - 20);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// ============================================
// CARREGAR OFICINA DO SUPABASE
// ============================================
async function carregarOficinaDoDB() {
    try {
        const sb = await _getSupabaseCfg();
        const oficina_id = window.AppState?.user?.oficina_id;
        if (!oficina_id) return null;

        const { data, error } = await sb
            .from('oficinas')
            .select('*')
            .eq('id', oficina_id)
            .single();

        if (error) { console.error('Erro ao carregar oficina:', error); return null; }
        return data;
    } catch (e) {
        console.error(e);
        return null;
    }
}

// ============================================
// APLICAR WHITE-LABEL NA INTERFACE
// ============================================
function aplicarWhiteLabel(oficina) {
    if (!oficina) return;

    // Mescla no AppState
    AppState.oficina = Object.assign({}, AppState.oficina, {
        nome:         oficina.nome         || 'Minha Oficina',
        nomeExibicao: oficina.nome_exibicao || oficina.nome || 'CheckAuto',
        subtitulo:    oficina.subtitulo     || 'Sistema de Gestao',
        cnpj:         oficina.cnpj          || '',
        endereco:     oficina.endereco      || '',
        telefone:     oficina.telefone      || '',
        email:        oficina.email         || '',
        site:         oficina.site          || '',
        corPrimaria:  oficina.cor_primaria  || '#27ae60',
        rodapePDF:    oficina.rodape_pdf    || 'Obrigado pela preferencia!',
        logo:         oficina.logo_url      || ''
    });

    // Cor primaria
    const cor = AppState.oficina.corPrimaria;
    document.documentElement.style.setProperty('--primary-color', cor);
    document.documentElement.style.setProperty('--primary-hover', calcularHoverColor(cor));

    // Titulo da pagina
    document.title = AppState.oficina.nomeExibicao;

    // Nome na sidebar/navbar
    if (typeof updateOficinaNome === 'function') updateOficinaNome();

    // Logo
    const logoSrc = AppState.oficina.logo || 'logo-default.png';
    document.querySelectorAll('.navbar-logo, .sidebar-logo-img').forEach(img => {
        img.src = logoSrc;
        img.onerror = () => { img.src = 'logo-default.png'; };
    });
}

// ============================================
// INICIALIZAR PAGINA DE CONFIGURACOES
// ============================================
async function initConfiguracoes() {
    // Mascara CNPJ
    const cnpjInput = document.getElementById('cfgCnpj');
    if (cnpjInput && !cnpjInput.dataset.maskBound) {
        cnpjInput.addEventListener('input', () => aplicarMascaraCNPJ(cnpjInput));
        cnpjInput.dataset.maskBound = '1';
    }

    // Mascara telefone
    const telInput = document.getElementById('cfgTelefone');
    if (telInput && !telInput.dataset.maskBound) {
        telInput.addEventListener('input', () => aplicarMascaraTelefone(telInput));
        telInput.dataset.maskBound = '1';
    }

    // Upload de logo — converte para base64 e faz upload no Supabase Storage
    const logoInput = document.getElementById('cfgLogo');
    if (logoInput && !logoInput.dataset.bound) {
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Preview imediato
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('cfgLogoPreview');
                if (preview) preview.src = ev.target.result;
                AppState.oficina._logoBase64 = ev.target.result;
            };
            reader.readAsDataURL(file);

            // Upload no Supabase Storage
            try {
                const sb = await _getSupabaseCfg();
                const oficina_id = window.AppState?.user?.oficina_id;
                const ext  = file.name.split('.').pop();
                const path = `logos/${oficina_id}.${ext}`;

                const { error: upErr } = await sb.storage
                    .from('oficinas')
                    .upload(path, file, { upsert: true, contentType: file.type });

                if (upErr) {
                    console.warn('Upload logo falhou, usando base64:', upErr.message);
                    return;
                }

                const { data: urlData } = sb.storage.from('oficinas').getPublicUrl(path);
                AppState.oficina.logo = urlData.publicUrl;
                AppState.oficina._logoBase64 = null;
            } catch (err) {
                console.error('Erro no upload:', err);
            }
        });
        logoInput.dataset.bound = '1';
    }

    // Carrega dados do Supabase e preenche o form
    const oficina = await carregarOficinaDoDB();
    if (oficina) {
        aplicarWhiteLabel(oficina);
        loadConfiguracoes();
    }
}

// ============================================
// PREENCHER FORMULARIO
// ============================================
function loadConfiguracoes() {
    const o = AppState.oficina || {};
    const map = {
        cfgNomeOficina:  o.nome         || '',
        cfgNomeExibicao: o.nomeExibicao || '',
        cfgCnpj:         o.cnpj         || '',
        cfgEndereco:     o.endereco     || '',
        cfgTelefone:     o.telefone     || '',
        cfgEmail:        o.email        || '',
        cfgSite:         o.site         || '',
        cfgCorPrimaria:  o.corPrimaria  || '#27ae60',
        cfgRodapePDF:    o.rodapePDF    || 'Obrigado pela preferencia!'
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    const preview = document.getElementById('cfgLogoPreview');
    if (preview) preview.src = o.logo || 'logo-default.png';
}

// ============================================
// SALVAR NO SUPABASE
// ============================================
async function salvarConfiguracoes(event) {
    if (event) event.preventDefault();

    const val = id => document.getElementById(id)?.value.trim() || '';
    const cor = val('cfgCorPrimaria') || '#27ae60';

    const payload = {
        nome:          val('cfgNomeOficina'),
        nome_exibicao: val('cfgNomeExibicao'),
        cnpj:          val('cfgCnpj'),
        endereco:      val('cfgEndereco'),
        telefone:      val('cfgTelefone'),
        email:         val('cfgEmail'),
        site:          val('cfgSite'),
        cor_primaria:  cor,
        rodape_pdf:    val('cfgRodapePDF') || 'Obrigado pela preferencia!'
    };

    // Inclui logo_url se foi feito upload
    if (AppState.oficina?.logo && !AppState.oficina?.logo.startsWith('data:')) {
        payload.logo_url = AppState.oficina.logo;
    }

    try {
        const sb = await _getSupabaseCfg();
        const oficina_id = window.AppState?.user?.oficina_id;

        if (!oficina_id) {
            showToast('Oficina nao identificada!', 'error');
            return;
        }

        const { error } = await sb
            .from('oficinas')
            .update(payload)
            .eq('id', oficina_id);

        if (error) {
            showToast('Erro ao salvar configuracoes!', 'error');
            console.error(error);
            return;
        }

        // Atualiza AppState e visual
        aplicarWhiteLabel({
            ...payload,
            logo_url: payload.logo_url || AppState.oficina?.logo || ''
        });

        showToast('Configuracoes salvas com sucesso!', 'success');
    } catch (e) {
        showToast('Erro inesperado!', 'error');
        console.error(e);
    }
}
