// ============================================
// CHECKLIST — Supabase
// ============================================
const ChecklistState = {
    checklistAtual: null,
    abaAtiva: 'pecas',
    pecasComuns: [
        'Parachoque dianteiro','Parachoque traseiro','Farol direito','Farol esquerdo',
        'Lanterna traseira direita','Lanterna traseira esquerda','Retrovisor esquerdo','Retrovisor direito',
        'Para-lama dianteiro direito','Para-lama dianteiro esquerdo','Capo','Porta dianteira esquerda',
        'Porta dianteira direita','Porta traseira esquerda','Porta traseira direita','Vidro para-brisa',
        'Vidro traseiro','Macaneta externa','Spoiler','Grade frontal',
        'Amortecedor dianteiro','Amortecedor traseiro','Pastilha de freio','Disco de freio',
        'Bateria 60Ah','Filtro de oleo','Filtro de ar','Filtro de combustivel',
        'Correia dentada','Correia auxiliar','Vela de ignicao','Oleo motor 5W30',
        'Pneu 175/65 R14','Kit embreagem','Radiador','Bomba dagua',
        'Alternador','Motor de partida','Sensor ABS','Rolamento dianteiro',
        'Terminal de direcao','Coxim do motor','Pivo dianteiro','Barra estabilizadora',
        'Cabo de vela','Tampa de oleo','Junta do cabecote','Bucha de bandeja'
    ],
    servicosComuns: [
        'Mao de obra pintura','Mao de obra funilaria','Mao de obra mecanica','Troca de oleo e filtro',
        'Alinhamento completo','Balanceamento 4 rodas','Diagnostico eletronico','Revisao completa',
        'Polimento tecnico','Higienizacao interna','Lavagem detalhada','Limpeza bicos injetores',
        'Revisao sistema de freios','Troca fluido de freio','Troca correia dentada','Geometria dianteira',
        'Regulagem farois','Calibracao pneus','Revisao ar-condicionado','Troca fluido direcao',
        'Inspecao estrutural','Reaperto suspensao','Reparo eletrico painel','Teste de rodagem',
        'Troca de bateria','Troca pastilha freio','Retifica de freio','Troca kit embreagem',
        'Troca radiador','Troca bomba dagua','Alinhamento traseiro','Instalacao acessorio',
        'Escaneamento modulo','Codificacao chave','Servico de ar condicionado'
    ]
};

function _sb() { return window._supabase || window.supabase; }
function setAbaAtiva(aba) { ChecklistState.abaAtiva = aba; }
function getAbaAtiva() { return ChecklistState.abaAtiva || 'pecas'; }

function isValidUrl(value) {
    if (!value) return false;
    try {
        var parsed = new URL(value, window.location.origin);
        return /^https?:$/i.test(parsed.protocol);
    } catch (e) {
        return false;
    }
}

function fetchBase64ViaXHR(url) {
    return new Promise(function(resolve) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        var data = typeof reader.result === 'string' ? reader.result : null;
                        resolve(data && data.startsWith('data:image') ? data : null);
                    };
                    reader.onerror = function() { resolve(null); };
                    reader.readAsDataURL(xhr.response);
                } else {
                    resolve(null);
                }
            };
            xhr.onerror = function() { resolve(null); };
            xhr.ontimeout = function() { resolve(null); };
            xhr.send();
        } catch (e) {
            resolve(null);
        }
    });
}

// ============================================
// LOGO — estrategia em camadas
// 1. Se AppState.oficina.logo ja e base64 -> usa direto
// 2. Se e URL -> tenta carregar via Image tag
// 3. Fallback para logo-default.png
// ============================================
function _imgToBase64(src) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            try {
                var canvas = document.createElement('canvas');
                canvas.width  = img.naturalWidth  || img.width  || 200;
                canvas.height = img.naturalHeight || img.height || 200;
                canvas.getContext('2d').drawImage(img, 0, 0);
                var b64 = canvas.toDataURL('image/png');
                resolve(b64 && b64.length > 200 ? b64 : null);
            } catch(e) { resolve(null); }
        };
        img.onerror = function() { resolve(null); };
        if ((src || '').startsWith('data:')) {
            img.src = src;
        } else {
            img.src = src + (src.indexOf('?') < 0 ? '?_cb=' : '&_cb=') + Date.now();
        }
    });
}

async function getWAIconBase64() {
    var waSvg = await fetchBase64ViaXHR('whatsapp.svg');
    if (waSvg) {
        var waSvgAsPng = await _imgToBase64(waSvg);
        if (waSvgAsPng) return waSvgAsPng;
    }

    var waJpg = await fetchBase64ViaXHR('logowhatsapp.jpg');
    if (waJpg) return waJpg;

    return null;
}

async function getLogoBase64(oficina) {
    var logo = (oficina && oficina.logo) ? oficina.logo.trim() : '';

    // ja e base64 — usa direto, zero conversao
    if (logo.startsWith('data:image')) return logo;

    // e uma URL valida — tenta XHR(blob->base64) e fallback via canvas
    if (isValidUrl(logo) && !logo.includes('via.placeholder')) {
        var fromXhr = await fetchBase64ViaXHR(logo);
        if (fromXhr) return fromXhr;

        var fromUrlCanvas = await _imgToBase64(logo);
        if (fromUrlCanvas) return fromUrlCanvas;
    }

    // fallback: logo-default.png relativo ao HTML
    var fromDefaultXhr = await fetchBase64ViaXHR('logo-default.png');
    if (fromDefaultXhr) return fromDefaultXhr;

    var fromDefaultCanvas = await _imgToBase64('logo-default.png');
    if (fromDefaultCanvas) return fromDefaultCanvas;

    return null; // sem logo
}

// ============================================
// OCR
// ============================================
function iniciarOCRContextual(textoOCR) {
    const aba = getAbaAtiva();
    const linhas = (textoOCR || '').split('\n').map(l => l.trim()).filter(l => l.length > 1);
    if (linhas.length === 0) { showToast('Nenhum texto reconhecido pelo OCR.', 'info'); return; }
    const tbody = document.getElementById(aba === 'servicos' ? 'tabelaServicos' : 'tabelaPecas');
    if (!tbody) return;
    linhas.forEach(linha => {
        const partes = linha.split(/\s{2,}|\t/);
        const descricao = partes[0] || linha;
        const valor = partes[1] ? partes[1].replace(/[^\d,\.]/g, '') : '';
        tbody.appendChild(aba === 'servicos'
            ? criarLinhaServico({ id: Date.now() + Math.random(), descricao, valor })
            : criarLinhaPeca({ id: Date.now() + Math.random(), descricao, valor }));
    });
    showToast(linhas.length + ' ' + (aba === 'servicos' ? 'servico(s)' : 'peca(s)') + ' importado(s) via OCR.', 'success');
    atualizarResumoFinanceiro();
}

async function abrirOCRCamera() {
    const aba = getAbaAtiva();
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'; input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) { document.body.removeChild(input); return; }
        showToast('Processando OCR -> ' + (aba === 'servicos' ? 'SERVICOS' : 'PECAS') + '...', 'info');
        if (typeof Tesseract !== 'undefined') {
            try { const r = await Tesseract.recognize(file, 'por', { logger: function(){} }); iniciarOCRContextual(r.data.text); }
            catch (err) { showToast('Erro no OCR: ' + err.message, 'danger'); }
        } else { showToast('Tesseract nao carregado.', 'info'); }
        document.body.removeChild(input);
    };
    input.click();
}

// ============================================
// INIT
// ============================================
function initChecklist(osId, veiculoId, clienteId) {
    osId = osId || null; veiculoId = veiculoId || null; clienteId = clienteId || null;
    if (osId) {
        const existe = (AppState.data.checklists || []).find(c => c.os_id === osId || c.osId === osId);
        if (existe) { ChecklistState.checklistAtual = existe; preencherFormularioChecklist(); }
        else { criarNovoChecklist(osId, veiculoId, clienteId); }
    } else {
        criarNovoChecklist(null, veiculoId, clienteId);
    }
    setupAutoComplete(); setupNavigacaoTeclado(); setupUploadFotos(); setupAssinaturaCanvas();
    atualizarResumoFinanceiro(); popularSelectsChecklist(); _setupAbaListeners();
}

function _setupAbaListeners() {
    document.querySelectorAll('[data-aba]').forEach(btn => btn.addEventListener('click', () => setAbaAtiva(btn.dataset.aba)));
    document.querySelectorAll('.tab-pecas,[href="#pecas"]').forEach(el => el.addEventListener('click', () => setAbaAtiva('pecas')));
    document.querySelectorAll('.tab-servicos,[href="#servicos"]').forEach(el => el.addEventListener('click', () => setAbaAtiva('servicos')));
}

function popularSelectsChecklist() {}
function atualizarVeiculosChecklist() {}

function gerarNumeroOS() {
    var placaInput = document.getElementById('checklistVeiculoPlaca');
    if (!placaInput) return;
    var placa = placaInput.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (placa.length < 3) return;
    var h = new Date();
    var numeroOSEl = document.getElementById('checklistNumeroOS');
    if (numeroOSEl) numeroOSEl.textContent = placa + '-' + String(h.getDate()).padStart(2,'0') + String(h.getMonth()+1).padStart(2,'0') + String(h.getFullYear()).slice(-2);
}

function preencherFormularioChecklist() {
    if (!ChecklistState.checklistAtual) return;
    var c = ChecklistState.checklistAtual;
    var clienteId = c.cliente_id || c.clienteId;
    var veiculoId = c.veiculo_id || c.veiculoId;
    var cliente = (AppState.data.clientes || []).find(x => x.id == clienteId);
    var veiculo  = (AppState.data.veiculos  || []).find(x => x.id == veiculoId);
    function s(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }
    s('checklistClienteNome',  cliente ? cliente.nome   : (c.cliente_nome  || c.clienteNome));
    s('checklistClienteCPF',   cliente ? cliente.cpf    : (c.cliente_cpf   || c.clienteCPF));
    s('checklistVeiculoPlaca', veiculo ? veiculo.placa  : (c.veiculo_placa || c.veiculoPlaca));
    s('checklistVeiculoModelo',veiculo ? veiculo.modelo : (c.veiculo_modelo|| c.veiculoModelo));
    s('hodometro', c.hodometro); s('observacoes', c.observacoes);
    var nc = document.getElementById('nivelCombustivel');
    var nivel = c.nivel_combustivel !== undefined ? c.nivel_combustivel : c.nivelCombustivel;
    if (nc && typeof nivel === 'number') nc.value = nivel;
    var nos = document.getElementById('checklistNumeroOS');
    var numOS = c.numero_os || c.numeroOS;
    if (nos) { if (numOS) nos.textContent = numOS; else gerarNumeroOS(); }
    var itens = c.itens || {};
    if (itens) Object.entries(itens).forEach(([k, v]) => { var el = document.getElementById(k); if (el) el.checked = !!v; });
    var tServ = document.getElementById('tabelaServicos');
    var tPec  = document.getElementById('tabelaPecas');
    if (tServ) { tServ.innerHTML = ''; (c.servicos || []).forEach(s => tServ.appendChild(criarLinhaServico(s))); }
    if (tPec)  { tPec.innerHTML  = ''; (c.pecas    || []).forEach(p => tPec.appendChild(criarLinhaPeca(p))); }
    atualizarResumoFinanceiro();
}

function preencherNomeCliente(nome) {
    if (!nome) return;
    function norm(t) { return (t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
    var cliente = (AppState.data.clientes||[]).find(c => norm(c.nome) === norm(nome));
    if (!cliente) return;
    var cpf = document.getElementById('checklistClienteCPF');
    if (cpf && !cpf.value) cpf.value = cliente.cpf || '';
    var veiculo = (AppState.data.veiculos||[]).find(v => v.clienteId === cliente.id || v.cliente_id === cliente.id);
    if (veiculo) {
        var p = document.getElementById('checklistVeiculoPlaca'), m = document.getElementById('checklistVeiculoModelo');
        if (p && !p.value) p.value = veiculo.placa || '';
        if (m && !m.value) m.value = veiculo.modelo || '';
        gerarNumeroOS();
    }
}

function criarNovoChecklist(osId, veiculoId, clienteId) {
    ChecklistState.checklistAtual = {
        id: null, os_id: osId || null, veiculo_id: veiculoId || null, cliente_id: clienteId || null,
        created_at: new Date().toISOString(), hodometro: '', nivel_combustivel: 4, tipo_combustivel: [],
        itens: { estepe:false,macaco:false,chaveRoda:false,triangulo:false,extintor:false,radio:false,antena:false,acendedor:false,vidroEletrico:false,travaEletrica:false,buzina:false,bateria:false,rodasLiga:false,protetorCarter:false,chaveSegredo:false,tapetes:false,ar:false,abs:false,airbag:false,automatico:false,direcaoHidraulica:false,alarme:false },
        luzes_avarias: [], inspecao_visual: { lataria:'', pneus:'', vidros:'', interior:'' },
        servicos: [], pecas: [], observacoes: '', fotos: [],
        assinatura_cliente: null, assinatura_tecnico: null, status: 'rascunho'
    };
}

// ============================================
// SALVAR NO SUPABASE
// ============================================
async function salvarChecklist() {
    function gv(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    const sb = _sb();
    const clienteNome   = gv('checklistClienteNome');
    const clienteCPF    = gv('checklistClienteCPF');
    const veiculoPlaca  = (document.getElementById('checklistVeiculoPlaca') ? document.getElementById('checklistVeiculoPlaca').value : '').toUpperCase().trim();
    const veiculoModelo = gv('checklistVeiculoModelo');
    let cliente = (AppState.data.clientes||[]).find(c => c.nome && c.nome.trim().toLowerCase() === clienteNome.toLowerCase());
    if (!cliente && clienteNome) {
        const { data: novoCliente, error: errC } = await sb.from('clientes').insert([{ nome: clienteNome, cpf: clienteCPF, telefone: '', email: '', endereco: '' }]).select().single();
        if (!errC && novoCliente) { cliente = novoCliente; AppState.data.clientes.push(cliente); }
    }
    let veiculo = (AppState.data.veiculos||[]).find(v => v.placa && v.placa.toUpperCase() === veiculoPlaca);
    if (!veiculo && veiculoPlaca && cliente) {
        const { data: novoVeiculo, error: errV } = await sb.from('veiculos').insert([{ placa: veiculoPlaca, modelo: veiculoModelo || 'Nao informado', cliente_id: cliente.id, chassis: '', ano: '', cor: '' }]).select().single();
        if (!errV && novoVeiculo) { veiculo = novoVeiculo; AppState.data.veiculos.push(veiculo); }
    }
    const nc = document.getElementById('nivelCombustivel');
    const combustTipos = Array.from(document.querySelectorAll('.combustivel-btn.active')).map(b => b.textContent.trim()).filter(Boolean);
    const payload = {
        os_id: ChecklistState.checklistAtual.os_id || null,
        numero_os: document.getElementById('checklistNumeroOS') ? document.getElementById('checklistNumeroOS').textContent.trim() : '',
        cliente_id: cliente ? cliente.id : null, cliente_nome: clienteNome, cliente_cpf: clienteCPF,
        veiculo_id: veiculo ? veiculo.id : null, veiculo_placa: veiculoPlaca, veiculo_modelo: veiculoModelo,
        hodometro: gv('hodometro'), nivel_combustivel: nc ? parseInt(nc.value) : 4, tipo_combustivel: combustTipos,
        itens: coletarItensChecklist(),
        inspecao_visual: { lataria: gv('inspecaoLataria'), pneus: gv('inspecaoPneus'), vidros: gv('inspecaoVidros'), interior: gv('inspecaoInterior') },
        servicos: coletarServicos(), pecas: coletarPecas(),
        status_regulacao: gv('statusRegulacao'), seguradora: gv('seguradora'),
        regulador: gv('regulador'), data_regulacao: gv('dataRegulacao') || null,
        observacoes: gv('observacoes'), fotos: ChecklistState.checklistAtual.fotos || [],
        assinatura_cliente: document.getElementById('canvasAssinaturaCliente') ? document.getElementById('canvasAssinaturaCliente').toDataURL() : null,
        assinatura_tecnico: document.getElementById('canvasAssinaturaTecnico') ? document.getElementById('canvasAssinaturaTecnico').toDataURL() : null,
        status: 'completo'
    };
    let resultado;
    const idAtual = ChecklistState.checklistAtual.id;
    if (idAtual) {
        const { data, error } = await sb.from('checklists').update(payload).eq('id', idAtual).select().single();
        if (error) { console.error('Erro ao atualizar checklist:', error); showToast('Erro ao salvar checklist!', 'error'); return; }
        resultado = data;
    } else {
        const { data, error } = await sb.from('checklists').insert([payload]).select().single();
        if (error) { console.error('Erro ao inserir checklist:', error); showToast('Erro ao salvar checklist!', 'error'); return; }
        resultado = data;
    }
    ChecklistState.checklistAtual = resultado;
    if (!AppState.data.checklists) AppState.data.checklists = [];
    const idx = AppState.data.checklists.findIndex(c => c.id === resultado.id);
    if (idx >= 0) AppState.data.checklists[idx] = resultado; else AppState.data.checklists.push(resultado);
    if (typeof renderClientes  === 'function') renderClientes();
    if (typeof renderVeiculos  === 'function') renderVeiculos();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast('Checklist salvo com sucesso!', 'success');
}

async function loadChecklists() {
    const sb = _sb();
    const { data, error } = await sb.from('checklists').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Erro ao carregar checklists:', error); return; }
    AppState.data.checklists = data || [];
}

// ============================================
// AUTOCOMPLETE + TECLADO
// ============================================
function setupAutoComplete() {
    setupAutoCompleteGenerico('.input-peca-desc',    ChecklistState.pecasComuns);
    setupAutoCompleteGenerico('.input-servico-desc', ChecklistState.servicosComuns);
}
function setupAutoCompleteGenerico(sel, lista) {
    document.addEventListener('input', function(e) {
        if (!e.target.matches(sel)) return;
        var v = removerAcentos(e.target.value.toLowerCase());
        if (v.length < 2) return;
        mostrarSugestoes(e.target, lista.filter(i => removerAcentos(i.toLowerCase()).includes(v)));
    });
}
function removerAcentos(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function mostrarSugestoes(input, sugestoes) {
    var ex = input.parentElement.querySelector('.autocomplete-sugestoes'); if (ex) ex.remove();
    if (!sugestoes.length) return;
    var div = document.createElement('div'); div.className = 'autocomplete-sugestoes';
    div.style.cssText = 'position:absolute;background:white;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.1);max-height:200px;overflow-y:auto;z-index:1000;width:'+input.offsetWidth+'px;margin-top:2px;';
    sugestoes.slice(0,5).forEach(function(s) {
        var item = document.createElement('div'); item.textContent = s;
        item.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;';
        item.addEventListener('mouseenter', () => item.style.background='#f5f5f5');
        item.addEventListener('mouseleave', () => item.style.background='white');
        item.addEventListener('click', () => { input.value = s; div.remove(); input.focus(); });
        div.appendChild(item);
    });
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(div);
    setTimeout(() => {
        document.addEventListener('click', function rem(e) {
            if (!div.contains(e.target) && e.target !== input) { div.remove(); document.removeEventListener('click', rem); }
        });
    }, 100);
}
function setupNavigacaoTeclado() {
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        var t = e.target;
        if (t.classList.contains('input-peca-valor'))         { e.preventDefault(); adicionarLinhaPeca(); }
        else if (t.classList.contains('input-servico-valor')) { e.preventDefault(); adicionarLinhaServico(); }
        else if (t.classList.contains('input-peca-desc') || t.classList.contains('input-servico-desc')) {
            e.preventDefault();
            var next = t.parentElement.parentElement.querySelector(t.classList.contains('input-peca-desc') ? '.input-peca-valor' : '.input-servico-valor');
            if (next) next.focus();
        }
    });
}

// ============================================
// LINHAS PECAS / SERVICOS
// ============================================
function adicionarLinhaServico() { var tbody=document.getElementById('tabelaServicos'); var l=criarLinhaServico(); tbody.appendChild(l); var f=l.querySelector('.input-servico-desc'); if(f) f.focus(); atualizarResumoFinanceiro(); }
function adicionarLinhaPeca()    { var tbody=document.getElementById('tabelaPecas');    var l=criarLinhaPeca();    tbody.appendChild(l); var f=l.querySelector('.input-peca-desc');    if(f) f.focus(); atualizarResumoFinanceiro(); }

function criarLinhaServico(s) {
    s = s || null; var tr = document.createElement('tr'), id = (s && s.id) || Date.now();
    tr.innerHTML = '<td><input type="text" class="input-servico-desc" placeholder="Descricao do servico" value="'+((s&&s.descricao)||'')+'" data-id="'+id+'"></td>'
        +'<td><input type="text" class="input-servico-valor" placeholder="0,00" value="'+((s&&s.valor)||'')+'" data-id="'+id+'" oninput="formatarValorInput(this);atualizarResumoFinanceiro();"></td>'
        +'<td style="text-align:center;"><input type="checkbox" '+((s&&s.regulado)?'checked':'')+' onchange="atualizarResumoFinanceiro()"></td>'
        +'<td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaServico(this)"><i class="fas fa-trash"></i></button></td>';
    return tr;
}
function criarLinhaPeca(p) {
    p = p || null; var tr = document.createElement('tr'), id = (p && p.id) || Date.now();
    tr.innerHTML = '<td><input type="text" class="input-peca-desc" placeholder="Descricao da peca" value="'+((p&&p.descricao)||'')+'" data-id="'+id+'"></td>'
        +'<td><input type="text" class="input-peca-valor" placeholder="0,00" value="'+((p&&p.valor)||'')+'" data-id="'+id+'" oninput="formatarValorInput(this);atualizarResumoFinanceiro();"></td>'
        +'<td style="text-align:center;"><input type="checkbox" '+((p&&p.regulado)?'checked':'')+' onchange="atualizarResumoFinanceiro()"></td>'
        +'<td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaPeca(this)"><i class="fas fa-trash"></i></button></td>';
    return tr;
}
function removerLinhaServico(btn) { btn.closest('tr').remove(); atualizarResumoFinanceiro(); }
function removerLinhaPeca(btn)    { btn.closest('tr').remove(); atualizarResumoFinanceiro(); }
function formatarValorInput(input) {
    var v = input.value.replace(/\D/g,'');
    input.value = v ? (parseInt(v)/100).toFixed(2) : '';
}
function atualizarResumoFinanceiro() {
    var sv=coletarServicos(), pc=coletarPecas();
    var ts=sv.reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    var tp=pc.reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    var tr2=sv.filter(x=>x.regulado).reduce((s,x)=>s+(parseFloat(x.valor)||0),0)+pc.filter(x=>x.regulado).reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    function set(id,v){var el=document.getElementById(id);if(el)el.textContent=formatMoney(v);}
    set('totalServicos',ts);set('totalPecas',tp);set('totalRegulado',tr2);set('totalPendente',ts+tp-tr2);set('totalGeral',ts+tp);
}
function coletarServicos() {
    return Array.from(document.querySelectorAll('#tabelaServicos tr')).map(tr=>({descricao:tr.querySelector('.input-servico-desc')?tr.querySelector('.input-servico-desc').value:'',valor:parseFloat(tr.querySelector('.input-servico-valor')?tr.querySelector('.input-servico-valor').value:0)||0,regulado:!!(tr.querySelector('input[type="checkbox"]')&&tr.querySelector('input[type="checkbox"]').checked)})).filter(s=>s.descricao);
}
function coletarPecas() {
    return Array.from(document.querySelectorAll('#tabelaPecas tr')).map(tr=>({descricao:tr.querySelector('.input-peca-desc')?tr.querySelector('.input-peca-desc').value:'',valor:parseFloat(tr.querySelector('.input-peca-valor')?tr.querySelector('.input-peca-valor').value:0)||0,regulado:!!(tr.querySelector('input[type="checkbox"]')&&tr.querySelector('input[type="checkbox"]').checked)})).filter(p=>p.descricao);
}
function coletarItensChecklist() {
    var itens={};
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb=>{itens[cb.id]=cb.checked;});
    return itens;
}

// ============================================
// FOTOS
// ============================================
function setupUploadFotos() {
    var inp=document.getElementById('inputFotos'); if(!inp) return;
    inp.addEventListener('change',function(e){Array.from(e.target.files).forEach(f=>{if(f.type.startsWith('image/'))comprimirEAdicionarFoto(f);});});
}
function comprimirEAdicionarFoto(file) {
    var reader=new FileReader();
    reader.onload=function(e){
        var img=new Image();
        img.onload=function(){var canvas=document.createElement('canvas'),maxW=800,maxH=600,w=img.width,h=img.height;if(w>h){if(w>maxW){h*=maxW/w;w=maxW;}}else{if(h>maxH){w*=maxH/h;h=maxH;}}canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);adicionarFotoNaGaleria(canvas.toDataURL('image/jpeg',0.7),file.name);};
        img.src=e.target.result;
    };
    reader.readAsDataURL(file);
}
function adicionarFotoNaGaleria(dataUrl,nome){
    var galeria=document.getElementById('galeriaFotos');
    var div=document.createElement('div');div.className='foto-preview';
    div.style.cssText='position:relative;display:inline-block;margin:5px;';
    div.innerHTML='<img src="'+dataUrl+'" style="width:120px;height:90px;object-fit:cover;border-radius:4px;">'
        +'<button onclick="removerFoto(this)" style="position:absolute;top:2px;right:2px;background:red;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;">x</button>';
    galeria.appendChild(div);
    if(!ChecklistState.checklistAtual.fotos)ChecklistState.checklistAtual.fotos=[];
    ChecklistState.checklistAtual.fotos.push({url:dataUrl,nome:nome});
}
function removerFoto(btn){btn.parentElement.remove();}

// ============================================
// ASSINATURA
// ============================================
function setupAssinaturaCanvas(){setupCanvas('canvasAssinaturaCliente');setupCanvas('canvasAssinaturaTecnico');}
function setupCanvas(canvasId){
    var canvas=document.getElementById(canvasId);if(!canvas)return;
    var ctx=canvas.getContext('2d'),d=false;
    canvas.addEventListener('mousedown',function(e){d=true;var r=canvas.getBoundingClientRect();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);});
    canvas.addEventListener('mouseup',()=>d=false);
    canvas.addEventListener('mouseleave',()=>d=false);
    canvas.addEventListener('mousemove',function(e){if(!d)return;var r=canvas.getBoundingClientRect();ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#000';ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);});
    canvas.addEventListener('touchstart',function(e){e.preventDefault();d=true;var r=canvas.getBoundingClientRect(),t=e.touches[0];ctx.beginPath();ctx.moveTo(t.clientX-r.left,t.clientY-r.top);});
    canvas.addEventListener('touchend',()=>d=false);
    canvas.addEventListener('touchmove',function(e){e.preventDefault();if(!d)return;var r=canvas.getBoundingClientRect(),t=e.touches[0];ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#000';ctx.lineTo(t.clientX-r.left,t.clientY-r.top);ctx.stroke();ctx.beginPath();ctx.moveTo(t.clientX-r.left,t.clientY-r.top);});
}
function limparAssinatura(canvasId){var c=document.getElementById(canvasId);if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);}
function toggleLuzPainel(){event.target.closest('.luz-painel-btn').classList.toggle('active');}
function toggleCombustivel(){event.target.closest('.combustivel-btn').classList.toggle('active');}

// ============================================
// DEMO
// ============================================
function gerarImagemMockChecklist(titulo,corFundo){
    corFundo=corFundo||'#0b5ed7';
    var canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
    var ctx=canvas.getContext('2d');
    ctx.fillStyle=corFundo;ctx.fillRect(0,0,1200,800);
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.fillRect(60,60,1080,680);
    ctx.fillStyle='#1f2937';ctx.font='bold 56px Arial';ctx.fillText('FASTCAR',110,180);
    ctx.fillStyle='#374151';ctx.font='36px Arial';ctx.fillText(titulo,110,250);
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=8;ctx.strokeRect(110,300,980,360);
    ctx.fillStyle='#6b7280';ctx.font='30px Arial';ctx.fillText('Imagem demonstrativa',150,500);
    return canvas.toDataURL('image/jpeg',0.75);
}

async function preencherChecklistDemoCompleto(gerarPdfAoFinal){
    if(gerarPdfAoFinal===undefined)gerarPdfAoFinal=true;
    if(!document.getElementById('page-checklist'))return;
    function sv(id,v){var el=document.getElementById(id);if(el)el.value=v;}
    sv('checklistClienteNome','Joao Silva de Almeida');sv('checklistClienteCPF','123.456.789-00');
    sv('checklistVeiculoPlaca','ABC1234');sv('checklistVeiculoModelo','Fiat Uno 1.0 Fire Flex 2012');
    sv('hodometro','152364');sv('nivelCombustivel','4');
    sv('inspecaoLataria','Risco na porta dianteira esquerda.');sv('inspecaoPneus','4 pneus Pirelli 80%.');
    sv('inspecaoVidros','Trinca no para-brisa.');sv('inspecaoInterior','Banco com desgaste.');
    sv('observacoes','Veiculo para orcamento.');sv('statusRegulacao','parcial');
    sv('seguradora','Porto Seguro');sv('regulador','Carlos Menezes');
    sv('dataRegulacao',new Date().toISOString().slice(0,10));
    sv('telefoneCliente','(31) 98765-4321');sv('chassisVeiculo','9BWZZZ377VT004251');
    gerarNumeroOS();
    document.querySelectorAll('.combustivel-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().indexOf('flex')>=0));
    document.querySelectorAll('.luz-painel-btn').forEach(b=>b.classList.toggle('active',['motor','freio','abs'].some(c=>b.textContent.toLowerCase().indexOf(c)>=0)));
    Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]')).forEach((cb,i)=>{cb.checked=i%3===0||i%5===0;});
    var tServ=document.getElementById('tabelaServicos'),tPec=document.getElementById('tabelaPecas');
    if(tServ)tServ.innerHTML='';if(tPec)tPec.innerHTML='';
    [{descricao:'Troca de oleo e filtros',valor:'80.00'},{descricao:'Revisao de freios completa',valor:'120.00'},{descricao:'Substituicao correia dentada',valor:'250.00'}]
        .forEach((s,i)=>tServ&&tServ.appendChild(criarLinhaServico({id:Date.now()+i,...s,regulado:i%2===0})));
    [{descricao:'Filtro de oleo (Qtd: 1)',valor:'45.00'},{descricao:'Filtro de ar (Qtd: 1)',valor:'38.00'},{descricao:'Filtro de combustivel (Qtd: 1)',valor:'52.00'},{descricao:'Filtro de cabine (Qtd: 1)',valor:'42.00'},{descricao:'Oleo motor 5W30 (1L) (Qtd: 4)',valor:'35.00'},{descricao:'Vela de ignicao (Qtd: 4)',valor:'28.00'},{descricao:'Pastilha de freio dianteira (Qtd: 1)',valor:'120.00'},{descricao:'Pastilha de freio traseira (Qtd: 1)',valor:'95.00'},{descricao:'Fluido de freio DOT4 (500ml) (Qtd: 1)',valor:'32.00'},{descricao:'Correia dentada (Qtd: 1)',valor:'185.00'},{descricao:'Tensor da correia (Qtd: 1)',valor:'95.00'},{descricao:'Bomba dagua (Qtd: 1)',valor:'210.00'},{descricao:'Fluido de arrefecimento (1L) (Qtd: 2)',valor:'28.00'},{descricao:'Palheta limpador para-brisa (Qtd: 2)',valor:'45.00'}]
        .forEach((p,i)=>tPec&&tPec.appendChild(criarLinhaPeca({id:Date.now()+100+i,...p,regulado:i%3===0})));
    var galeria=document.getElementById('galeriaFotos');
    if(galeria)galeria.innerHTML='';
    if(!ChecklistState.checklistAtual)criarNovoChecklist();
    ChecklistState.checklistAtual.fotos=[];
    ['Vista frontal','Lateral esquerda','Lateral direita','Traseira','Interior'].forEach((t,i)=>
        adicionarFotoNaGaleria(gerarImagemMockChecklist(t,['#0b5ed7','#198754','#6f42c1','#fd7e14','#dc3545'][i]),'foto.jpg'));
    function assinar(id,nome){
        var c=document.getElementById(id);if(!c)return;
        var ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
        ctx.strokeStyle='#111827';ctx.lineWidth=2;ctx.beginPath();
        ctx.moveTo(16,90);ctx.bezierCurveTo(60,20,120,130,190,70);ctx.bezierCurveTo(210,55,235,85,275,45);ctx.stroke();
        ctx.font='12px Arial';ctx.fillStyle='#4b5563';ctx.fillText(nome,12,140);
    }
    assinar('canvasAssinaturaCliente','Joao Silva');assinar('canvasAssinaturaTecnico','Rafael Tecnico');
    atualizarResumoFinanceiro();
    showToast('Demo preenchido! Gerando PDF...','success');
    if(gerarPdfAoFinal)setTimeout(()=>gerarPDF(),300);
}

// ============================================
// WHATSAPP
// ============================================
function normalizarTelefoneWhatsApp(t){
    if(!t)return null;
    var n=t.replace(/\D/g,'');
    if(!n||n.length<8)return null;
    if(!n.startsWith('55')&&(n.length===10||n.length===11))n='55'+n;
    return n;
}
function abrirWhatsAppComPDF(nomeArquivo,telefone,osNum){
    var msg=encodeURIComponent('Ola! Segue o PDF da OS '+osNum+'. Qualquer duvida estamos a disposicao!');
    var n=normalizarTelefoneWhatsApp(telefone);
    window.open(n?'https://wa.me/'+n+'?text='+msg:'https://wa.me/?text='+msg,'_blank','noopener,noreferrer');
}

// ============================================
// GERAR PDF
// ============================================
async function gerarPDF() {
    if (typeof window.jspdf === 'undefined') { showToast('Biblioteca jsPDF nao carregada', 'info'); return; }
    var jsPDFLib = window.jspdf.jsPDF;
    if (!jsPDFLib) { showToast('jsPDF nao encontrado', 'info'); return; }
    var doc = new jsPDFLib('p','mm','a4');
    if (typeof doc.autoTable !== 'function') { showToast('jsPDF-AutoTable nao carregado.', 'info'); return; }

    var oficina = Object.assign({
        nome: 'FAST CAR CENTRO AUTOMOTIVO',
        endereco: 'AV. REGULUS, 248 - CONTAGEM - MG',
        telefone: '(31) 2342-1699',
        telefoneWA: false,
        telefone2: '',
        telefone2WA: false,
        cnpj: '60.516.882/0001-74',
        logo: '', rodapePDF: 'Obrigado pela preferencia!'
    }, AppState.oficina || {});

    const corPrimaria = oficina.corPrimaria || '#27ae60';
    function hexToRgb(hex){return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
    const corRgb = hexToRgb(corPrimaria);

    // LOGO: base64 direto ou conversao via canvas
    var logoBase64 = await getLogoBase64(oficina);

    // WA icon
    var waIconData = await getWAIconBase64();
    var waIconFormat = waIconData && waIconData.indexOf('data:image/jpeg') === 0 ? 'JPEG' : 'PNG';
    var _waIdx = 0;
    function nextWaAlias() { return 'WA' + Date.now() + (_waIdx++); }

    function gv(id){var el=document.getElementById(id);return el?el.value.trim():'';}
    var osNum       = (document.getElementById('checklistNumeroOS')?document.getElementById('checklistNumeroOS').textContent.trim():'')||'SEM-OS';
    var clienteNome = gv('checklistClienteNome')||'NAO INFORMADO';
    var cpf         = gv('checklistClienteCPF')||'-';
    var telCliente  = gv('telefoneCliente');
    var placa       = (document.getElementById('checklistVeiculoPlaca')?document.getElementById('checklistVeiculoPlaca').value:'').toUpperCase().trim()||'SEMPLACA';
    var modelo      = gv('checklistVeiculoModelo')||'-';
    var chassis     = gv('chassisVeiculo')||'-';
    var hodometro   = gv('hodometro')||'-';
    var combustNivel= document.getElementById('nivelCombustivel')?document.getElementById('nivelCombustivel').value:'0';
    var combustTipos= Array.from(document.querySelectorAll('.combustivel-btn.active')).map(b=>b.textContent.trim()).filter(Boolean);
    var inspVisual  = {lataria:gv('inspecaoLataria')||'-',pneus:gv('inspecaoPneus')||'-',vidros:gv('inspecaoVidros')||'-',interior:gv('inspecaoInterior')||'-'};
    var itensEntrada= Array.from(document.querySelectorAll('.checklist-item')).map(item=>{
        var lbl=item.querySelector('label')||item.querySelector('.badge')||item.querySelector('span');
        return{label:lbl?lbl.textContent.trim():(item.querySelector('input')?item.querySelector('input').id:'Item'),marcado:!!(item.querySelector('input[type="checkbox"]')&&item.querySelector('input[type="checkbox"]').checked)};
    });
    var servicos=coletarServicos(),pecas=coletarPecas();
    var fotos=((ChecklistState.checklistAtual&&ChecklistState.checklistAtual.fotos)||[]).slice(0,9);
    var assinCli=document.getElementById('canvasAssinaturaCliente')?document.getElementById('canvasAssinaturaCliente').toDataURL('image/png'):null;
    var assinTec=document.getElementById('canvasAssinaturaTecnico')?document.getElementById('canvasAssinaturaTecnico').toDataURL('image/png'):null;
    var now=new Date(),dataEmissao=now.toLocaleDateString('pt-BR'),horaEmissao=now.toLocaleTimeString('pt-BR');
    var dataValidade=new Date(now.getTime()+15*24*60*60*1000).toLocaleDateString('pt-BR');
    var nomeArquivo='OS-'+placa+'_CHECKLIST.pdf';
    function fmtCur(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));}

    var PAGE_W=210,MARGIN=12,CX=22,CW=166,CT=44,CB=268;
    var GAP=4,COL_W=(CW-GAP)/2,XP=CX,XS=CX+COL_W+GAP;
    var logoAlias = 'LOGO' + Date.now();

    function drawBase(){doc.setDrawColor(210,210,210);doc.rect(MARGIN,10,PAGE_W-MARGIN*2,277);}

    function drawHeader(){
        doc.setDrawColor(225,225,225);
        doc.line(22,17,188,17);

        // caixa logo
        doc.setFillColor(255,255,255);
        doc.setDrawColor(225,225,225);
        doc.roundedRect(22, 22, 20, 14, 1, 1, 'FD');

        // logo
        if (logoBase64 && logoBase64.startsWith('data:image')) {
            var lf = logoBase64.indexOf('jpeg') >= 0 || logoBase64.indexOf('jpg') >= 0 ? 'JPEG' : 'PNG';
            try {
                doc.addImage(logoBase64, lf, 22.8, 22.8, 18.4, 12.4, logoAlias, 'FAST');
            } catch(e) {
                console.error('Falha ao adicionar logo no PDF:', e);
            }
        } else {
            doc.setFont('helvetica','normal'); doc.setTextColor(160,160,160); doc.setFontSize(6);
            doc.text('LOGO', 32, 30, {align:'center'});
        }

        // nome
        doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30); doc.setFontSize(10.5);
        doc.text(oficina.nome || 'OFICINA', 45, 25);

        // endereco
        doc.setFont('helvetica','normal'); doc.setTextColor(110,110,110); doc.setFontSize(6.3);
        if (oficina.endereco) doc.text(oficina.endereco, 45, 29);

        // telefones lado a lado, Y=33
        var telX = 45, telY = 33;
        doc.setFontSize(6.3); doc.setTextColor(80,80,80);

        if (oficina.telefone) {
            if (oficina.telefoneWA && waIconData) {
                try { doc.addImage(waIconData, waIconFormat, telX, telY-2.7, 3.2, 3.2, nextWaAlias(), 'FAST'); } catch(e){}
                doc.text(oficina.telefone, telX+3.8, telY);
                telX += 3.8 + doc.getTextWidth(oficina.telefone) + 3;
            } else {
                doc.text(oficina.telefone, telX, telY);
                telX += doc.getTextWidth(oficina.telefone) + 3;
            }
        }
        if (oficina.telefone2) {
            doc.setTextColor(200,200,200); doc.text('|', telX, telY); telX += doc.getTextWidth('|') + 2;
            doc.setTextColor(80,80,80);
            if (oficina.telefone2WA && waIconData) {
                try { doc.addImage(waIconData, waIconFormat, telX, telY-2.7, 3.2, 3.2, nextWaAlias(), 'FAST'); } catch(e){}
                doc.text(oficina.telefone2, telX+3.8, telY);
            } else {
                doc.text(oficina.telefone2, telX, telY);
            }
        }

        // CNPJ
        doc.setTextColor(110,110,110); doc.setFontSize(6.3);
        doc.text('CNPJ: '+(oficina.cnpj||''), 45, 37);

        // lado direito
        doc.setFont('helvetica','bold'); doc.setTextColor(140,140,140); doc.setFontSize(6.4);
        doc.text('ORDEM DE SERVICO', 188, 28, {align:'right'});
        doc.setTextColor(corRgb[0],corRgb[1],corRgb[2]); doc.setFontSize(12);
        doc.text(osNum, 188, 34, {align:'right'});

        doc.setDrawColor(corRgb[0],corRgb[1],corRgb[2]); doc.setLineWidth(0.7);
        doc.line(22,40.5,188,40.5);
        doc.setLineWidth(0.2);
    }

    function drawFooter(comAssin){
        if(comAssin){
            doc.setDrawColor(190,190,190);doc.line(22,248,188,248);
            doc.setDrawColor(160,160,160);doc.line(22,260,95,260);doc.line(115,260,188,260);
            if(assinCli)try{doc.addImage(assinCli,'PNG',27,248,62,11,'ASSC','FAST');}catch(e){}
            if(assinTec)try{doc.addImage(assinTec,'PNG',120,248,62,11,'ASST','FAST');}catch(e){}
            doc.setFont('helvetica','normal');doc.setTextColor(140,140,140);doc.setFontSize(5.6);
            doc.text('ASSINATURA DO CLIENTE',55,264,{align:'center'});
            doc.text('ASSINATURA DO TECNICO',155,264,{align:'center'});
        }
        doc.setDrawColor(190,190,190);doc.line(22,270,188,270);
        doc.setFont('helvetica','normal');doc.setTextColor(140,140,140);doc.setFontSize(5.6);
        doc.text((oficina.rodapePDF||'Obrigado pela preferencia!')+' | '+dataEmissao+' '+horaEmissao,105,275,{align:'center'});
    }

    function drawBox(x,y,w,h,title,lines){
        lines=lines||[];
        doc.setDrawColor(215,215,215);doc.setFillColor(250,250,250);doc.roundedRect(x,y,w,h,1.5,1.5,'FD');
        doc.setFont('helvetica','bold');doc.setTextColor(corRgb[0],corRgb[1],corRgb[2]);doc.setFontSize(6.5);doc.text(title.toUpperCase(),x+2,y+5);
        doc.setDrawColor(corRgb[0],corRgb[1],corRgb[2]);doc.line(x+1.5,y+6.5,x+w-1.5,y+6.5);
        doc.setFont('helvetica','normal');doc.setTextColor(70,70,70);doc.setFontSize(8);
        var ly=y+11;
        lines.forEach(line=>{doc.splitTextToSize(line,w-4).forEach(p=>{if(ly<y+h-1){doc.text(p,x+2,ly);ly+=3.8;}});});
    }

    function drawBadges(x,y,w,h,items){
        doc.setDrawColor(215,215,215);doc.setFillColor(250,250,250);doc.roundedRect(x,y,w,h,1.5,1.5,'FD');
        doc.setFont('helvetica','bold');doc.setTextColor(corRgb[0],corRgb[1],corRgb[2]);doc.setFontSize(6.5);doc.text('INSPECAO DE ENTRADA',x+2,y+5);
        doc.setDrawColor(corRgb[0],corRgb[1],corRgb[2]);doc.line(x+1.5,y+6.5,x+w-1.5,y+6.5);
        var bH=4.5,bPad=2,gap=1.5,cx=x+2,cy=y+10;doc.setFontSize(5.8);
        items.forEach(item=>{
            var bw=doc.getTextWidth(item.label)+bPad*2+4;
            if(cx+bw>x+w-2){cx=x+2;cy+=bH+gap;}if(cy+bH>y+h-2)return;
            if(item.marcado){doc.setFillColor(corRgb[0],corRgb[1],corRgb[2]);doc.setTextColor(255,255,255);}
            else{doc.setFillColor(220,220,220);doc.setTextColor(100,100,100);}
            doc.roundedRect(cx,cy,bw,bH,1,1,'F');
            doc.setFont('helvetica','bold');doc.text(item.marcado?'+':'-',cx+1.5,cy+3.3);
            doc.setFont('helvetica','normal');doc.text(item.label,cx+4.5,cy+3.3);
            cx+=bw+gap;
        });
    }

    function compressPhoto(dataUrl){
        return new Promise(resolve=>{
            var img=new Image();
            img.onload=function(){var canvas=document.createElement('canvas'),maxW=640,scale=Math.min(1,maxW/img.width);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',0.7));};
            img.onerror=()=>resolve(dataUrl);img.src=dataUrl;
        });
    }

    function drawTermo(x,y,w){
        var h=58;
        doc.setDrawColor(200,200,200);doc.setFillColor(252,252,252);doc.roundedRect(x,y,w,h,2,2,'FD');
        doc.setFillColor(240,240,240);doc.roundedRect(x,y,w,7,2,2,'F');doc.rect(x,y+3.5,w,3.5,'F');
        doc.setFont('helvetica','bold');doc.setTextColor(50,50,50);doc.setFontSize(7);doc.text('APROVACAO E CIENCIA DO CLIENTE',x+w/2,y+5.2,{align:'center'});
        doc.setFont('helvetica','normal');doc.setTextColor(60,60,60);doc.setFontSize(6.2);
        var ty=y+10;
        ['Declaro estar ciente e de acordo com os servicos e pecas relacionados neste orcamento,',
         'autorizando a execucao dos servicos descritos acima.',
         'ATENCAO: Este orcamento e valido por 15 dias ('+dataEmissao+'), vencendo em '+dataValidade+'.',
         'Apos aprovacao, podem ocorrer complementos de orcamento durante a desmontagem,',
         'situacao em que o cliente sera previamente comunicado para nova autorizacao.']
            .forEach(l=>{doc.text(l,x+w/2,ty,{align:'center'});ty+=4;});
        var al=y+36,cw3=(w-10)/3;
        [0,1,2].forEach(i=>{var cx2=x+4+i*(cw3+1);doc.setDrawColor(150,150,150);doc.setLineWidth(0.4);doc.line(cx2,al,cx2+cw3,al);doc.setLineWidth(0.2);});
        doc.setFont('helvetica','normal');doc.setTextColor(100,100,100);doc.setFontSize(5.8);
        ['Aprovado por / Assinatura do Cliente','Responsavel Tecnico / Aprovador','Data e Hora da Aprovacao']
            .forEach((l,i)=>{var cx2=x+4+i*(cw3+1);doc.text(l,cx2+cw3/2,al+5,{align:'center'});});
        doc.setFont('helvetica','italic');doc.setTextColor(130,130,130);doc.setFontSize(5.2);
        doc.text('Estou ciente dos termos acima e autorizo a execucao dos servicos.',x+w/2,y+h-2,{align:'center'});
    }

    // PAG 1
    drawBase(); drawHeader();
    var combustoStr=(combustTipos.join('/')||'Combustivel')+'('+combustNivel+'/8)';
    drawBox(22,44,82,20,'CLIENTE',['NOME: '+clienteNome,'CPF/CNPJ: '+cpf+'  |  TEL: '+(telCliente||'Nao informado')]);
    drawBox(107,44,81,20,'VEICULO',[modelo+' '+placa,'KM: '+hodometro+'  |  '+combustoStr,'CHASSI: '+chassis]);
    drawBox(22,67,166,13,'SERVICOS SOLICITADOS',servicos.length?servicos.map(s=>s.descricao):['-']);
    drawBadges(22,83,166,30,itensEntrada);
    drawBox(22,116,166,16,'OBSERVACOES DA INSPECAO',['Lataria: '+inspVisual.lataria,'Pneus: '+inspVisual.pneus,'Vidros: '+inspVisual.vidros,'Interior: '+inspVisual.interior]);

    var fotosComp=[];
    for(var fi=0;fi<fotos.length;fi++) fotosComp.push({nome:fotos[fi].nome,url:await compressPhoto(fotos[fi].url)});
    drawBox(22,135,166,100,'FOTOS DO VEICULO',[]);
    if(fotosComp.length>0){
        fotosComp.slice(0,3).forEach((f,i)=>{var fx=24+i*53,fy=143;doc.roundedRect(fx,fy,51,36,1,1);try{doc.addImage(f.url,'JPEG',fx+0.5,fy+0.5,50,35,'F'+i,'FAST');}catch(e){}});
        fotosComp.slice(3,9).forEach((f,i)=>{var fx=24+i*27.2,fy=182;doc.roundedRect(fx,fy,25,18,1,1);try{doc.addImage(f.url,'JPEG',fx+0.5,fy+0.5,24,17,'F'+(i+3),'FAST');}catch(e){}});
    }
    drawFooter(true);

    // PAG 2
    var totalPec=pecas.reduce((s,p)=>s+(Number(p.valor)||0),0);
    var totalSrv=servicos.reduce((s,v)=>s+(Number(v.valor)||0),0);
    var totalGeral=totalPec+totalSrv;
    var atStyles={font:'helvetica',fontSize:6.5,cellPadding:1.5,overflow:'ellipsize',lineColor:[220,220,220],lineWidth:0.2};
    var headSty={fillColor:corRgb,textColor:255,fontStyle:'bold',fontSize:7};
    var footSty={fillColor:corRgb,textColor:255,fontStyle:'bold',fontSize:8};

    doc.addPage(); drawBase(); drawHeader();
    doc.autoTable({head:[['PECAS','VALOR']],body:pecas.map(p=>[p.descricao,fmtCur(p.valor)]),foot:[['TOTAL PECAS',fmtCur(totalPec)]],startY:CT,margin:{left:XP,right:PAGE_W-XP-COL_W},tableWidth:COL_W,showFoot:'lastPage',showHead:'everyPage',rowPageBreak:'avoid',styles:atStyles,headStyles:headSty,footStyles:footSty,columnStyles:{0:{cellWidth:COL_W*0.65},1:{cellWidth:COL_W*0.35,halign:'right'}},didDrawPage:()=>{drawBase();drawHeader();drawFooter(false);}});
    var finalYPec=doc.lastAutoTable.finalY;
    doc.autoTable({head:[['SERVICOS','VALOR']],body:servicos.map(s=>[s.descricao,fmtCur(s.valor)]),foot:[['TOTAL SERVICOS',fmtCur(totalSrv)]],startY:CT,margin:{left:XS,right:PAGE_W-XS-COL_W},tableWidth:COL_W,showFoot:'lastPage',showHead:'everyPage',rowPageBreak:'avoid',styles:atStyles,headStyles:headSty,footStyles:footSty,columnStyles:{0:{cellWidth:COL_W*0.65},1:{cellWidth:COL_W*0.35,halign:'right'}},didDrawPage:()=>{drawBase();drawHeader();drawFooter(false);}});
    var finalYSrv=doc.lastAutoTable.finalY;

    var totalY=Math.max(finalYPec,finalYSrv)+4;
    var precisaNovaPag=totalY+80>CB;
    if(precisaNovaPag){doc.addPage();drawBase();drawHeader();drawFooter(false);}
    var tyUsed=precisaNovaPag?CT:totalY;
    doc.setFillColor(corRgb[0],corRgb[1],corRgb[2]);doc.roundedRect(CX,tyUsed,CW,13,2,2,'F');
    doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.setFontSize(12);
    doc.text('TOTAL GERAL DO ORCAMENTO:',CX+4,tyUsed+9);
    doc.setFontSize(13);doc.text(fmtCur(totalGeral),CX+CW-4,tyUsed+9,{align:'right'});
    doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);doc.setFontSize(6);
    doc.text('Emissao: '+dataEmissao+' '+horaEmissao+'   |   Validade: '+dataValidade,CX+CW/2,tyUsed+17,{align:'center'});

    var termoY=tyUsed+22;
    if(termoY+60>CB){doc.addPage();drawBase();drawHeader();drawFooter(false);termoY=CT;}
    drawTermo(CX,termoY,CW);
    drawFooter(false);

    doc.save(nomeArquivo);
    showToast('PDF gerado com sucesso!','success');
    setTimeout(()=>abrirWhatsAppComPDF(nomeArquivo,telCliente,osNum),600);
}

// ============================================
// EXPORTS
// ============================================
window.initChecklist=initChecklist;
window.salvarChecklist=salvarChecklist;
window.loadChecklists=loadChecklists;
window.gerarPDF=gerarPDF;
window.adicionarLinhaServico=adicionarLinhaServico;
window.adicionarLinhaPeca=adicionarLinhaPeca;
window.removerLinhaServico=removerLinhaServico;
window.removerLinhaPeca=removerLinhaPeca;
window.formatarValorInput=formatarValorInput;
window.atualizarResumoFinanceiro=atualizarResumoFinanceiro;
window.limparAssinatura=limparAssinatura;
window.toggleLuzPainel=toggleLuzPainel;
window.toggleCombustivel=toggleCombustivel;
window.gerarNumeroOS=gerarNumeroOS;
window.preencherNomeCliente=preencherNomeCliente;
window.abrirOCRCamera=abrirOCRCamera;
window.preencherChecklistDemoCompleto=preencherChecklistDemoCompleto;
window.ChecklistState=ChecklistState;
window.setAbaAtiva=setAbaAtiva;
window.getAbaAtiva=getAbaAtiva;

if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('page-checklist'))initChecklist();});
}else{
    if(document.getElementById('page-checklist'))initChecklist();
}
