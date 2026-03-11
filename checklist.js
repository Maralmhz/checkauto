// GERENCIAMENTO DE CHECKLISTS
const ChecklistState = {
    checklistAtual: null,
    abaAtiva: 'pecas', // 'pecas' ou 'servicos' — controlado pelas abas da UI
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
        'Terminal de direcao','Coxim do motor','Pivô dianteiro','Barra estabilizadora',
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

// ── ABA ATIVA (OCR por contexto) ──────────────────────────────────────────
function setAbaAtiva(aba) {
    ChecklistState.abaAtiva = aba; // 'pecas' ou 'servicos'
}

function getAbaAtiva() {
    return ChecklistState.abaAtiva || 'pecas';
}

// ── OCR POR CONTEXTO ──────────────────────────────────────────────────────
// Chame esta função ao pressionar o botão de OCR/câmera.
// Ela detecta a aba ativa e insere o resultado na tabela correta.
function iniciarOCRContextual(textoOCR) {
    const aba = getAbaAtiva();
    const linhas = (textoOCR || '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 1);

    if (linhas.length === 0) {
        showToast('Nenhum texto reconhecido pelo OCR.', 'info');
        return;
    }

    if (aba === 'servicos') {
        const tbody = document.getElementById('tabelaServicos');
        if (!tbody) return;
        linhas.forEach(linha => {
            const partes = linha.split(/\s{2,}|\t/);
            const descricao = partes[0] || linha;
            const valor = partes[1] ? partes[1].replace(/[^\d,\.]/g, '') : '';
            tbody.appendChild(criarLinhaServico({ id: Date.now() + Math.random(), descricao, valor }));
        });
        showToast(`${linhas.length} serviço(s) importado(s) via OCR.`, 'success');
    } else {
        const tbody = document.getElementById('tabelaPecas');
        if (!tbody) return;
        linhas.forEach(linha => {
            const partes = linha.split(/\s{2,}|\t/);
            const descricao = partes[0] || linha;
            const valor = partes[1] ? partes[1].replace(/[^\d,\.]/g, '') : '';
            tbody.appendChild(criarLinhaPeca({ id: Date.now() + Math.random(), descricao, valor }));
        });
        showToast(`${linhas.length} peça(s) importada(s) via OCR.`, 'success');
    }
    atualizarResumoFinanceiro();
}

// Abre câmera / input de imagem e processa OCR (usa Tesseract se disponível)
async function abrirOCRCamera() {
    const aba = getAbaAtiva();
    const label = aba === 'servicos' ? 'SERVIÇOS' : 'PEÇAS';

    // Cria input de arquivo invisível
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) { document.body.removeChild(input); return; }

        showToast(`Processando OCR → ${label}...`, 'info');

        // Se Tesseract.js estiver disponível
        if (typeof Tesseract !== 'undefined') {
            try {
                const result = await Tesseract.recognize(file, 'por', { logger: () => {} });
                iniciarOCRContextual(result.data.text);
            } catch (err) {
                showToast('Erro no OCR: ' + err.message, 'danger');
            }
        } else {
            // Fallback: lê o nome do arquivo como demonstração
            showToast('Tesseract não carregado. Importe o texto manualmente.', 'info');
        }
        document.body.removeChild(input);
    };
    input.click();
}

function initChecklist(osId = null, veiculoId = null, clienteId = null) {
    console.log('Inicializando checklist...', { osId, veiculoId, clienteId });
    if (osId) {
        const checklistExistente = AppState.data.checklists?.find(c => c.osId === osId);
        if (checklistExistente) {
            ChecklistState.checklistAtual = checklistExistente;
            preencherFormularioChecklist();
        } else {
            criarNovoChecklist(osId, veiculoId, clienteId);
        }
    } else {
        criarNovoChecklist(null, veiculoId, clienteId);
    }
    setupAutoComplete();
    setupNavigacaoTeclado();
    setupUploadFotos();
    setupAssinaturaCanvas();
    atualizarResumoFinanceiro();
    popularSelectsChecklist();
    _setupAbaListeners();
}

// Detecta clique nas abas Peças / Serviços e atualiza abaAtiva
function _setupAbaListeners() {
    document.querySelectorAll('[data-aba]').forEach(btn => {
        btn.addEventListener('click', () => setAbaAtiva(btn.dataset.aba));
    });
    // Compatibilidade com padrão de tab via class
    document.querySelectorAll('.tab-pecas, [href="#pecas"], [onclick*="pecas"]').forEach(el => {
        el.addEventListener('click', () => setAbaAtiva('pecas'));
    });
    document.querySelectorAll('.tab-servicos, [href="#servicos"], [onclick*="servicos"]').forEach(el => {
        el.addEventListener('click', () => setAbaAtiva('servicos'));
    });
}

function popularSelectsChecklist() {}
function atualizarVeiculosChecklist(clienteId) {}

function gerarNumeroOS() {
    const placaInput = document.getElementById('checklistVeiculoPlaca');
    if (!placaInput) return;
    const placa = placaInput.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (placa.length < 3) return;
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = String(hoje.getFullYear()).slice(-2);
    const numeroOS = `${placa}-${dia}${mes}${ano}`;
    const numeroOSEl = document.getElementById('checklistNumeroOS');
    if (numeroOSEl) numeroOSEl.textContent = numeroOS;
}

function preencherFormularioChecklist() {
    if (!ChecklistState.checklistAtual) return;
    const checklist = ChecklistState.checklistAtual;
    const cliente = (AppState.data.clientes || []).find(c => c.id == checklist.clienteId);
    const veiculo = (AppState.data.veiculos || []).find(v => v.id == checklist.veiculoId);
    const clienteNome = document.getElementById('checklistClienteNome');
    const clienteCPF = document.getElementById('checklistClienteCPF');
    const veiculoPlaca = document.getElementById('checklistVeiculoPlaca');
    const veiculoModelo = document.getElementById('checklistVeiculoModelo');
    if (clienteNome) clienteNome.value = cliente?.nome || checklist.clienteNome || '';
    if (clienteCPF) clienteCPF.value = cliente?.cpf || checklist.clienteCPF || '';
    if (veiculoPlaca) veiculoPlaca.value = veiculo?.placa || checklist.veiculoPlaca || '';
    if (veiculoModelo) veiculoModelo.value = veiculo?.modelo || checklist.veiculoModelo || '';
    const hodometro = document.getElementById('hodometro');
    const observacoes = document.getElementById('observacoes');
    const nivelCombustivel = document.getElementById('nivelCombustivel');
    if (hodometro) hodometro.value = checklist.hodometro || '';
    if (observacoes) observacoes.value = checklist.observacoes || '';
    if (nivelCombustivel && typeof checklist.nivelCombustivel === 'number') {
        nivelCombustivel.value = checklist.nivelCombustivel;
    }
    if (checklist.numeroOS && document.getElementById('checklistNumeroOS')) {
        document.getElementById('checklistNumeroOS').textContent = checklist.numeroOS;
    } else {
        gerarNumeroOS();
    }
    if (checklist.itens) {
        Object.entries(checklist.itens).forEach(([id, checked]) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!checked;
        });
    }
}

function preencherNomeCliente(nome) {
    if (!nome) return;
    const normalizar = (texto = '') => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const nomeBusca = normalizar(nome);
    const cliente = (AppState.data.clientes || []).find(c => normalizar(c.nome) === nomeBusca);
    if (!cliente) return;
    const cpfInput = document.getElementById('checklistClienteCPF');
    if (cpfInput && !cpfInput.value) cpfInput.value = cliente.cpf || '';
    const veiculo = (AppState.data.veiculos || []).find(v => v.clienteId === cliente.id);
    if (veiculo) {
        const placaInput = document.getElementById('checklistVeiculoPlaca');
        const modeloInput = document.getElementById('checklistVeiculoModelo');
        if (placaInput && !placaInput.value) placaInput.value = veiculo.placa || '';
        if (modeloInput && !modeloInput.value) modeloInput.value = veiculo.modelo || '';
        gerarNumeroOS();
    }
}

function criarNovoChecklist(osId = null, veiculoId = null, clienteId = null) {
    ChecklistState.checklistAtual = {
        id: Date.now(), osId, veiculoId, clienteId,
        dataEntrada: new Date().toISOString(),
        hodometro: '', nivelCombustivel: 4, tipoCombustivel: [],
        itens: {
            estepe: false, macaco: false, chaveRoda: false, triangulo: false,
            extintor: false, radio: false, antena: false, acendedor: false,
            vidroEletrico: false, travaEletrica: false, buzina: false, bateria: false,
            rodasLiga: false, protetorCarter: false, chaveSegredo: false, tapetes: false,
            ar: false, abs: false, airbag: false, automatico: false,
            direcaoHidraulica: false, alarme: false
        },
        luzesAvarias: [],
        inspecaoVisual: { lataria: '', pneus: '', vidros: '', interior: '' },
        observacoes: '', fotos: [],
        assinaturaCliente: null, assinaturaTecnico: null, status: 'rascunho'
    };
    ChecklistState.servicosEPecas = {
        servicos: [], pecas: [], statusRegulacao: 'pendente',
        seguradora: '', regulador: '', dataRegulacao: null,
        documentoRegulacao: null, fotoVistoria: null
    };
}

function setupAutoComplete() {
    setupAutoCompleteGenerico('.input-peca-desc', ChecklistState.pecasComuns);
    setupAutoCompleteGenerico('.input-servico-desc', ChecklistState.servicosComuns);
}

function setupAutoCompleteGenerico(seletor, lista) {
    document.addEventListener('input', (e) => {
        if (!e.target.matches(seletor)) return;
        const valor = removerAcentos(e.target.value.toLowerCase());
        if (valor.length < 2) return;
        const sugestoes = lista.filter(item => removerAcentos(item.toLowerCase()).includes(valor));
        mostrarSugestoes(e.target, sugestoes);
    });
}

function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mostrarSugestoes(input, sugestoes) {
    const suggestoesExistentes = input.parentElement.querySelector('.autocomplete-sugestoes');
    if (suggestoesExistentes) suggestoesExistentes.remove();
    if (sugestoes.length === 0) return;
    const divSugestoes = document.createElement('div');
    divSugestoes.className = 'autocomplete-sugestoes';
    divSugestoes.style.cssText = `position:absolute;background:white;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-height:200px;overflow-y:auto;z-index:1000;width:${input.offsetWidth}px;margin-top:2px;`;
    sugestoes.slice(0, 5).forEach(sugestao => {
        const div = document.createElement('div');
        div.textContent = sugestao;
        div.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;';
        div.addEventListener('mouseenter', () => { div.style.background = '#f5f5f5'; });
        div.addEventListener('mouseleave', () => { div.style.background = 'white'; });
        div.addEventListener('click', () => { input.value = sugestao; divSugestoes.remove(); input.focus(); });
        divSugestoes.appendChild(div);
    });
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(divSugestoes);
    setTimeout(() => {
        document.addEventListener('click', function removerSugestoes(e) {
            if (!divSugestoes.contains(e.target) && e.target !== input) {
                divSugestoes.remove();
                document.removeEventListener('click', removerSugestoes);
            }
        });
    }, 100);
}

function setupNavigacaoTeclado() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if ((e.key === 'Tab' || e.key === 'Enter') &&
            (target.classList.contains('input-peca-desc') || target.classList.contains('input-peca-valor') ||
             target.classList.contains('input-servico-desc') || target.classList.contains('input-servico-valor'))) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (target.classList.contains('input-peca-valor')) {
                    adicionarLinhaPeca();
                } else if (target.classList.contains('input-servico-valor')) {
                    adicionarLinhaServico();
                } else {
                    const proximoCampo = target.parentElement.parentElement.querySelector(
                        target.classList.contains('input-peca-desc') ? '.input-peca-valor' : '.input-servico-valor'
                    );
                    if (proximoCampo) proximoCampo.focus();
                }
            }
        }
    });
}

function adicionarLinhaServico() {
    const tbody = document.getElementById('tabelaServicos');
    const novaLinha = criarLinhaServico();
    tbody.appendChild(novaLinha);
    const primeiroInput = novaLinha.querySelector('.input-servico-desc');
    if (primeiroInput) primeiroInput.focus();
    atualizarResumoFinanceiro();
}

function adicionarLinhaPeca() {
    const tbody = document.getElementById('tabelaPecas');
    const novaLinha = criarLinhaPeca();
    tbody.appendChild(novaLinha);
    const primeiroInput = novaLinha.querySelector('.input-peca-desc');
    if (primeiroInput) primeiroInput.focus();
    atualizarResumoFinanceiro();
}

function criarLinhaServico(servico = null) {
    const tr = document.createElement('tr');
    const id = servico?.id || Date.now();
    tr.innerHTML = `
        <td><input type="text" class="input-servico-desc" placeholder="Descricao do servico" value="${servico?.descricao || ''}" data-id="${id}"></td>
        <td><input type="text" class="input-servico-valor" placeholder="0,00" value="${servico?.valor || ''}" data-id="${id}" oninput="formatarValorInput(this); atualizarResumoFinanceiro();"></td>
        <td style="text-align:center;"><input type="checkbox" ${servico?.regulado ? 'checked' : ''} onchange="atualizarResumoFinanceiro()"></td>
        <td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaServico(this)" title="Remover"><i class="fas fa-trash"></i></button></td>
    `;
    return tr;
}

function criarLinhaPeca(peca = null) {
    const tr = document.createElement('tr');
    const id = peca?.id || Date.now();
    tr.innerHTML = `
        <td><input type="text" class="input-peca-desc" placeholder="Descricao da peca" value="${peca?.descricao || ''}" data-id="${id}"></td>
        <td><input type="text" class="input-peca-valor" placeholder="0,00" value="${peca?.valor || ''}" data-id="${id}" oninput="formatarValorInput(this); atualizarResumoFinanceiro();"></td>
        <td style="text-align:center;"><input type="checkbox" ${peca?.regulado ? 'checked' : ''} onchange="atualizarResumoFinanceiro()"></td>
        <td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaPeca(this)" title="Remover"><i class="fas fa-trash"></i></button></td>
    `;
    return tr;
}

function removerLinhaServico(btn) {
    btn.closest('tr').remove();
    atualizarResumoFinanceiro();
}
function removerLinhaPeca(btn) {
    btn.closest('tr').remove();
    atualizarResumoFinanceiro();
}

function formatarValorInput(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor === '') { input.value = ''; return; }
    valor = (parseInt(valor) / 100).toFixed(2);
    input.value = valor;
}

function atualizarResumoFinanceiro() {
    const servicos = coletarServicos();
    const pecas = coletarPecas();
    const totalServicos = servicos.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
    const totalPecas = pecas.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
    const servicosRegulados = servicos.filter(s => s.regulado).reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
    const pecasReguladas = pecas.filter(p => p.regulado).reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
    const totalRegulado = servicosRegulados + pecasReguladas;
    const totalPendente = (totalServicos + totalPecas) - totalRegulado;
    const totalGeral = totalServicos + totalPecas;
    const elTotalServicos = document.getElementById('totalServicos');
    const elTotalPecas = document.getElementById('totalPecas');
    const elTotalRegulado = document.getElementById('totalRegulado');
    const elTotalPendente = document.getElementById('totalPendente');
    const elTotalGeral = document.getElementById('totalGeral');
    if (elTotalServicos) elTotalServicos.textContent = formatMoney(totalServicos);
    if (elTotalPecas) elTotalPecas.textContent = formatMoney(totalPecas);
    if (elTotalRegulado) elTotalRegulado.textContent = formatMoney(totalRegulado);
    if (elTotalPendente) elTotalPendente.textContent = formatMoney(totalPendente);
    if (elTotalGeral) elTotalGeral.textContent = formatMoney(totalGeral);
}

function coletarServicos() {
    const linhas = document.querySelectorAll('#tabelaServicos tr');
    const servicos = [];
    linhas.forEach(linha => {
        const desc = linha.querySelector('.input-servico-desc')?.value;
        const valor = linha.querySelector('.input-servico-valor')?.value;
        const regulado = linha.querySelector('input[type="checkbox"]')?.checked;
        if (desc && valor) servicos.push({ descricao: desc, valor: parseFloat(valor) || 0, regulado: regulado || false });
    });
    return servicos;
}

function coletarPecas() {
    const linhas = document.querySelectorAll('#tabelaPecas tr');
    const pecas = [];
    linhas.forEach(linha => {
        const desc = linha.querySelector('.input-peca-desc')?.value;
        const valor = linha.querySelector('.input-peca-valor')?.value;
        const regulado = linha.querySelector('input[type="checkbox"]')?.checked;
        if (desc && valor) pecas.push({ descricao: desc, valor: parseFloat(valor) || 0, regulado: regulado || false });
    });
    return pecas;
}

function setupUploadFotos() {
    const inputFotos = document.getElementById('inputFotos');
    if (!inputFotos) return;
    inputFotos.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            if (file.type.startsWith('image/')) comprimirEAdicionarFoto(file);
        });
    });
}

function comprimirEAdicionarFoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 800, maxHeight = 600;
            let width = img.width, height = img.height;
            if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
            else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            adicionarFotoNaGaleria(canvas.toDataURL('image/jpeg', 0.7), file.name);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function adicionarFotoNaGaleria(dataUrl, nome) {
    const galeria = document.getElementById('galeriaFotos');
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.style.cssText = 'position:relative;display:inline-block;margin:5px;';
    div.innerHTML = `<img src="${dataUrl}" style="width:120px;height:90px;object-fit:cover;border-radius:4px;"><button onclick="removerFoto(this)" style="position:absolute;top:2px;right:2px;background:red;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;">x</button>`;
    galeria.appendChild(div);
    if (!ChecklistState.checklistAtual.fotos) ChecklistState.checklistAtual.fotos = [];
    ChecklistState.checklistAtual.fotos.push({ url: dataUrl, nome: nome });
}

function removerFoto(btn) { btn.parentElement.remove(); }

function setupAssinaturaCanvas() {
    setupCanvas('canvasAssinaturaCliente');
    setupCanvas('canvasAssinaturaTecnico');
}

function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let desenhando = false;
    canvas.addEventListener('mousedown', () => desenhando = true);
    canvas.addEventListener('mouseup', () => desenhando = false);
    canvas.addEventListener('mouseleave', () => desenhando = false);
    canvas.addEventListener('mousemove', (e) => {
        if (!desenhando) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke(); ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
}

function limparAssinatura(canvasId) {
    const canvas = document.getElementById(canvasId);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function toggleLuzPainel(luz) { event.target.closest('.luz-painel-btn').classList.toggle('active'); }
function toggleCombustivel(tipo) { event.target.closest('.combustivel-btn').classList.toggle('active'); }

function salvarChecklist() {
    const clienteNome = document.getElementById('checklistClienteNome')?.value?.trim() || '';
    const clienteCPF = document.getElementById('checklistClienteCPF')?.value?.trim() || '';
    const veiculoPlaca = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim();
    const veiculoModelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || '';
    let cliente = (AppState.data.clientes || []).find(c => c.nome?.trim().toLowerCase() === clienteNome.toLowerCase());
    if (!cliente && clienteNome) {
        cliente = { id: Date.now(), nome: clienteNome, cpf: clienteCPF, telefone: '', email: '', endereco: '' };
        AppState.data.clientes.push(cliente);
    }
    let veiculo = (AppState.data.veiculos || []).find(v => v.placa?.toUpperCase() === veiculoPlaca);
    if (!veiculo && veiculoPlaca && cliente) {
        veiculo = { id: Date.now() + 1, placa: veiculoPlaca, modelo: veiculoModelo || 'Nao informado', clienteId: cliente.id, chassis: '', ano: '', cor: '' };
        AppState.data.veiculos.push(veiculo);
    }
    const checklist = {
        ...ChecklistState.checklistAtual,
        clienteId: cliente?.id || null, clienteNome, clienteCPF,
        veiculoId: veiculo?.id || null, veiculoPlaca, veiculoModelo,
        numeroOS: document.getElementById('checklistNumeroOS')?.textContent,
        hodometro: document.getElementById('hodometro')?.value,
        nivelCombustivel: parseInt(document.getElementById('nivelCombustivel')?.value),
        observacoes: document.getElementById('observacoes')?.value,
        itens: coletarItensChecklist(),
        assinaturaCliente: document.getElementById('canvasAssinaturaCliente')?.toDataURL(),
        assinaturaTecnico: document.getElementById('canvasAssinaturaTecnico')?.toDataURL(),
        status: 'completo'
    };
    ChecklistState.checklistAtual = checklist;
    const servicosEPecas = {
        servicos: coletarServicos(), pecas: coletarPecas(),
        statusRegulacao: document.getElementById('statusRegulacao')?.value,
        seguradora: document.getElementById('seguradora')?.value,
        regulador: document.getElementById('regulador')?.value,
        dataRegulacao: document.getElementById('dataRegulacao')?.value
    };
    if (!AppState.data.checklists) AppState.data.checklists = [];
    const index = AppState.data.checklists.findIndex(c => c.id === checklist.id);
    if (index >= 0) AppState.data.checklists[index] = checklist;
    else AppState.data.checklists.push(checklist);
    if (!AppState.data.servicosEPecas) AppState.data.servicosEPecas = [];
    const indexSP = AppState.data.servicosEPecas.findIndex(sp => sp.checklistId === checklist.id);
    servicosEPecas.checklistId = checklist.id;
    if (indexSP >= 0) AppState.data.servicosEPecas[indexSP] = servicosEPecas;
    else AppState.data.servicosEPecas.push(servicosEPecas);
    saveToLocalStorage();
    if (typeof renderClientes === 'function') renderClientes();
    if (typeof renderVeiculos === 'function') renderVeiculos();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast('Checklist salvo com sucesso!');
}

function coletarItensChecklist() {
    const itens = {};
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => { itens[cb.id] = cb.checked; });
    return itens;
}

function gerarImagemMockChecklist(titulo, corFundo = '#0b5ed7') {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = corFundo; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(60, 60, 1080, 680);
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 56px Arial'; ctx.fillText('FASTCAR', 110, 180);
    ctx.fillStyle = '#374151'; ctx.font = '36px Arial'; ctx.fillText(titulo, 110, 250);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 8; ctx.strokeRect(110, 300, 980, 360);
    ctx.fillStyle = '#6b7280'; ctx.font = '30px Arial'; ctx.fillText('Imagem demonstrativa', 150, 500);
    return canvas.toDataURL('image/jpeg', 0.75);
}

// ── DEMO COM 30+ PEÇAS E SERVIÇOS (SEM TOASTS EXCESSIVOS) ────────────────
function preencherChecklistDemoCompleto(gerarPdfAoFinal = true) {
    const pageChecklist = document.getElementById('page-checklist');
    if (!pageChecklist) return;
    const setVal = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    setVal('checklistClienteNome', 'Joao Silva de Almeida');
    setVal('checklistClienteCPF', '123.456.789-00');
    setVal('checklistVeiculoPlaca', 'ABC-1234');
    setVal('checklistVeiculoModelo', 'Fiat Uno 1.0 Fire Flex 2012');
    setVal('hodometro', '152364');
    setVal('nivelCombustivel', '4');
    setVal('inspecaoLataria', 'Risco na porta dianteira esquerda.');
    setVal('inspecaoPneus', '4 pneus Pirelli 80% de vida util.');
    setVal('inspecaoVidros', 'Trinca no para-brisa lado passageiro.');
    setVal('inspecaoInterior', 'Banco com desgaste lateral.');
    setVal('observacoes', 'Veiculo entregue para orcamento completo.');
    setVal('statusRegulacao', 'parcial');
    setVal('seguradora', 'Porto Seguro');
    setVal('regulador', 'Carlos Menezes');
    setVal('dataRegulacao', new Date().toISOString().slice(0, 10));
    gerarNumeroOS();
    document.querySelectorAll('.combustivel-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes('flex'));
    });
    const luzesLigadas = ['motor', 'freio', 'abs'];
    document.querySelectorAll('.luz-painel-btn').forEach(btn => {
        btn.classList.toggle('active', luzesLigadas.some(c => btn.textContent.toLowerCase().includes(c)));
    });
    Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]'))
        .forEach((cb, i) => { cb.checked = i % 3 === 0 || i % 5 === 0; });

    const tabelaServicos = document.getElementById('tabelaServicos');
    const tabelaPecas = document.getElementById('tabelaPecas');
    if (tabelaServicos) tabelaServicos.innerHTML = '';
    if (tabelaPecas) tabelaPecas.innerHTML = '';

    // 35 SERVIÇOS de demo
    const servicosDemo = [
        'Mao de obra pintura lateral','Mao de obra funilaria parachoque','Troca de oleo e filtro',
        'Alinhamento completo 4 rodas','Balanceamento 4 rodas','Diagnostico eletronico completo',
        'Higienizacao interna completa','Polimento tecnico 3 fases','Revisao sistema de freios',
        'Troca fluido de freio DOT4','Limpeza bicos injetores ultrasom','Regulagem farois direito/esq.',
        'Calibracao e rodizio pneus','Revisao ar-condicionado completa','Inspecao estrutural carroceria',
        'Reaperto geral suspensao','Geometria dianteira e traseira','Reparo eletrico painel',
        'Teste de rodagem pos-servico','Troca de bateria 60Ah','Retifica tambor freio traseiro',
        'Troca kit correia dentada','Servico cambio automatico','Troca pastilha freio dianteira',
        'Limpeza corpo borboleta','Escaneamento modulo ECU','Troca fluido direcao hidraulica',
        'Servico ar cond. carga gas','Lavagem detalhada externa','Lavagem motor a vapor',
        'Troca amortecedor dianteiro','Troca amortecedor traseiro','Instalacao acessorio eletrico',
        'Codificacao chave canivete','Pintura para-choque traseiro'
    ];

    // 35 PEÇAS de demo
    const pecasDemo = [
        'Parachoque dianteiro','Parachoque traseiro','Farol esquerdo completo',
        'Lanterna traseira direita','Retrovisor esquerdo eletrico','Para-lama dianteiro esq.',
        'Capo original','Porta dianteira esquerda','Pastilha freio dianteira',
        'Disco freio dianteiro par','Bateria 60Ah Heliar','Filtro de oleo Wega',
        'Filtro de ar Tecfil','Kit correia dentada Gates','Vela ignicao NGK iridium',
        'Oleo motor 5W30 sintético 4L','Pneu 175/65 R14 Pirelli','Amortecedor dianteiro esq.',
        'Radiador aluminio','Alternador remanufaturado','Kit embreagem completo',
        'Bomba dagua original','Terminal direcao esquerdo','Rolamento dianteiro esq.',
        'Sensor ABS dianteiro dir.','Coxim motor dianteiro','Pivo dianteiro esquerdo',
        'Bucha bandeja inferior esq.','Cabo vela jogo 4 pecas','Tampa oleo motor',
        'Junta cabecote completa','Correia auxiliar','Kit bomba combustivel',
        'Mangueira radiador superior','Reservatorio agua destilada'
    ];

    servicosDemo.forEach((descricao, i) => {
        tabelaServicos?.appendChild(criarLinhaServico({ id: Date.now() + i, descricao, valor: (120 + i * 17.35).toFixed(2), regulado: i % 2 === 0 }));
    });
    pecasDemo.forEach((descricao, i) => {
        tabelaPecas?.appendChild(criarLinhaPeca({ id: Date.now() + 100 + i, descricao, valor: (180 + i * 26.7).toFixed(2), regulado: i % 3 === 0 }));
    });

    const galeria = document.getElementById('galeriaFotos');
    if (galeria) galeria.innerHTML = '';
    if (!ChecklistState.checklistAtual) criarNovoChecklist();
    ChecklistState.checklistAtual.fotos = [];
    const cores = ['#0b5ed7','#198754','#6f42c1','#fd7e14','#dc3545'];
    ['Vista frontal','Lateral esquerda','Lateral direita','Traseira','Interior'].forEach((titulo, i) => {
        adicionarFotoNaGaleria(gerarImagemMockChecklist(titulo, cores[i % cores.length]), titulo + '.jpg');
    });
    const preencherAssinatura = (canvasId, nome) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(16, 90); ctx.bezierCurveTo(60, 20, 120, 130, 190, 70);
        ctx.bezierCurveTo(210, 55, 235, 85, 275, 45); ctx.stroke();
        ctx.font = '12px Arial'; ctx.fillStyle = '#4b5563'; ctx.fillText(nome, 12, 140);
    };
    preencherAssinatura('canvasAssinaturaCliente', 'Joao Silva');
    preencherAssinatura('canvasAssinaturaTecnico', 'Rafael Tecnico');
    atualizarResumoFinanceiro();
    // SEM toast aqui — o toast único sai ao fim do gerarPDF
    if (gerarPdfAoFinal) gerarPDF();
}

function getWhatsAppIconDataURL(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    const s = size / 32;
    ctx.beginPath();
    ctx.moveTo(16*s, 5*s);
    ctx.arc(16*s, 16*s, 11*s, -Math.PI*0.9, Math.PI*0.9);
    ctx.arc(16*s, 16*s, 11*s, Math.PI*0.9, Math.PI*1.1);
    ctx.lineTo(7*s, 27*s);
    ctx.arc(16*s, 16*s, 11*s, Math.PI*1.1, -Math.PI*0.9);
    ctx.fill();
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.arc(16*s, 16*s, 8.5*s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(12*s)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2706', 16*s, 16*s);
    return canvas.toDataURL('image/png');
}

function normalizarTelefoneWhatsApp(telefone) {
    if (!telefone) return null;
    let num = telefone.replace(/\D/g, '');
    if (!num || num.length < 8) return null;
    if (!num.startsWith('55') && (num.length === 10 || num.length === 11)) {
        num = '55' + num;
    }
    return num;
}

function abrirWhatsAppComPDF(nomeArquivo, telefone, osNum) {
    const mensagem = encodeURIComponent(
        `Ola! Segue o PDF da Ordem de Servico *${osNum}* da Fast Car Centro Automotivo.\nArquivo baixado: *${nomeArquivo}*\nQualquer duvida, estamos a disposicao!`
    );
    const numLimpo = normalizarTelefoneWhatsApp(telefone);
    const url = numLimpo
        ? `https://wa.me/${numLimpo}?text=${mensagem}`
        : `https://wa.me/?text=${mensagem}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

async function gerarPDF() {
    if (typeof window.jspdf === 'undefined') { showToast('Biblioteca jsPDF nao carregada', 'info'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const oficina = {
        nome: 'FAST CAR CENTRO AUTOMOTIVO',
        endereco: 'AV. REGULUS, 248 - JARDIM RIACHO DAS PEDRAS, CONTAGEM - MG, 32241-210',
        telefone: '(31) 2342-1699',
        cnpj: '60.516.882/0001-74'
    };

    const osNum = document.getElementById('checklistNumeroOS')?.textContent?.trim() || 'SEM-OS';
    const cliente = document.getElementById('checklistClienteNome')?.value?.trim() || 'NAO INFORMADO';
    const cpf = document.getElementById('checklistClienteCPF')?.value?.trim() || '-';
    const telefoneCliente = document.getElementById('telefoneCliente')?.value?.trim() || '';
    const placa = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim() || 'SEMPLACA';
    const modelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || '-';
    const chassis = document.getElementById('chassisVeiculo')?.value?.trim() || '-';
    const hodometro = document.getElementById('hodometro')?.value?.trim() || '-';
    const combustivelNivel = document.getElementById('nivelCombustivel')?.value || '0';
    const observacoes = document.getElementById('observacoes')?.value?.trim() || '-';
    const combustivelTipos = Array.from(document.querySelectorAll('.combustivel-btn.active')).map(btn => btn.textContent.trim()).filter(Boolean);
    const inspecaoVisual = {
        lataria: document.getElementById('inspecaoLataria')?.value?.trim() || '-',
        pneus: document.getElementById('inspecaoPneus')?.value?.trim() || '-',
        vidros: document.getElementById('inspecaoVidros')?.value?.trim() || '-',
        interior: document.getElementById('inspecaoInterior')?.value?.trim() || '-'
    };
    const itensEntrada = Array.from(document.querySelectorAll('.checklist-item')).map(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const labelEl = item.querySelector('label') || item.querySelector('.badge') || item.querySelector('span');
        const label = labelEl?.textContent?.trim() || checkbox?.id || 'Item';
        return { label, marcado: !!checkbox?.checked };
    });

    const servicos = coletarServicos();
    const pecas = coletarPecas();
    const fotos = (ChecklistState.checklistAtual?.fotos || []).slice(0, 9);
    const assinaturaCliente = document.getElementById('canvasAssinaturaCliente')?.toDataURL('image/png');
    const assinaturaTecnico = document.getElementById('canvasAssinaturaTecnico')?.toDataURL('image/png');

    const now = new Date();
    const dataEmissao = now.toLocaleDateString('pt-BR');
    const horaEmissao = now.toLocaleTimeString('pt-BR');
    const dataValidade = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    const dataArquivo = dataEmissao.replace(/\//g, '-');
    const nomeArquivo = 'OS-' + placa + '-' + dataArquivo + '_CHECKLIST.pdf';
    const formatCurrency = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

    const PAGE_W = 210, PAGE_H = 297;
    const MARGIN_X = 12, MARGIN_Y = 10;
    const CONTENT_X = 22;
    const CONTENT_W = 166;
    const CONTENT_TOP = 44;
    const CONTENT_BOTTOM = 268;
    const whatsappIconData = getWhatsAppIconDataURL(64);

    const COL_GAP = 4;
    const COL_W = (CONTENT_W - COL_GAP) / 2;
    const COL_PECAS_X = CONTENT_X;
    const COL_SERV_X = CONTENT_X + COL_W + COL_GAP;

    const drawBasePage = () => { doc.setDrawColor(210, 210, 210); doc.rect(MARGIN_X, MARGIN_Y, PAGE_W - MARGIN_X*2, PAGE_H - MARGIN_Y*2); };

    const drawHeader = () => {
        doc.setDrawColor(225, 225, 225);
        doc.line(22, 17, 188, 17);
        doc.setFillColor(255, 255, 255); doc.setDrawColor(225, 225, 225);
        doc.roundedRect(22, 22, 20, 14, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(205, 25, 25); doc.setFontSize(8);
        doc.text('FAST CAR', 32, 30, { align: 'center' });
        doc.setFontSize(10.5); doc.text(oficina.nome, 45, 25);
        doc.setTextColor(110, 110, 110); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.3);
        doc.text(oficina.endereco, 45, 29);
        doc.addImage(whatsappIconData, 'PNG', 45, 30.2, 3.2, 3.2);
        doc.text(oficina.telefone, 49.5, 32.5);
        doc.text('CNPJ: ' + oficina.cnpj, 45, 36);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 120, 120); doc.setFontSize(6.4);
        doc.text('ORDEM DE SERVICO', 188, 31, { align: 'right' });
        doc.setTextColor(205, 25, 25); doc.setFontSize(12);
        doc.text(osNum, 188, 36.5, { align: 'right' });
        doc.setDrawColor(220, 40, 40); doc.setLineWidth(0.7);
        doc.line(22, 40.5, 188, 40.5); doc.setLineWidth(0.2);
    };

    const drawFooterSimples = () => {
        doc.setDrawColor(190, 190, 190); doc.line(22, 270, 188, 270);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(5.6);
        doc.text('DOCUMENTO GERADO POR ' + oficina.nome + ' | CNPJ: ' + oficina.cnpj + ' | ' + dataEmissao + ' ' + horaEmissao, 105, 275, { align: 'center' });
    };

    const drawFooterComAssinaturas = () => {
        doc.setDrawColor(190, 190, 190); doc.line(22, 248, 188, 248);
        doc.setDrawColor(160, 160, 160);
        doc.line(22, 260, 95, 260);
        doc.line(115, 260, 188, 260);
        if (assinaturaCliente) doc.addImage(assinaturaCliente, 'PNG', 27, 248, 62, 11, undefined, 'FAST');
        if (assinaturaTecnico) doc.addImage(assinaturaTecnico, 'PNG', 120, 248, 62, 11, undefined, 'FAST');
        doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(5.6);
        doc.text('ASSINATURA DO CLIENTE', 55, 264, { align: 'center' });
        doc.text('ASSINATURA DO TECNICO', 155, 264, { align: 'center' });
        doc.text('DOCUMENTO GERADO POR ' + oficina.nome + ' | CNPJ: ' + oficina.cnpj + ' | ' + dataEmissao + ' ' + horaEmissao, 105, 275, { align: 'center' });
    };

    const drawSectionBox = (x, y, w, h, title, lines = []) => {
        doc.setDrawColor(215, 215, 215); doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 45, 45); doc.setFontSize(6.5);
        doc.text(title.toUpperCase(), x + 2, y + 5);
        doc.setDrawColor(235, 235, 235); doc.line(x + 1.5, y + 6.5, x + w - 1.5, y + 6.5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70); doc.setFontSize(8);
        let ly = y + 11;
        lines.forEach((line) => {
            doc.splitTextToSize(line, w - 4).forEach((part) => {
                if (ly < y + h - 1) { doc.text(part, x + 2, ly); ly += 3.8; }
            });
        });
    };

    const drawInspectionChecks = (x, y, w, h, items) => {
        doc.setDrawColor(215, 215, 215); doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 45, 45); doc.setFontSize(6.5);
        doc.text('INSPECAO DE ENTRADA', x + 2, y + 5);
        doc.setDrawColor(235, 235, 235); doc.line(x + 1.5, y + 6.5, x + w - 1.5, y + 6.5);
        const badgeH = 4.5, badgePadX = 2, gap = 1.5;
        let curX = x + 2, curY = y + 10;
        const maxX = x + w - 2, maxY = y + h - 2;
        doc.setFontSize(5.8);
        items.forEach((item) => {
            const textWidth = doc.getTextWidth(item.label);
            const badgeW = textWidth + badgePadX * 2 + 4;
            if (curX + badgeW > maxX) { curX = x + 2; curY += badgeH + gap; }
            if (curY + badgeH > maxY) return;
            if (item.marcado) { doc.setFillColor(25, 135, 84); doc.setTextColor(255, 255, 255); }
            else { doc.setFillColor(220, 220, 220); doc.setTextColor(100, 100, 100); }
            doc.roundedRect(curX, curY, badgeW, badgeH, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text(item.marcado ? '+' : '-', curX + 1.5, curY + 3.3);
            doc.setFont('helvetica', 'normal');
            doc.text(item.label, curX + 4.5, curY + 3.3);
            curX += badgeW + gap;
        });
    };

    const compressPhoto = (dataUrl) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 640, scale = Math.min(1, maxW / img.width);
            canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

    const TERMO_H = 58;
    const drawTermoAprovacao = (x, y, w) => {
        const h = TERMO_H;
        doc.setDrawColor(200, 200, 200); doc.setFillColor(252, 252, 252);
        doc.roundedRect(x, y, w, h, 2, 2, 'FD');
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(x, y, w, 7, 2, 2, 'F');
        doc.rect(x, y + 3.5, w, 3.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50); doc.setFontSize(7);
        doc.text('APROVACAO E CIENCIA DO CLIENTE', x + w / 2, y + 5.2, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60); doc.setFontSize(6.2);
        const termoTexto = [
            'Declaro estar ciente e de acordo com os servicos e pecas relacionados neste orcamento,',
            'autorizando a Fast Car Centro Automotivo a executar os servicos descritos acima.',
            'ATENCAO: Este orcamento e valido por 15 dias a partir da data de emissao (' + dataEmissao + '), vencendo em ' + dataValidade + '.',
            'Apos aprovacao, podem ocorrer complementos de orcamento durante a desmontagem ou no decorrer da execucao dos servicos,',
            'situacao em que o cliente sera previamente comunicado para nova autorizacao.'
        ];
        let ty = y + 10;
        termoTexto.forEach(linha => { doc.text(linha, x + w / 2, ty, { align: 'center' }); ty += 4; });
        const assinLinha = y + 36;
        const colW3 = (w - 10) / 3;
        [0, 1, 2].forEach(i => {
            const cx = x + 4 + i * (colW3 + 1);
            doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.4);
            doc.line(cx, assinLinha, cx + colW3, assinLinha);
            doc.setLineWidth(0.2);
        });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.setFontSize(5.8);
        const labels3 = ['Aprovado por / Assinatura do Cliente', 'Responsavel Tecnico / Aprovador', 'Data e Hora da Aprovacao'];
        labels3.forEach((lbl, i) => {
            const cx = x + 4 + i * (colW3 + 1);
            doc.text(lbl, cx + colW3 / 2, assinLinha + 5, { align: 'center' });
        });
        doc.setFont('helvetica', 'italic'); doc.setTextColor(130, 130, 130); doc.setFontSize(5.2);
        doc.text('"Estou ciente dos termos acima e autorizo a execucao dos servicos."', x + w / 2, y + h - 2, { align: 'center' });
    };

    // ── PAGINAÇÃO: 30 linhas mínimas por página ───────────────────────────
    const ROW_H = 3.7;
    const TITLE_H = 5;
    const HDR_H = 6;
    const TOTAL_H = 11;
    const FIRST_ROW_Y = CONTENT_TOP + TITLE_H + HDR_H;

    // Garante mínimo 30 linhas por página
    const linhasPorPaginaCalculado = Math.floor((CONTENT_BOTTOM - FIRST_ROW_Y - TOTAL_H - 2) / ROW_H);
    const linhasPorPagina = Math.max(30, linhasPorPaginaCalculado);

    const drawColHeader = (x, y, w, title, colorRGB) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30); doc.setFontSize(8.5);
        doc.text(title, x, y + TITLE_H - 1);
        const hy = y + TITLE_H;
        doc.setDrawColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.roundedRect(x, hy, w, HDR_H, 1.5, 1.5);
        doc.setDrawColor(205, 205, 205);
        doc.line(x + w * 0.68, hy, x + w * 0.68, hy + HDR_H);
        doc.line(x, hy + HDR_H, x + w, hy + HDR_H);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 55, 55); doc.setFontSize(6.8);
        doc.text('DESCRICAO', x + 1.6, hy + 4.4);
        doc.text('VALOR', x + w * 0.68 + 1.6, hy + 4.4);
    };

    const drawContHeader = (x, y, w, title, colorRGB) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100); doc.setFontSize(7);
        doc.text(title + ' (cont.)', x, y + TITLE_H - 1);
        const hy = y + TITLE_H;
        doc.setDrawColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.roundedRect(x, hy, w, HDR_H, 1.5, 1.5);
        doc.setDrawColor(205, 205, 205);
        doc.line(x + w * 0.68, hy, x + w * 0.68, hy + HDR_H);
        doc.line(x, hy + HDR_H, x + w, hy + HDR_H);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 55, 55); doc.setFontSize(6.8);
        doc.text('DESCRICAO', x + 1.6, hy + 4.4);
        doc.text('VALOR', x + w * 0.68 + 1.6, hy + 4.4);
    };

    const drawTotalCard = (x, y, w, colorRGB, label, total) => {
        doc.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.roundedRect(x, y, w, 9, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.setFontSize(8);
        doc.text(label, x + 3, y + 6);
        doc.text(formatCurrency(total), x + w - 3, y + 6, { align: 'right' });
    };

    const drawTotalGeral = (x, y, w, totalPecas, totalServicos) => {
        const total = totalPecas + totalServicos;
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
        doc.line(x, y + 1, x + w, y + 1);
        doc.setLineWidth(0.2);
        doc.setFillColor(22, 163, 74);
        doc.roundedRect(x, y + 3, w, 11, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.setFontSize(11);
        doc.text('TOTAL GERAL DO ORCAMENTO:', x + 4, y + 10.5);
        doc.setFontSize(12);
        doc.text(formatCurrency(total), x + w - 4, y + 10.5, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.setFontSize(6);
        doc.text('Emissao: ' + dataEmissao + ' ' + horaEmissao + '   |   Validade do orcamento: ' + dataValidade, x + w / 2, y + 17, { align: 'center' });
        return y + 20;
    };

    // ── PÁGINA 1 ──────────────────────────────────────────────────────────
    drawBasePage(); drawHeader();
    drawSectionBox(22, 44, 82, 20, 'CLIENTE', [
        'NOME: ' + cliente,
        'CPF/CNPJ: ' + cpf + '  |  TEL: ' + (telefoneCliente || 'Nao informado')
    ]);
    drawSectionBox(107, 44, 81, 20, 'VEICULO', [
        modelo + '  ' + placa,
        'KM: ' + hodometro + '  |  ' + (combustivelTipos.join('/') || 'Combustivel') + ' (' + combustivelNivel + '%)',
        'CHASSI: ' + chassis
    ]);
    drawSectionBox(22, 67, 166, 13, 'SERVICOS SOLICITADOS', servicos.length ? servicos.map(s => s.descricao) : ['-']);
    drawInspectionChecks(22, 83, 166, 30, itensEntrada);
    drawSectionBox(22, 116, 166, 16, 'OBSERVACOES DA INSPECAO', [
        'Lataria: ' + inspecaoVisual.lataria,
        'Pneus: ' + inspecaoVisual.pneus,
        'Vidros: ' + inspecaoVisual.vidros,
        'Interior: ' + inspecaoVisual.interior
    ]);
    const fotosComprimidas = [];
    for (const foto of fotos) fotosComprimidas.push({ nome: foto.nome, url: await compressPhoto(foto.url) });
    const fotoBoxY = 135, fotoBoxH = 100;
    drawSectionBox(22, fotoBoxY, 166, fotoBoxH, 'FOTOS DO VEICULO', []);
    if (fotosComprimidas.length > 0) {
        const fotoLarguraCima = 51, fotoAlturaCima = 36;
        fotosComprimidas.slice(0, 3).forEach((foto, i) => {
            const fx = 24 + i * (fotoLarguraCima + 2), fy = fotoBoxY + 8;
            doc.setDrawColor(200, 40, 40); doc.roundedRect(fx, fy, fotoLarguraCima, fotoAlturaCima, 1, 1);
            doc.addImage(foto.url, 'JPEG', fx + 0.5, fy + 0.5, fotoLarguraCima - 1, fotoAlturaCima - 1, undefined, 'FAST');
        });
        const fotoLarguraBaixo = 25, fotoAlturaBaixo = 18;
        fotosComprimidas.slice(3, 9).forEach((foto, i) => {
            const fx = 24 + i * (fotoLarguraBaixo + 2.2), fy = fotoBoxY + 8 + fotoAlturaCima + 3;
            doc.setDrawColor(200, 40, 40); doc.roundedRect(fx, fy, fotoLarguraBaixo, fotoAlturaBaixo, 1, 1);
            doc.addImage(foto.url, 'JPEG', fx + 0.5, fy + 0.5, fotoLarguraBaixo - 1, fotoAlturaBaixo - 1, undefined, 'FAST');
        });
    }
    drawFooterComAssinaturas();

    // ── PÁGINAS DE PEÇAS + SERVIÇOS (mín. 30 linhas/página) ──────────────
    const totalPecasVal = pecas.reduce((s, p) => s + (Number(p.valor) || 0), 0);
    const totalServicosVal = servicos.reduce((s, p) => s + (Number(p.valor) || 0), 0);

    const maxItens = Math.max(pecas.length, servicos.length);
    const numPaginas = Math.max(1, Math.ceil(maxItens / linhasPorPagina));

    for (let pg = 0; pg < numPaginas; pg++) {
        doc.addPage();
        drawBasePage();
        drawHeader();

        const idxStart = pg * linhasPorPagina;
        const idxEnd = Math.min(idxStart + linhasPorPagina, maxItens);
        const isFirst = pg === 0;
        const isLast = pg === numPaginas - 1;

        if (isFirst) {
            drawColHeader(COL_PECAS_X, CONTENT_TOP, COL_W, 'PECAS', [20, 105, 200]);
            drawColHeader(COL_SERV_X, CONTENT_TOP, COL_W, 'SERVICOS', [220, 40, 40]);
        } else {
            drawContHeader(COL_PECAS_X, CONTENT_TOP, COL_W, 'PECAS', [20, 105, 200]);
            drawContHeader(COL_SERV_X, CONTENT_TOP, COL_W, 'SERVICOS', [220, 40, 40]);
        }

        let rowY = CONTENT_TOP + TITLE_H + HDR_H + ROW_H;

        for (let i = idxStart; i < idxEnd; i++) {
            if (i > idxStart) {
                doc.setDrawColor(228, 228, 228);
                doc.line(COL_PECAS_X, rowY - ROW_H * 0.6, COL_PECAS_X + COL_W, rowY - ROW_H * 0.6);
                doc.line(COL_SERV_X, rowY - ROW_H * 0.6, COL_SERV_X + COL_W, rowY - ROW_H * 0.6);
            }

            doc.setFont('helvetica', 'normal'); doc.setFontSize(5.6); doc.setTextColor(50, 50, 50);

            if (i < pecas.length) {
                const desc = doc.splitTextToSize(pecas[i].descricao || '-', COL_W * 0.65)[0] || '-';
                doc.text(desc, COL_PECAS_X + 1.6, rowY);
                doc.text(formatCurrency(pecas[i].valor || 0), COL_PECAS_X + COL_W * 0.68 + 1.6, rowY);
            }

            if (i < servicos.length) {
                const desc = doc.splitTextToSize(servicos[i].descricao || '-', COL_W * 0.65)[0] || '-';
                doc.text(desc, COL_SERV_X + 1.6, rowY);
                doc.text(formatCurrency(servicos[i].valor || 0), COL_SERV_X + COL_W * 0.68 + 1.6, rowY);
            }

            rowY += ROW_H;
        }

        const tableTop = CONTENT_TOP + TITLE_H;
        const tableH = HDR_H + (idxEnd - idxStart) * ROW_H;

        doc.setDrawColor(20, 105, 200);
        doc.roundedRect(COL_PECAS_X, tableTop, COL_W, tableH, 1.5, 1.5);
        doc.setDrawColor(205, 205, 205);
        doc.line(COL_PECAS_X + COL_W * 0.68, tableTop, COL_PECAS_X + COL_W * 0.68, tableTop + tableH);

        doc.setDrawColor(220, 40, 40);
        doc.roundedRect(COL_SERV_X, tableTop, COL_W, tableH, 1.5, 1.5);
        doc.setDrawColor(205, 205, 205);
        doc.line(COL_SERV_X + COL_W * 0.68, tableTop, COL_SERV_X + COL_W * 0.68, tableTop + tableH);

        if (isLast) {
            const totalCardY = tableTop + tableH + 3;
            drawTotalCard(COL_PECAS_X, totalCardY, COL_W, [20, 105, 200], 'TOTAL PECAS', totalPecasVal);
            drawTotalCard(COL_SERV_X, totalCardY, COL_W, [220, 40, 40], 'TOTAL SERVICOS', totalServicosVal);

            let cursorY = totalCardY + TOTAL_H + 4;
            const espacoNecessario = 20 + TERMO_H + 4;
            if (cursorY + espacoNecessario > CONTENT_BOTTOM) {
                drawFooterSimples();
                doc.addPage(); drawBasePage(); drawHeader();
                cursorY = CONTENT_TOP;
            }
            const totalGeralBottomY = drawTotalGeral(CONTENT_X, cursorY, CONTENT_W, totalPecasVal, totalServicosVal);
            let termoY = totalGeralBottomY + 3;
            if (termoY + TERMO_H > CONTENT_BOTTOM) {
                drawFooterSimples();
                doc.addPage(); drawBasePage(); drawHeader();
                termoY = CONTENT_TOP;
            }
            drawTermoAprovacao(CONTENT_X, termoY, CONTENT_W);
        }

        drawFooterSimples();
    }

    // ── SALVAR E ÚNICO TOAST ──────────────────────────────────────────────
    doc.save(nomeArquivo);
    // Um único toast consolidado + abre WhatsApp
    showToast('PDF gerado e enviado via WhatsApp!', 'success');
    setTimeout(() => { abrirWhatsAppComPDF(nomeArquivo, telefoneCliente, osNum); }, 600);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('page-checklist')) initChecklist(); });
} else {
    if (document.getElementById('page-checklist')) initChecklist();
}
