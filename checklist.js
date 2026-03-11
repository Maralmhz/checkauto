// GERENCIAMENTO DE CHECKLISTS
const ChecklistState = {
    checklistAtual: null,
    pecasComuns: [
        'Parachoque dianteiro','Parachoque traseiro','Farol','Lanterna','Retrovisor',
        'Para-lama','Capo','Porta','Vidro','Macaneta','Spoiler','Grade frontal',
        'Para-choque','Amortecedor','Pastilha de freio','Disco de freio','Bateria',
        'Filtro de oleo','Filtro de ar','Correia dentada','Vela de ignicao','Oleo motor',
        'Pneu','Alinhamento','Balanceamento','Suspensao','Cambio','Embreagem',
        'Radiador','Bomba dagua','Alternador','Motor de partida'
    ],
    servicosComuns: [
        'Mao de obra','Pintura','Funilaria','Mecanica geral','Troca de oleo','Revisao',
        'Alinhamento','Balanceamento','Diagnostico','Instalacao','Remocao','Polimento',
        'Lavagem','Higienizacao','Eletrica','Suspensao','Freios','Cambio','Embreagem','Ar condicionado'
    ]
};

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

function preencherChecklistDemoCompleto(gerarPdfAoFinal = true) {
    const pageChecklist = document.getElementById('page-checklist');
    if (!pageChecklist) { showToast('Pagina de checklist nao disponivel.', 'info'); return; }
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
    const servicosDemo = ['Troca de oleo e filtro','Alinhamento completo','Balanceamento 4 rodas','Diagnostico eletronico','Higienizacao interna','Polimento tecnico','Reparo eletrico painel','Revisao sistema de freios','Troca fluido de freio','Limpeza bicos injetores','Regulagem farois','Troca correia auxiliar','Vistoria estrutural','Lavagem detalhada','Teste rodagem','Reaperto suspensao','Geometria dianteira','Calibracao pneus','Revisao ar-condicionado','Inspecao final de entrega'];
    const pecasDemo = ['Parachoque dianteiro','Parachoque traseiro','Farol esquerdo','Lanterna traseira direita','Retrovisor esquerdo','Para-lama dianteiro','Capo','Porta dianteira esquerda','Pastilha de freio','Disco de freio','Bateria 60Ah','Filtro de oleo','Filtro de ar','Correia dentada','Vela de ignicao','Oleo de motor 5W30','Pneu 175/65 R14','Amortecedor dianteiro','Radiador','Alternador'];
    servicosDemo.forEach((descricao, i) => { tabelaServicos?.appendChild(criarLinhaServico({ id: Date.now() + i, descricao, valor: (120 + i * 17.35).toFixed(2), regulado: i % 2 === 0 })); });
    pecasDemo.forEach((descricao, i) => { tabelaPecas?.appendChild(criarLinhaPeca({ id: Date.now() + 100 + i, descricao, valor: (180 + i * 26.7).toFixed(2), regulado: i % 3 === 0 })); });
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
    showToast('Checklist demo preenchido!', 'success');
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

    const statusRegulacao = document.getElementById('statusRegulacao')?.value || '';
    const seguradora = document.getElementById('seguradora')?.value?.trim() || '';
    const regulador = document.getElementById('regulador')?.value?.trim() || '';
    const dataRegulacao = document.getElementById('dataRegulacao')?.value || '';

    const tipoMap = { 'total': 'SEGURADORA', 'parcial': 'SEGURADORA / CLIENTE', 'pendente': 'CLIENTE', 'associacao': 'ASSOCIACAO' };
    const tipoPagador = tipoMap[statusRegulacao] || statusRegulacao.toUpperCase() || 'NAO INFORMADO';

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
    const dataArquivo = dataEmissao.replace(/\//g, '-');
    const nomeArquivo = 'OS-' + placa + '-' + dataArquivo + '_CHECKLIST.pdf';
    const formatCurrency = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

    const PAGE = { x: 12, y: 10, w: 186, h: 277 };
    const whatsappIconData = getWhatsAppIconDataURL(64);

    const drawBasePage = () => { doc.setDrawColor(210, 210, 210); doc.rect(PAGE.x, PAGE.y, PAGE.w, PAGE.h); };

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
        doc.text('CHECKLIST GERADO POR ' + oficina.nome + ' CNPJ: ' + oficina.cnpj + ' - ' + dataEmissao + ', ' + horaEmissao, 105, 275, { align: 'center' });
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
        doc.text('CHECKLIST GERADO POR ' + oficina.nome + ' CNPJ: ' + oficina.cnpj + ' - ' + dataEmissao + ', ' + horaEmissao, 105, 275, { align: 'center' });
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

    // ── TABELA PDF: apenas DESCRICAO + VALOR (sem coluna REGULADO) ──────────
    const drawCompactTableCard = (x, y, w, title, color, items, totalLabel) => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30); doc.setFontSize(8.5);
        doc.text(title, x, y);
        const top = y + 3, tableHeight = 157;
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(x, top, w, tableHeight, 1.5, 1.5);
        // Apenas duas colunas: DESCRICAO e VALOR
        const colDesc  = x;
        const colValor = x + w * 0.68;
        doc.setDrawColor(205, 205, 205);
        doc.line(colValor, top, colValor, top + tableHeight);
        doc.line(x, top + 6, x + w, top + 6);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 55, 55); doc.setFontSize(6.8);
        doc.text('DESCRICAO', colDesc + 1.6, top + 4.4);
        doc.text('VALOR', colValor + 1.6, top + 4.4);
        const maxRows = 40;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.6);
        let rowY = top + 9.6;
        const rowH = 3.7;
        items.slice(0, maxRows).forEach((item, idx) => {
            if (idx > 0) { doc.setDrawColor(228, 228, 228); doc.line(x, rowY - 2.4, x + w, rowY - 2.4); }
            const desc = doc.splitTextToSize(item.descricao || '-', w * 0.65)[0] || '-';
            doc.setTextColor(50, 50, 50);
            doc.text(desc, colDesc + 1.6, rowY);
            doc.text(formatCurrency(item.valor || 0), colValor + 1.6, rowY);
            rowY += rowH;
            if (rowY > top + tableHeight - 1.5) return;
        });
        const total = items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
        const totalY = top + tableHeight + 4;
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(x, totalY, w, 10, 1.5, 1.5);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(color[0], color[1], color[2]); doc.setFontSize(10);
        doc.text(totalLabel, x + 3, totalY + 6.5);
        doc.text(formatCurrency(total), x + w - 3, totalY + 6.5, { align: 'right' });
        if (items.length > maxRows) {
            doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130); doc.setFontSize(5.5);
            doc.text('Exibindo 40 de ' + items.length + ' itens', x + 2, totalY + 13.5);
        }
        return { total };
    };

    // ── AREA AMARELA PROFISSIONAL - layout renovado ─────────────────────────
    const drawRegulacaoBox = (x, y, w, h) => {
        // Fundo branco-creme com borda dourada
        doc.setFillColor(255, 252, 235);
        doc.setDrawColor(180, 140, 0);
        doc.setLineWidth(0.8);
        doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
        doc.setLineWidth(0.2);

        // Faixa superior amarelo-ouro
        doc.setFillColor(234, 179, 8);
        doc.roundedRect(x, y, w, 9, 2.5, 2.5, 'F');
        doc.rect(x, y + 4.5, w, 4.5, 'F');

        // Icone e titulo na faixa
        doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 40, 0); doc.setFontSize(8);
        doc.text('\u26A0  REGULACAO / RESPONSAVEL PELO PAGAMENTO', x + w / 2, y + 6, { align: 'center' });

        // Linha fina abaixo da faixa
        doc.setDrawColor(200, 160, 0); doc.setLineWidth(0.4);
        doc.line(x + 2, y + 9.5, x + w - 2, y + 9.5);
        doc.setLineWidth(0.2);

        // Grade interna 4 celulas: [Seguradora | Regulador | Data | Status]
        const cellW = (w - 8) / 4;
        const cellY = y + 11;
        const cells = [
            { label: 'SEGURADORA', value: seguradora || 'Nao informada' },
            { label: 'REGULADOR', value: regulador || 'Nao informado' },
            { label: 'DATA DA REGULACAO', value: dataRegulacao ? new Date(dataRegulacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-' },
            { label: 'RESPONSAVEL', value: tipoPagador }
        ];
        const statusColors = {
            'SEGURADORA':          [22, 163, 74],
            'SEGURADORA / CLIENTE': [202, 138, 4],
            'ASSOCIACAO':          [37, 99, 235],
            'CLIENTE':             [185, 28, 28]
        };
        cells.forEach((cell, i) => {
            const cx = x + 4 + i * (cellW + 2);
            // Fundo celula
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(220, 185, 0);
            doc.roundedRect(cx, cellY, cellW, h - 22, 1.5, 1.5, 'FD');
            // Label pequeno cinza
            doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 90, 0); doc.setFontSize(5.5);
            doc.text(cell.label, cx + cellW / 2, cellY + 5, { align: 'center' });
            // Linha separadora interna
            doc.setDrawColor(235, 210, 100);
            doc.line(cx + 2, cellY + 6.5, cx + cellW - 2, cellY + 6.5);
            // Valor — se for o campo STATUS usa badge colorido
            if (i === 3) {
                const cor = statusColors[cell.value] || [130, 130, 130];
                const bW = Math.min(cellW - 4, doc.getTextWidth(cell.value) + 6);
                const bX = cx + (cellW - bW) / 2;
                doc.setFillColor(cor[0], cor[1], cor[2]);
                doc.roundedRect(bX, cellY + 8.5, bW, 6, 1.2, 1.2, 'F');
                doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.setFontSize(6);
                doc.text(cell.value, cx + cellW / 2, cellY + 12.8, { align: 'center' });
            } else {
                doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30); doc.setFontSize(7);
                const linhas = doc.splitTextToSize(cell.value, cellW - 4);
                linhas.slice(0, 2).forEach((ln, li) => {
                    doc.text(ln, cx + cellW / 2, cellY + 10 + li * 4.5, { align: 'center' });
                });
            }
        });

        // Linha de assinatura do regulador (parte inferior)
        const assinY = y + h - 9;
        doc.setDrawColor(160, 130, 0); doc.setLineWidth(0.4);
        doc.line(x + 6, assinY, x + w / 2 - 6, assinY);
        doc.line(x + w / 2 + 6, assinY, x + w - 6, assinY);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 80, 0); doc.setFontSize(5.5);
        doc.text('Assinatura do Regulador', x + w / 4, y + h - 4.5, { align: 'center' });
        doc.text('Assinatura do Responsavel', x + w * 0.75, y + h - 4.5, { align: 'center' });
    };

    showToast('Gerando PDF...');

    // ── PAGINA 1: CHECKLIST + FOTOS + ASSINATURAS ───────────────────────────
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

    // ── PAGINA 2: PECAS, SERVICOS E REGULACAO ───────────────────────────────
    doc.addPage();
    drawBasePage(); drawHeader();

    const colW = 82;
    const cardPecas    = drawCompactTableCard(22,  47, colW, 'PECAS',    [20, 105, 200], pecas,    'TOTAL PECAS');
    const cardServicos = drawCompactTableCard(107, 47, colW, 'SERVICOS', [220, 40,  40],  servicos, 'TOTAL SERVICOS');

    // Total geral
    const totalGeral = cardPecas.total + cardServicos.total;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(22, 218, 166, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 55, 55); doc.setFontSize(11);
    doc.text('TOTAL GERAL:', 104, 226, { align: 'center' });
    doc.setTextColor(28, 170, 90);
    doc.text(formatCurrency(totalGeral), 182, 226, { align: 'right' });

    // Area de regulacao profissional
    drawRegulacaoBox(22, 233, 166, 38);

    drawFooterSimples();

    // ── SALVAR ───────────────────────────────────────────────────────────────
    doc.save(nomeArquivo);
    showToast('PDF baixado! Abrindo WhatsApp...', 'success');
    setTimeout(() => { abrirWhatsAppComPDF(nomeArquivo, telefoneCliente, osNum); }, 800);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('page-checklist')) initChecklist(); });
} else {
    if (document.getElementById('page-checklist')) initChecklist();
}
