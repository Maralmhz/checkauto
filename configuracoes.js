function aplicarMascaraCNPJ(input) {
    var value = (input.value || '').replace(/\D/g, '').slice(0, 14);
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1/$2');
    value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    input.value = value;
}

function aplicarMascaraTelefone(input) {
    var value = (input.value || '').replace(/\D/g, '').slice(0, 11);
    if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    input.value = value;
}

function getOficinaStorage() {
    try {
        var saved = localStorage.getItem('perplexity_oficina');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Erro ao ler configuracoes da oficina:', error);
        return null;
    }
}

function calcularHoverColor(hexColor) {
    if (!hexColor || !/^#[0-9a-f]{6}$/i.test(hexColor)) return '#219a52';
    var r = Math.max(0, parseInt(hexColor.slice(1, 3), 16) - 20);
    var g = Math.max(0, parseInt(hexColor.slice(3, 5), 16) - 20);
    var b = Math.max(0, parseInt(hexColor.slice(5, 7), 16) - 20);
    return '#' + [r, g, b].map(function(v){ return v.toString(16).padStart(2, '0'); }).join('');
}

function aplicarWhiteLabel() {
    var oficinaSalva = getOficinaStorage();
    if (oficinaSalva) {
        AppState.oficina = Object.assign({}, AppState.oficina, oficinaSalva);
    }

    var cor = AppState.oficina.corPrimaria || '#27ae60';
    document.documentElement.style.setProperty('--primary-color', cor);
    document.documentElement.style.setProperty('--primary-hover', calcularHoverColor(cor));

    var nomeExibicao = AppState.oficina.nomeExibicao || AppState.oficina.nome || 'Perplexity';
    document.title = nomeExibicao + ' - Sistema de Gestao Automotiva';

    updateOficinaNome();

    var logoSrc = AppState.oficina.logo || 'https://via.placeholder.com/40';
    document.querySelectorAll('.navbar-logo, .sidebar-logo-img').forEach(function(img) {
        img.src = logoSrc;
    });
}

function loadConfiguracoes() {
    var oficina = AppState.oficina || {};
    var nome = oficina.nome || '';

    var map = {
        cfgNomeOficina: nome,
        cfgCnpj: oficina.cnpj || '',
        cfgEndereco: oficina.endereco || '',
        cfgTelefone: oficina.telefone || '',
        cfgEmail: oficina.email || '',
        cfgSite: oficina.site || '',
        cfgCorPrimaria: oficina.corPrimaria || '#27ae60',
        cfgNomeExibicao: oficina.nomeExibicao || nome,
        cfgRodapePDF: oficina.rodapePDF || 'Obrigado pela preferencia!'
    };

    Object.keys(map).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = map[id];
    });

    var preview = document.getElementById('cfgLogoPreview');
    if (preview) {
        preview.src = oficina.logo || 'https://via.placeholder.com/80x80?text=Logo';
    }
}

function salvarConfiguracoes(event) {
    if (event) event.preventDefault();

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    var corPrimaria = val('cfgCorPrimaria') || '#27ae60';

    AppState.oficina = Object.assign({}, AppState.oficina, {
        nome: val('cfgNomeOficina'),
        cnpj: val('cfgCnpj'),
        endereco: val('cfgEndereco'),
        telefone: val('cfgTelefone'),
        email: val('cfgEmail'),
        site: val('cfgSite'),
        corPrimaria: corPrimaria,
        nomeExibicao: val('cfgNomeExibicao'),
        rodapePDF: val('cfgRodapePDF') || 'Obrigado pela preferencia!'
    });

    document.documentElement.style.setProperty('--primary-color', corPrimaria);
    document.documentElement.style.setProperty('--primary-hover', calcularHoverColor(corPrimaria));

    document.title = (AppState.oficina.nomeExibicao || AppState.oficina.nome || 'Perplexity') + ' - Sistema de Gestao Automotiva';
    updateOficinaNome();

    localStorage.setItem('perplexity_oficina', JSON.stringify(AppState.oficina));
    aplicarWhiteLabel();
    saveToLocalStorage();

    showToast('Configuracoes salvas com sucesso!', 'success');
}

function initConfiguracoes() {
    var cnpjInput = document.getElementById('cfgCnpj');
    var telefoneInput = document.getElementById('cfgTelefone');
    var logoInput = document.getElementById('cfgLogo');

    if (cnpjInput && !cnpjInput.dataset.maskBound) {
        cnpjInput.addEventListener('input', function() { aplicarMascaraCNPJ(cnpjInput); });
        cnpjInput.dataset.maskBound = '1';
    }

    if (telefoneInput && !telefoneInput.dataset.maskBound) {
        telefoneInput.addEventListener('input', function() { aplicarMascaraTelefone(telefoneInput); });
        telefoneInput.dataset.maskBound = '1';
    }

    if (logoInput && !logoInput.dataset.bound) {
        logoInput.addEventListener('change', function(e) {
            var file = e.target.files && e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(loadEvent) {
                var base64 = loadEvent.target.result;
                AppState.oficina.logo = base64;
                var preview = document.getElementById('cfgLogoPreview');
                if (preview) preview.src = base64;
            };
            reader.readAsDataURL(file);
        });
        logoInput.dataset.bound = '1';
    }

    loadConfiguracoes();
}
