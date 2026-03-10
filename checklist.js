// GERENCIAMENTO DE CHECKLISTS
const ChecklistState = {
    checklistAtual: null,
    pecasComuns: [
        'Parachoque dianteiro',
        'Parachoque traseiro',
        'Farol',
        'Lanterna',
        'Retrovisor',
        'Para-lama',
        'Capo',
        'Porta',
        'Vidro',
        'Macaneta',
        'Spoiler',
        'Grade frontal',
        'Para-choque',
        'Amortecedor',
        'Pastilha de freio',
        'Disco de freio',
        'Bateria',
        'Filtro de oleo',
        'Filtro de ar',
        'Correia dentada',
        'Vela de ignicao',
        'Oleo motor',
        'Pneu',
        'Alinhamento',
        'Balanceamento',
        'Suspensao',
        'Cambio',
        'Embreagem',
        'Radiador',
        'Bomba dagua',
        'Alternador',
        'Motor de partida'
    ],
    servicosComuns: [
        'Mao de obra',
        'Pintura',
        'Funilaria',
        'Mecanica geral',
        'Troca de oleo',
        'Revisao',
        'Alinhamento',
        'Balanceamento',
        'Diagnostico',
        'Instalacao',
        'Remocao',
        'Polimento',
        'Lavagem',
        'Higienizacao',
        'Eletrica',
        'Suspensao',
        'Freios',
        'Cambio',
        'Embreagem',
        'Ar condicionado'
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

function popularSelectsChecklist() {
    // Layout atual usa campos de texto (nao selects)
}

function atualizarVeiculosChecklist(clienteId) {
    // Mantido por compatibilidade com chamadas legadas
}

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

    const normalizar = (texto = '') => texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

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
        id: Date.now(),
        osId: osId,
        veiculoId: veiculoId,
        clienteId: clienteId,
        dataEntrada: new Date().toISOString(),
        hodometro: '',
        nivelCombustivel: 4,
        tipoCombustivel: [],
        itens: {
            estepe: false,
            macaco: false,
            chaveRoda: false,
            triangulo: false,
            extintor: false,
            radio: false,
            antena: false,
            acendedor: false,
            vidroEletrico: false,
            travaEletrica: false,
            buzina: false,
            bateria: false,
            rodasLiga: false,
            protetorCarter: false,
            chaveSegredo: false,
            tapetes: false,
            ar: false,
            abs: false,
            airbag: false,
            automatico: false,
            direcaoHidraulica: false,
            alarme: false
        },
        luzesAvarias: [],
        inspecaoVisual: {
            lataria: '',
            pneus: '',
            vidros: '',
            interior: ''
        },
        observacoes: '',
        fotos: [],
        assinaturaCliente: null,
        assinaturaTecnico: null,
        status: 'rascunho'
    };
    
    ChecklistState.servicosEPecas = {
        servicos: [],
        pecas: [],
        statusRegulacao: 'pendente',
        seguradora: '',
        regulador: '',
        dataRegulacao: null,
        documentoRegulacao: null,
        fotoVistoria: null
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
        
        const sugestoes = lista.filter(item => 
            removerAcentos(item.toLowerCase()).includes(valor)
        );
        
        mostrarSugestoes(e.target, sugestoes);
    });
}

function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mostrarSugestoes(input, sugestoes) {
    const suggestoesExistentes = input.parentElement.querySelector('.autocomplete-sugestoes');
    if (suggestoesExistentes) {
        suggestoesExistentes.remove();
    }
    
    if (sugestoes.length === 0) return;
    
    const divSugestoes = document.createElement('div');
    divSugestoes.className = 'autocomplete-sugestoes';
    divSugestoes.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        width: ${input.offsetWidth}px;
        margin-top: 2px;
    `;
    
    sugestoes.slice(0, 5).forEach(sugestao => {
        const div = document.createElement('div');
        div.textContent = sugestao;
        div.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
        `;
        div.addEventListener('mouseenter', () => {
            div.style.background = '#f5f5f5';
        });
        div.addEventListener('mouseleave', () => {
            div.style.background = 'white';
        });
        div.addEventListener('click', () => {
            input.value = sugestao;
            divSugestoes.remove();
            input.focus();
        });
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
            (target.classList.contains('input-peca-desc') || 
             target.classList.contains('input-peca-valor') ||
             target.classList.contains('input-servico-desc') ||
             target.classList.contains('input-servico-valor'))) {
            
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
        <td>
            <input type="text" class="input-servico-desc" 
                   placeholder="Descricao do servico" 
                   value="${servico?.descricao || ''}" 
                   data-id="${id}">
        </td>
        <td>
            <input type="text" class="input-servico-valor" 
                   placeholder="0,00" 
                   value="${servico?.valor || ''}" 
                   data-id="${id}"
                   oninput="formatarValorInput(this); atualizarResumoFinanceiro();">
        </td>
        <td style="text-align: center;">
            <input type="checkbox" ${servico?.regulado ? 'checked' : ''} 
                   onchange="atualizarResumoFinanceiro()">
        </td>
        <td style="text-align: center;">
            <button class="btn-icon btn-danger" onclick="removerLinhaServico(this)" title="Remover">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

function criarLinhaPeca(peca = null) {
    const tr = document.createElement('tr');
    const id = peca?.id || Date.now();
    
    tr.innerHTML = `
        <td>
            <input type="text" class="input-peca-desc" 
                   placeholder="Descricao da peca" 
                   value="${peca?.descricao || ''}" 
                   data-id="${id}">
        </td>
        <td>
            <input type="text" class="input-peca-valor" 
                   placeholder="0,00" 
                   value="${peca?.valor || ''}" 
                   data-id="${id}"
                   oninput="formatarValorInput(this); atualizarResumoFinanceiro();">
        </td>
        <td style="text-align: center;">
            <input type="checkbox" ${peca?.regulado ? 'checked' : ''} 
                   onchange="atualizarResumoFinanceiro()">
        </td>
        <td style="text-align: center;">
            <button class="btn-icon btn-danger" onclick="removerLinhaPeca(this)" title="Remover">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

function removerLinhaServico(btn) {
    if (confirm('Remover este servico?')) {
        btn.closest('tr').remove();
        atualizarResumoFinanceiro();
    }
}

function removerLinhaPeca(btn) {
    if (confirm('Remover esta peca?')) {
        btn.closest('tr').remove();
        atualizarResumoFinanceiro();
    }
}

function formatarValorInput(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor === '') {
        input.value = '';
        return;
    }
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
        
        if (desc && valor) {
            servicos.push({
                descricao: desc,
                valor: parseFloat(valor) || 0,
                regulado: regulado || false
            });
        }
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
        
        if (desc && valor) {
            pecas.push({
                descricao: desc,
                valor: parseFloat(valor) || 0,
                regulado: regulado || false
            });
        }
    });
    
    return pecas;
}

function setupUploadFotos() {
    const inputFotos = document.getElementById('inputFotos');
    if (!inputFotos) return;
    
    inputFotos.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                comprimirEAdicionarFoto(file);
            }
        });
    });
}

function comprimirEAdicionarFoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const fotoComprimida = canvas.toDataURL('image/jpeg', 0.7);
            adicionarFotoNaGaleria(fotoComprimida, file.name);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function adicionarFotoNaGaleria(dataUrl, nome) {
    const galeria = document.getElementById('galeriaFotos');
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.style.cssText = 'position: relative; display: inline-block; margin: 5px;';
    
    div.innerHTML = `
        <img src="${dataUrl}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 4px;">
        <button onclick="removerFoto(this)" style="position: absolute; top: 2px; right: 2px; background: red; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
            x
        </button>
    `;
    
    galeria.appendChild(div);
    
    if (!ChecklistState.checklistAtual.fotos) {
        ChecklistState.checklistAtual.fotos = [];
    }
    ChecklistState.checklistAtual.fotos.push({ url: dataUrl, nome: nome });
}

function removerFoto(btn) {
    btn.parentElement.remove();
}

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
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
}

function limparAssinatura(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleLuzPainel(luz) {
    const btn = event.target.closest('.luz-painel-btn');
    btn.classList.toggle('active');
}

function toggleCombustivel(tipo) {
    const btn = event.target.closest('.combustivel-btn');
    btn.classList.toggle('active');
}

function salvarChecklist() {
    const clienteNome = document.getElementById('checklistClienteNome')?.value?.trim() || '';
    const clienteCPF = document.getElementById('checklistClienteCPF')?.value?.trim() || '';
    const veiculoPlaca = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim();
    const veiculoModelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || '';

    let cliente = (AppState.data.clientes || []).find(c =>
        c.nome?.trim().toLowerCase() === clienteNome.toLowerCase()
    );

    if (!cliente && clienteNome) {
        cliente = {
            id: Date.now(),
            nome: clienteNome,
            cpf: clienteCPF,
            telefone: '',
            email: '',
            endereco: ''
        };
        AppState.data.clientes.push(cliente);
    }

    let veiculo = (AppState.data.veiculos || []).find(v =>
        v.placa?.toUpperCase() === veiculoPlaca
    );

    if (!veiculo && veiculoPlaca && cliente) {
        veiculo = {
            id: Date.now() + 1,
            placa: veiculoPlaca,
            modelo: veiculoModelo || 'Nao informado',
            clienteId: cliente.id,
            chassis: '',
            ano: '',
            cor: ''
        };
        AppState.data.veiculos.push(veiculo);
    }

    const checklist = {
        ...ChecklistState.checklistAtual,
        clienteId: cliente?.id || null,
        clienteNome,
        clienteCPF,
        veiculoId: veiculo?.id || null,
        veiculoPlaca,
        veiculoModelo,
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
        servicos: coletarServicos(),
        pecas: coletarPecas(),
        statusRegulacao: document.getElementById('statusRegulacao')?.value,
        seguradora: document.getElementById('seguradora')?.value,
        regulador: document.getElementById('regulador')?.value,
        dataRegulacao: document.getElementById('dataRegulacao')?.value
    };

    if (!AppState.data.checklists) AppState.data.checklists = [];

    const index = AppState.data.checklists.findIndex(c => c.id === checklist.id);
    if (index >= 0) {
        AppState.data.checklists[index] = checklist;
    } else {
        AppState.data.checklists.push(checklist);
    }

    if (!AppState.data.servicosEPecas) AppState.data.servicosEPecas = [];
    const indexSP = AppState.data.servicosEPecas.findIndex(sp => sp.checklistId === checklist.id);
    servicosEPecas.checklistId = checklist.id;
    if (indexSP >= 0) {
        AppState.data.servicosEPecas[indexSP] = servicosEPecas;
    } else {
        AppState.data.servicosEPecas.push(servicosEPecas);
    }

    saveToLocalStorage();
    if (typeof renderClientes === 'function') renderClientes();
    if (typeof renderVeiculos === 'function') renderVeiculos();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast('Checklist salvo com sucesso!');
}

function coletarItensChecklist() {
    const itens = {};
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
        itens[cb.id] = cb.checked;
    });
    return itens;
}


function gerarImagemMockChecklist(titulo, corFundo = '#0b5ed7') {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = corFundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(60, 60, canvas.width - 120, canvas.height - 120);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('FASTCAR', 110, 180);

    ctx.fillStyle = '#374151';
    ctx.font = '36px Arial';
    ctx.fillText(titulo, 110, 250);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.strokeRect(110, 300, canvas.width - 220, 360);

    ctx.fillStyle = '#6b7280';
    ctx.font = '30px Arial';
    ctx.fillText('Imagem demonstrativa para previa do checklist', 150, 500);

    return canvas.toDataURL('image/jpeg', 0.75);
}

function preencherChecklistDemoCompleto(gerarPdfAoFinal = true) {
    const pageChecklist = document.getElementById('page-checklist');
    if (!pageChecklist) {
        showToast('Pagina de checklist nao esta disponivel no momento.', 'info');
        return;
    }

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    setVal('checklistClienteNome', 'Joao Silva de Almeida');
    setVal('checklistClienteCPF', '123.456.789-00');
    setVal('checklistVeiculoPlaca', 'ABC-1234');
    setVal('checklistVeiculoModelo', 'Fiat Uno 1.0 Fire Flex 2012');
    setVal('hodometro', '152364');
    setVal('nivelCombustivel', '4');
    setVal('inspecaoLataria', 'Risco na porta dianteira esquerda e pequeno amassado no para-lama traseiro.');
    setVal('inspecaoPneus', '4 pneus Pirelli com aproximadamente 80% de vida util.');
    setVal('inspecaoVidros', 'Trinca pequena no para-brisa lado passageiro.');
    setVal('inspecaoInterior', 'Banco do motorista com desgaste lateral e manopla levemente solta.');
    setVal('observacoes', 'Veiculo entregue para orcamento completo. Cliente ciente de pre-existencias de lataria e vidros. Autoriza desmontagem tecnica para vistoria complementar.');
    setVal('statusRegulacao', 'parcial');
    setVal('seguradora', 'Porto Seguro');
    setVal('regulador', 'Carlos Menezes');
    setVal('dataRegulacao', new Date().toISOString().slice(0, 10));

    gerarNumeroOS();

    document.querySelectorAll('.combustivel-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.combustivel-btn').forEach(btn => {
        const txt = btn.textContent.toLowerCase();
        if (txt.includes('flex')) btn.classList.add('active');
    });

    const luzesLigadas = ['motor', 'freio', 'abs'];
    document.querySelectorAll('.luz-painel-btn').forEach(btn => {
        const label = btn.textContent.toLowerCase();
        const ativa = luzesLigadas.some(chave => label.includes(chave));
        btn.classList.toggle('active', ativa);
    });

    const checkboxes = Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]'));
    checkboxes.forEach((cb, index) => {
        cb.checked = index % 3 === 0 || index % 5 === 0;
    });

    const tabelaServicos = document.getElementById('tabelaServicos');
    const tabelaPecas = document.getElementById('tabelaPecas');
    if (tabelaServicos) tabelaServicos.innerHTML = '';
    if (tabelaPecas) tabelaPecas.innerHTML = '';

    const servicosDemo = [
        'Troca de oleo e filtro', 'Alinhamento completo', 'Balanceamento 4 rodas', 'Diagnostico eletronico',
        'Higienizacao interna', 'Polimento tecnico', 'Reparo eletrico painel', 'Revisao sistema de freios',
        'Troca fluido de freio', 'Limpeza bicos injetores', 'Regulagem farois', 'Troca correia auxiliar',
        'Vistoria estrutural', 'Lavagem detalhada', 'Teste rodagem', 'Reaperto suspensao',
        'Geometria dianteira', 'Calibracao pneus', 'Revisao ar-condicionado', 'Inspecao final de entrega'
    ];

    const pecasDemo = [
        'Parachoque dianteiro', 'Parachoque traseiro', 'Farol esquerdo', 'Lanterna traseira direita',
        'Retrovisor esquerdo', 'Para-lama dianteiro', 'Capo', 'Porta dianteira esquerda',
        'Pastilha de freio', 'Disco de freio', 'Bateria 60Ah', 'Filtro de oleo',
        'Filtro de ar', 'Correia dentada', 'Vela de ignicao', 'Oleo de motor 5W30',
        'Pneu 175/65 R14', 'Amortecedor dianteiro', 'Radiador', 'Alternador'
    ];

    servicosDemo.forEach((descricao, i) => {
        const linha = criarLinhaServico({
            id: Date.now() + i,
            descricao,
            valor: (120 + i * 17.35).toFixed(2),
            regulado: i % 2 === 0
        });
        tabelaServicos?.appendChild(linha);
    });

    pecasDemo.forEach((descricao, i) => {
        const linha = criarLinhaPeca({
            id: Date.now() + 100 + i,
            descricao,
            valor: (180 + i * 26.7).toFixed(2),
            regulado: i % 3 === 0
        });
        tabelaPecas?.appendChild(linha);
    });

    const galeria = document.getElementById('galeriaFotos');
    if (galeria) galeria.innerHTML = '';
    if (!ChecklistState.checklistAtual) {
        criarNovoChecklist();
    }
    ChecklistState.checklistAtual.fotos = [];

    const cores = ['#0b5ed7', '#198754', '#6f42c1', '#fd7e14', '#dc3545'];
    const titulos = ['Vista frontal', 'Lateral esquerda', 'Lateral direita', 'Traseira', 'Interior'];
    titulos.forEach((titulo, i) => {
        const imgData = gerarImagemMockChecklist(titulo, cores[i % cores.length]);
        adicionarFotoNaGaleria(imgData, `${titulo}.jpg`);
    });

    const preencherAssinatura = (canvasId, nome) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 90);
        ctx.bezierCurveTo(60, 20, 120, 130, 190, 70);
        ctx.bezierCurveTo(210, 55, 235, 85, 275, 45);
        ctx.stroke();
        ctx.font = '12px Arial';
        ctx.fillStyle = '#4b5563';
        ctx.fillText(nome, 12, 140);
    };

    preencherAssinatura('canvasAssinaturaCliente', 'Joao Silva');
    preencherAssinatura('canvasAssinaturaTecnico', 'Rafael Tecnico');

    atualizarResumoFinanceiro();
    showToast('Checklist demo completo preenchido!', 'success');

    if (gerarPdfAoFinal) {
        gerarPDF();
    }
}

async function gerarPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('Biblioteca jsPDF nao carregada', 'info');
        return;
    }

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
    const telefoneCliente = document.getElementById('telefoneCliente')?.value?.trim() || '-';
    const placa = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim() || 'SEMPLACA';
    const modelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || '-';
    const chassis = document.getElementById('chassisVeiculo')?.value?.trim() || '-';
    const hodometro = document.getElementById('hodometro')?.value?.trim() || '-';
    const combustivelNivel = document.getElementById('nivelCombustivel')?.value || '0';
    const observacoes = document.getElementById('observacoes')?.value?.trim() || '-';

    const combustivelTipos = Array.from(document.querySelectorAll('.combustivel-btn.active'))
        .map(btn => btn.textContent.trim())
        .filter(Boolean);

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

    const luzesPainel = Array.from(document.querySelectorAll('.luz-painel-btn')).map(btn => ({
        label: btn.textContent.replace(/\s+/g, ' ').trim(),
        marcado: btn.classList.contains('active')
    }));

    const servicos = coletarServicos();
    const pecas = coletarPecas();
    const fotos = (ChecklistState.checklistAtual?.fotos || []).slice(0, 9);

    const assinaturaCliente = document.getElementById('canvasAssinaturaCliente')?.toDataURL('image/png');
    const assinaturaTecnico = document.getElementById('canvasAssinaturaTecnico')?.toDataURL('image/png');

    const now = new Date();
    const dataEmissao = now.toLocaleDateString('pt-BR');
    const horaEmissao = now.toLocaleTimeString('pt-BR');
    const dataArquivo = dataEmissao.replace(/\//g, '-');

    const formatCurrency = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

    const PAGE = { x: 12, y: 10, w: 186, h: 277 };

    const drawBasePage = () => {
        doc.setDrawColor(210, 210, 210);
        doc.rect(PAGE.x, PAGE.y, PAGE.w, PAGE.h);
    };

    // ── ICONE WHATSAPP: circulo verde + W branco desenhado com jsPDF ────────
    // jsPDF nao suporta emojis, por isso desenhamos o icone vetorialmente
    const drawWhatsAppIcon = (x, y, r) => {
        // Circulo verde de fundo
        doc.setFillColor(37, 211, 102);
        doc.setDrawColor(37, 211, 102);
        doc.circle(x, y, r, 'F');

        // Letra W branca centralizada dentro do circulo
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(r * 2.2); // tamanho proporcional ao raio
        doc.text('W', x, y + r * 0.45, { align: 'center' });
    };

    const drawHeader = () => {
        doc.setDrawColor(225, 225, 225);
        doc.line(22, 17, 188, 17);

        // Box logo
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(225, 225, 225);
        doc.roundedRect(22, 22, 20, 14, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(205, 25, 25);
        doc.setFontSize(8);
        doc.text('FAST CAR', 32, 30, { align: 'center' });

        // Nome da oficina
        doc.setFontSize(10.5);
        doc.text(oficina.nome, 45, 25);

        // Endereco
        doc.setTextColor(110, 110, 110);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.text(oficina.endereco, 45, 29);

        // Icone WhatsApp vetorial (circulo verde + W) + telefone
        drawWhatsAppIcon(47, 31.8, 1.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(110, 110, 110);
        doc.setFontSize(6.3);
        doc.text(oficina.telefone, 50, 32.5);

        // CNPJ
        doc.text('CNPJ: ' + oficina.cnpj, 45, 36);

        // OS no canto direito
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(6.4);
        doc.text('ORDEM DE SERVICO', 188, 31, { align: 'right' });
        doc.setTextColor(205, 25, 25);
        doc.setFontSize(12);
        doc.text(osNum, 188, 36.5, { align: 'right' });

        // Linha vermelha separadora
        doc.setDrawColor(220, 40, 40);
        doc.setLineWidth(0.7);
        doc.line(22, 40.5, 188, 40.5);
        doc.setLineWidth(0.2);
    };

    const drawFooter = () => {
        doc.setDrawColor(190, 190, 190);
        doc.line(22, 255, 188, 255);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(5.6);
        doc.text('ASSINATURA DO CLIENTE', 55, 260, { align: 'center' });
        doc.text('ASSINATURA DO TECNICO', 155, 260, { align: 'center' });
        doc.text(
            'CHECKLIST GERADO POR ' + oficina.nome + ' CNPJ: ' + oficina.cnpj + ' - ' + dataEmissao + ', ' + horaEmissao,
            105,
            269,
            { align: 'center' }
        );
    };

    const drawSignatures = () => {
        doc.setDrawColor(160, 160, 160);
        doc.line(22, 255, 95, 255);
        doc.line(115, 255, 188, 255);

        if (assinaturaCliente) {
            doc.addImage(assinaturaCliente, 'PNG', 27, 242, 62, 11, undefined, 'FAST');
        }
        if (assinaturaTecnico) {
            doc.addImage(assinaturaTecnico, 'PNG', 120, 242, 62, 11, undefined, 'FAST');
        }
    };

    const drawSectionBox = (x, y, w, h, title, lines = []) => {
        doc.setDrawColor(215, 215, 215);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 45, 45);
        doc.setFontSize(6.5);
        doc.text(title.toUpperCase(), x + 2, y + 5);

        doc.setDrawColor(235, 235, 235);
        doc.line(x + 1.5, y + 6.5, x + w - 1.5, y + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.setFontSize(8);
        let ly = y + 11;
        lines.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, w - 4);
            wrapped.forEach((part) => {
                if (ly < y + h - 1) {
                    doc.text(part, x + 2, ly);
                    ly += 3.8;
                }
            });
        });
    };

    // ── INSPECAO DE ENTRADA: badges coloridos ────────────────────────────
    const drawInspectionChecks = (x, y, w, h, items) => {
        doc.setDrawColor(215, 215, 215);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 45, 45);
        doc.setFontSize(6.5);
        doc.text('INSPECAO DE ENTRADA', x + 2, y + 5);
        doc.setDrawColor(235, 235, 235);
        doc.line(x + 1.5, y + 6.5, x + w - 1.5, y + 6.5);

        const badgeH = 4.5;
        const badgePadX = 2;
        const gap = 1.5;
        let curX = x + 2;
        let curY = y + 10;
        const maxX = x + w - 2;
        const maxY = y + h - 2;

        doc.setFontSize(5.8);

        items.forEach((item) => {
            const text = item.label;
            const textWidth = doc.getTextWidth(text);
            const badgeW = textWidth + badgePadX * 2 + 4;

            if (curX + badgeW > maxX) {
                curX = x + 2;
                curY += badgeH + gap;
            }
            if (curY + badgeH > maxY) return;

            if (item.marcado) {
                doc.setFillColor(25, 135, 84);
                doc.setTextColor(255, 255, 255);
            } else {
                doc.setFillColor(220, 220, 220);
                doc.setTextColor(100, 100, 100);
            }
            doc.roundedRect(curX, curY, badgeW, badgeH, 1, 1, 'F');

            doc.setFont('helvetica', 'bold');
            doc.text(item.marcado ? '+' : '-', curX + 1.5, curY + 3.3);

            doc.setFont('helvetica', 'normal');
            doc.text(text, curX + 4.5, curY + 3.3);

            curX += badgeW + gap;
        });
    };

    const compressPhoto = (dataUrl) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 640;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

    const preparePage = () => {
        drawBasePage();
        drawHeader();
    };

    const drawCompactTableCard = (x, y, w, title, color, items, totalLabel) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8.5);
        doc.text(title, x, y);

        const top = y + 3;
        const tableHeight = 157;
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(x, top, w, tableHeight, 1.5, 1.5);

        const split = x + w * 0.72;
        doc.setDrawColor(205, 205, 205);
        doc.line(split, top, split, top + tableHeight);
        doc.line(x, top + 6, x + w, top + 6);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 55, 55);
        doc.setFontSize(6.8);
        doc.text('DESCRICAO', x + 1.6, top + 4.4);
        doc.text('VALOR', x + w - 1.8, top + 4.4, { align: 'right' });

        const maxRows = 40;
        const shown = items.slice(0, maxRows);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.6);
        let rowY = top + 9.6;
        const rowH = 3.7;

        shown.forEach((item, idx) => {
            if (idx > 0) {
                doc.setDrawColor(228, 228, 228);
                doc.line(x, rowY - 2.4, x + w, rowY - 2.4);
            }
            const desc = doc.splitTextToSize(item.descricao || '-', w * 0.68 - 1.2)[0] || '-';
            doc.text(desc, x + 1.6, rowY);
            doc.text(formatCurrency(item.valor || 0), x + w - 1.8, rowY, { align: 'right' });
            rowY += rowH;
            if (rowY > top + tableHeight - 1.5) return;
        });

        const total = items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
        const totalY = top + tableHeight + 4;
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(x, totalY, w, 10, 1.5, 1.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFontSize(10);
        doc.text(totalLabel, x + 3, totalY + 6.5);
        doc.text(formatCurrency(total), x + w - 3, totalY + 6.5, { align: 'right' });

        if (items.length > maxRows) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(130, 130, 130);
            doc.setFontSize(5.5);
            doc.text('Exibindo 40 de ' + items.length + ' itens', x + 2, totalY + 13.5);
        }

        return { total };
    };

    showToast('Gerando PDF...');

    // ── PAGINA 1 ────────────────────────────────────────────────────────────
    preparePage();

    drawSectionBox(22, 44, 82, 34, 'CLIENTE', [
        'NOME: ' + cliente,
        'CPF/CNPJ: ' + cpf,
        'TEL: ' + telefoneCliente
    ]);

    drawSectionBox(107, 44, 81, 34, 'VEICULO', [
        'VEICULO: ' + modelo + '  ' + placa,
        'CHASSI: ' + chassis,
        'KM: ' + hodometro + ' | COMB: ' + (combustivelTipos.join('/') || 'SELECIONE...') + ' (' + combustivelNivel + '%)',
        'DATA: ' + dataEmissao + ' AS ' + horaEmissao.slice(0, 5)
    ]);

    drawSectionBox(22, 81, 166, 16, 'SERVICOS SOLICITADOS', servicos.length ? servicos.map(s => s.descricao) : ['-']);

    drawInspectionChecks(22, 100, 166, 28, itensEntrada);

    const obsLinhas = [
        'Lataria: ' + inspecaoVisual.lataria,
        'Pneus: ' + inspecaoVisual.pneus,
        'Vidros: ' + inspecaoVisual.vidros,
        'Interior: ' + inspecaoVisual.interior,
        observacoes
    ];
    drawSectionBox(22, 131, 166, 19, 'OBSERVACOES DA INSPECAO', obsLinhas);

    // ── FOTOS: 3 cima + 6 baixo ──────────────────────────────────────────
    const fotosComprimidas = [];
    for (const foto of fotos) {
        fotosComprimidas.push({ nome: foto.nome, url: await compressPhoto(foto.url) });
    }

    const fotoBoxY = 153;
    const fotoBoxH = 95;
    drawSectionBox(22, fotoBoxY, 166, fotoBoxH, 'FOTOS DO VEICULO', []);

    if (fotosComprimidas.length > 0) {
        const topFotos = fotosComprimidas.slice(0, 3);
        const fotoLarguraCima = 51;
        const fotoAlturaCima  = 38;
        topFotos.forEach((foto, i) => {
            const fx = 24 + i * (fotoLarguraCima + 2);
            const fy = fotoBoxY + 8;
            doc.setDrawColor(200, 40, 40);
            doc.roundedRect(fx, fy, fotoLarguraCima, fotoAlturaCima, 1, 1);
            doc.addImage(foto.url, 'JPEG', fx + 0.5, fy + 0.5, fotoLarguraCima - 1, fotoAlturaCima - 1, undefined, 'FAST');
        });

        const botFotos = fotosComprimidas.slice(3, 9);
        const fotoLarguraBaixo = 25;
        const fotoAlturaBaixo  = 19;
        botFotos.forEach((foto, i) => {
            const fx = 24 + i * (fotoLarguraBaixo + 2.2);
            const fy = fotoBoxY + 8 + fotoAlturaCima + 3;
            doc.setDrawColor(200, 40, 40);
            doc.roundedRect(fx, fy, fotoLarguraBaixo, fotoAlturaBaixo, 1, 1);
            doc.addImage(foto.url, 'JPEG', fx + 0.5, fy + 0.5, fotoLarguraBaixo - 1, fotoAlturaBaixo - 1, undefined, 'FAST');
        });
    }

    drawSignatures();
    drawFooter();

    // ── PAGINA 2 - PECAS E SERVICOS ──────────────────────────────────────
    doc.addPage();
    preparePage();

    const cardPecas = drawCompactTableCard(22, 47, 82, 'PECAS', [20, 105, 200], pecas, 'TOTAL PECAS');
    const cardServicos = drawCompactTableCard(107, 47, 81, 'SERVICOS', [220, 40, 40], servicos, 'TOTAL SERVICOS');

    const totalGeral = cardPecas.total + cardServicos.total;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(22, 232, 166, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 55, 55);
    doc.setFontSize(11);
    doc.text('TOTAL GERAL:', 104, 240, { align: 'center' });
    doc.setTextColor(28, 170, 90);
    doc.text(formatCurrency(totalGeral), 182, 240, { align: 'right' });

    drawSignatures();
    drawFooter();

    doc.save('OS-' + placa + '-' + dataArquivo + '_CHECKLIST.pdf');
    showToast('PDF gerado com sucesso!', 'success');
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('page-checklist')) {
            initChecklist();
        }
    });
} else {
    if (document.getElementById('page-checklist')) {
        initChecklist();
    }
}
