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

function getLogoPublicUrl(oficinaId) {
    if (!oficinaId) return '';
    try {
        const sb = window._supabase;
        if (!sb?.storage) return '';
        const { data } = sb.storage.from('logos').getPublicUrl(`${oficinaId}.png`);
        return data?.publicUrl || '';
    } catch (_) {
        return '';
    }
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
        nome:              oficina.nome            || 'Minha Oficina',
        nomeExibicao:      oficina.nome_exibicao   || oficina.nome || 'CheckAuto',
        subtitulo:         oficina.subtitulo       || 'Sistema de Gestao',
        cnpj:              oficina.cnpj            || '',
        endereco:          oficina.endereco        || '',
        telefone:          oficina.telefone        || '',
        telefoneWA:        oficina.telefone_whatsapp  || false,
        telefone2:         oficina.telefone2       || '',
        telefone2WA:       oficina.telefone2_whatsapp || false,
        whatsapp:          oficina.whatsapp        || '',
        email:             oficina.email           || '',
        site:              oficina.site            || '',
        corPrimaria:       oficina.cor_primaria    || '#27ae60',
        rodapePDF:         oficina.rodape_pdf      || 'Obrigado pela preferencia!',
        logo:              oficina.logo_url        || getLogoPublicUrl(window.AppState?.user?.oficina_id) || ''
    });
    const cor = AppState.oficina.corPrimaria;
    document.documentElement.style.setProperty('--primary-color', cor);
    document.documentElement.style.setProperty('--oficina-cor', cor);
    document.documentElement.style.setProperty('--cor-primaria', 'var(--oficina-cor)');
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
    const logoInput = document.getElementById('cfgLogo');
    if (logoInput && !logoInput.dataset.bound) {
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 500*1024) { showToast('Logo muito grande! Max 500KB.','warning'); return; }
            const oficina_id = window.AppState?.user?.oficina_id;
            if (!oficina_id) return;
            try {
                const sb = await _getSupabaseCfg();
                const path = `${oficina_id}.png`;
                const { error: uploadError } = await sb.storage.from('logos').upload(path, file, { upsert: true, contentType: 'image/png' });
                if (uploadError) {
                    console.error('Erro no upload da logo:', uploadError);
                    showToast('Falha ao enviar logo para o storage.', 'error');
                    return;
                }

                const { data } = sb.storage.from('logos').getPublicUrl(path);
                const logoUrl = data?.publicUrl || '';
                const preview = document.getElementById('cfgLogoPreview');
                if (preview) preview.src = logoUrl || 'logo-default.png';

                const { error } = await sb.from('oficinas').update({ logo_url: logoUrl }).eq('id', oficina_id);
                if (error) {
                    console.error('Erro ao persistir logo no upload:', error);
                    showToast('Logo enviada, mas falhou ao salvar URL na oficina.', 'warning');
                    return;
                }

                AppState.oficina.logo = logoUrl;
                aplicarWhiteLabel({ logo_url: logoUrl });
                showToast('Logo salva com sucesso!', 'success');
            } catch (err) {
                console.error('Erro inesperado ao persistir logo:', err);
                showToast('Erro ao salvar logo da oficina.', 'error');
            }
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
    const wa1 = document.getElementById('cfgTelefoneWA');
    const wa2 = document.getElementById('cfgTelefone2WA');
    if (wa1) wa1.checked = !!o.telefoneWA;
    if (wa2) wa2.checked = !!o.telefone2WA;
    const preview = document.getElementById('cfgLogoPreview');
    if (preview) preview.src = o.logo || 'logo-default.png';
}

async function salvarConfiguracoes(event) {
    if (event) event.preventDefault();
    const val = id => (document.getElementById(id)?.value || '').trim();
    const chk = id => document.getElementById(id)?.checked || false;

    // Apenas colunas que existem na tabela
    const payload = {};

    const nomeOficina = val('cfgNomeOficina');
    if (nomeOficina) payload.nome = nomeOficina;

    const nomeExib = val('cfgNomeExibicao');
    if (nomeExib) payload.nome_exibicao = nomeExib;

    const cnpj = val('cfgCnpj');
    if (cnpj) payload.cnpj = cnpj;

    const endereco = val('cfgEndereco');
    if (endereco !== undefined) payload.endereco = endereco;

    const tel1 = val('cfgTelefone');
    payload.telefone           = tel1;
    payload.telefone_whatsapp  = chk('cfgTelefoneWA');

    const tel2 = val('cfgTelefone2');
    payload.telefone2          = tel2;
    payload.telefone2_whatsapp = chk('cfgTelefone2WA');

    // whatsapp = primeiro numero que tiver WA marcado
    payload.whatsapp = chk('cfgTelefoneWA') ? tel1 : (chk('cfgTelefone2WA') ? tel2 : '');

    const email = val('cfgEmail');
    if (email) payload.email = email;

    const site = val('cfgSite');
    payload.site = site;

    const cor = val('cfgCorPrimaria') || '#27ae60';
    payload.cor_primaria = cor;

    payload.rodape_pdf = val('cfgRodapePDF') || 'Obrigado pela preferencia!';

    console.log('Payload configuracoes:', payload);

    try {
        const sb = await _getSupabaseCfg();
        const oficina_id = window.AppState?.user?.oficina_id;
        if (!oficina_id) { showToast('Oficina nao identificada!','error'); return; }

        const { error } = await sb.from('oficinas').update(payload).eq('id', oficina_id);
        if (error) {
            console.error('Supabase error:', error);
            showToast('Erro ao salvar: ' + (error.message || error.code || 'Verifique o console'), 'error');
            return;
        }

        aplicarWhiteLabel({
            nome:                 payload.nome          || AppState.oficina?.nome,
            nome_exibicao:        payload.nome_exibicao || AppState.oficina?.nomeExibicao,
            cnpj:                 payload.cnpj,
            endereco:             payload.endereco,
            telefone:             payload.telefone,
            telefone_whatsapp:    payload.telefone_whatsapp,
            telefone2:            payload.telefone2,
            telefone2_whatsapp:   payload.telefone2_whatsapp,
            whatsapp:             payload.whatsapp,
            email:                payload.email,
            site:                 payload.site,
            cor_primaria:         payload.cor_primaria,
            rodape_pdf:           payload.rodape_pdf,
            logo_url:             payload.logo_url || AppState.oficina?.logo || ''
        });
        showToast('Configuracoes salvas com sucesso!', 'success');
    } catch(e) {
        console.error('Erro inesperado:', e);
        showToast('Erro inesperado: ' + e.message, 'error');
    }
}
