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
    // Layout atual usa campos de texto (não selects)
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
        .replace(/[̀-ͯ]/g, '')
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
                   placeholder="Descrição do serviço" 
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
                   placeholder="Descrição da peça" 
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
    if (confirm('Remover este serviço?')) {
        btn.closest('tr').remove();
        atualizarResumoFinanceiro();
    }
}

function removerLinhaPeca(btn) {
    if (confirm('Remover esta peça?')) {
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
            ×
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
            modelo: veiculoModelo || 'Não informado',
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
    ctx.fillText('Imagem demonstrativa para prévia do checklist', 150, 500);

    return canvas.toDataURL('image/jpeg', 0.75);
}

function preencherChecklistDemoCompleto(gerarPdfAoFinal = true) {
    const pageChecklist = document.getElementById('page-checklist');
    if (!pageChecklist) {
        showToast('Página de checklist não está disponível no momento.', 'info');
        return;
    }

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    setVal('checklistClienteNome', 'João Silva de Almeida');
    setVal('checklistClienteCPF', '123.456.789-00');
    setVal('checklistVeiculoPlaca', 'ABC-1234');
    setVal('checklistVeiculoModelo', 'Fiat Uno 1.0 Fire Flex 2012');
    setVal('hodometro', '152364');
    setVal('nivelCombustivel', '4');
    setVal('inspecaoLataria', 'Risco na porta dianteira esquerda e pequeno amassado no para-lama traseiro.');
    setVal('inspecaoPneus', '4 pneus Pirelli com aproximadamente 80% de vida útil.');
    setVal('inspecaoVidros', 'Trinca pequena no para-brisa lado passageiro.');
    setVal('inspecaoInterior', 'Banco do motorista com desgaste lateral e manopla levemente solta.');
    setVal('observacoes', 'Veículo entregue para orçamento completo. Cliente ciente de pré-existências de lataria e vidros. Autoriza desmontagem técnica para vistoria complementar.');
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
        'Troca de óleo e filtro', 'Alinhamento completo', 'Balanceamento 4 rodas', 'Diagnóstico eletrônico',
        'Higienização interna', 'Polimento técnico', 'Reparo elétrico painel', 'Revisão sistema de freios',
        'Troca fluido de freio', 'Limpeza bicos injetores', 'Regulagem faróis', 'Troca correia auxiliar',
        'Vistoria estrutural', 'Lavagem detalhada', 'Teste rodagem', 'Reaperto suspensão',
        'Geometria dianteira', 'Calibração pneus', 'Revisão ar-condicionado', 'Inspeção final de entrega'
    ];

    const pecasDemo = [
        'Parachoque dianteiro', 'Parachoque traseiro', 'Farol esquerdo', 'Lanterna traseira direita',
        'Retrovisor esquerdo', 'Para-lama dianteiro', 'Capô', 'Porta dianteira esquerda',
        'Pastilha de freio', 'Disco de freio', 'Bateria 60Ah', 'Filtro de óleo',
        'Filtro de ar', 'Correia dentada', 'Vela de ignição', 'Óleo de motor 5W30',
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

    preencherAssinatura('canvasAssinaturaCliente', 'João Silva');
    preencherAssinatura('canvasAssinaturaTecnico', 'Rafael Técnico');

    atualizarResumoFinanceiro();
    showToast('Checklist demo completo preenchido!', 'success');

    if (gerarPdfAoFinal) {
        gerarPDF();
    }
}

async function gerarPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('Biblioteca jsPDF não carregada', 'info');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 22;
    const marginBottom = 16;
    const contentWidth = pageWidth - marginLeft - marginRight;

    const oficina = {
        nome: 'FAST CAR CENTRO AUTOMOTIVO',
        endereco: 'AV. RÉGULUS, 248 - JARDIM RIACHO DAS PEDRAS, CONTAGEM - MG',
        telefone: '(31) 2342-1699',
        cnpj: '60.516.882/0001-74'
    };

    const now = new Date();
    const dataArquivo = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const dataHoraRodape = `${now.toLocaleDateString('pt-BR')}, ${now.toLocaleTimeString('pt-BR')}`;

    const osNum = document.getElementById('checklistNumeroOS')?.textContent?.trim() || 'SEM-OS';
    const cliente = document.getElementById('checklistClienteNome')?.value?.trim() || 'NÃO INFORMADO';
    const cpf = document.getElementById('checklistClienteCPF')?.value?.trim() || '-';
    const telefoneCliente = document.getElementById('telefoneCliente')?.value?.trim() || '-';
    const placa = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim() || 'SEMPLACA';
    const modelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || '-';
    const chassis = document.getElementById('chassisVeiculo')?.value?.trim() || '-';
    const hodometro = document.getElementById('hodometro')?.value?.trim() || '-';
    const combustivelNivel = document.getElementById('nivelCombustivel')?.value || '0';

    const combustivelTipos = Array.from(document.querySelectorAll('.combustivel-btn.active'))
        .map(btn => btn.textContent.trim())
        .filter(Boolean);
    const combustivelTexto = `${combustivelTipos.join('/') || 'NÃO INFORMADO'} (${combustivelNivel}%)`;

    const observacoes = document.getElementById('observacoes')?.value?.trim() || 'Nenhuma observação.';
    const inspecaoVisual = {
        lataria: document.getElementById('inspecaoLataria')?.value?.trim() || '-',
        pneus: document.getElementById('inspecaoPneus')?.value?.trim() || '-',
        vidros: document.getElementById('inspecaoVidros')?.value?.trim() || '-',
        interior: document.getElementById('inspecaoInterior')?.value?.trim() || '-'
    };

    const itensEntrada = Array.from(document.querySelectorAll('.checklist-item')).map(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label')?.textContent?.trim() || checkbox?.id || 'Item';
        return { label, marcado: !!checkbox?.checked };
    });

    const luzesPainel = Array.from(document.querySelectorAll('.luz-painel-btn')).map(btn => ({
        label: btn.textContent.replace(/\s+/g, ' ').trim(),
        marcado: btn.classList.contains('active')
    }));

    const servicos = coletarServicos();
    const pecas = coletarPecas();
    const fotos = (ChecklistState.checklistAtual?.fotos || []).slice(0, 5);

    const assinaturaCliente = document.getElementById('canvasAssinaturaCliente')?.toDataURL('image/png');
    const assinaturaTecnico = document.getElementById('canvasAssinaturaTecnico')?.toDataURL('image/png');

    const formatCurrency = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));

    let y = marginTop + 22;

    const addHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(oficina.nome, marginLeft, marginTop - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(oficina.endereco, marginLeft, marginTop - 7);
        doc.text(`${oficina.telefone} | CNPJ: ${oficina.cnpj}`, marginLeft, marginTop - 2);

        doc.setDrawColor(160, 160, 160);
        doc.line(marginLeft, marginTop + 2, pageWidth - marginRight, marginTop + 2);
    };

    const addFooter = () => {
        const footerY = pageHeight - marginBottom;
        doc.setDrawColor(160, 160, 160);
        doc.line(marginLeft, footerY - 4, pageWidth - marginRight, footerY - 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`CHECKLIST GERADO POR ${oficina.nome} CNPJ: ${oficina.cnpj} - ${dataHoraRodape}`, marginLeft, footerY);
    };

    const startPage = () => {
        addHeader();
        y = marginTop + 12;
    };

    const addNewPage = () => {
        addFooter();
        doc.addPage();
        startPage();
    };

    const ensureSpace = (needed) => {
        if (y + needed > pageHeight - marginBottom - 8) {
            addNewPage();
        }
    };

    const drawDivider = () => {
        doc.setDrawColor(180, 180, 180);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 5;
    };

    const drawSection = (title) => {
        ensureSpace(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`### ${title}`, marginLeft, y);
        y += 4;
    };

    const drawLineText = (text, bold = false) => {
        ensureSpace(5);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, marginLeft, y);
        y += lines.length * 4.2;
    };

    const drawSignatures = () => {
        ensureSpace(38);
        drawDivider();
        const tableTop = y + 1;
        const midX = marginLeft + contentWidth / 2;
        const tableBottom = tableTop + 24;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('ASSINATURA DO CLIENTE', marginLeft + contentWidth * 0.25, tableTop + 4, { align: 'center' });
        doc.text('ASSINATURA DO TÉCNICO', marginLeft + contentWidth * 0.75, tableTop + 4, { align: 'center' });

        doc.setDrawColor(0, 0, 0);
        doc.line(marginLeft + 8, tableBottom, midX - 8, tableBottom);
        doc.line(midX + 8, tableBottom, pageWidth - marginRight - 8, tableBottom);

        if (assinaturaCliente) {
            doc.addImage(assinaturaCliente, 'PNG', marginLeft + 14, tableTop + 6, 56, 14, undefined, 'FAST');
        }
        if (assinaturaTecnico) {
            doc.addImage(assinaturaTecnico, 'PNG', midX + 14, tableTop + 6, 56, 14, undefined, 'FAST');
        }

        y = tableBottom + 6;
    };

    const compressPhoto = (dataUrl, quality = 0.7) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

    showToast('Gerando PDF profissional...');
    startPage();

    // Página 1 - checklist principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`ORDEM DE SERVIÇO: ${osNum}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    drawDivider();

    drawSection('CLIENTE');
    drawLineText(`NOME: ${cliente}`);
    drawLineText(`CPF/CNPJ: ${cpf}`);
    drawLineText(`TEL: ${telefoneCliente}`);
    y += 2;

    drawSection('VEÍCULO');
    drawLineText(`VEÍCULO: ${modelo} | PLACA: ${placa}`);
    drawLineText(`CHASSI: ${chassis}`);
    drawLineText(`KM: ${hodometro} | COMB: ${combustivelTexto}`);
    drawLineText(`DATA: ${now.toLocaleDateString('pt-BR')} ÀS ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    drawDivider();

    drawSection('SERVIÇOS SOLICITADOS');
    if (!servicos.length) {
        drawLineText('-');
    } else {
        servicos.forEach((srv, i) => drawLineText(`${i + 1}. ${srv.descricao}`));
    }
    drawDivider();

    drawSection('INSPEÇÃO DE ENTRADA');
    const col2x = marginLeft + (contentWidth / 2);
    for (let i = 0; i < itensEntrada.length; i += 2) {
        ensureSpace(5);
        const a = itensEntrada[i];
        const b = itensEntrada[i + 1];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${a?.marcado ? '✓' : '☐'} ${a?.label || ''}`, marginLeft, y);
        if (b) doc.text(`${b.marcado ? '✓' : '☐'} ${b.label}`, col2x, y);
        y += 4.5;
    }

    y += 1;
    drawSection('LUZES DO PAINEL');
    for (let i = 0; i < luzesPainel.length; i += 2) {
        ensureSpace(5);
        const a = luzesPainel[i];
        const b = luzesPainel[i + 1];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${a?.marcado ? '✓' : '☐'} ${a?.label || ''}`, marginLeft, y);
        if (b) doc.text(`${b.marcado ? '✓' : '☐'} ${b.label}`, col2x, y);
        y += 4.5;
    }

    drawSection('INSPEÇÃO VISUAL');
    drawLineText(`Lataria: ${inspecaoVisual.lataria}`);
    drawLineText(`Pneus: ${inspecaoVisual.pneus}`);
    drawLineText(`Vidros: ${inspecaoVisual.vidros}`);
    drawLineText(`Interior: ${inspecaoVisual.interior}`);
    drawDivider();

    drawSection('OBSERVAÇÕES DA INSPEÇÃO');
    drawLineText(observacoes);
    drawDivider();

    drawSection('📷 FOTOS DO VEÍCULO (até 5)');
    if (!fotos.length) {
        drawLineText('Sem fotos anexadas.');
    } else {
        const compressed = [];
        for (const foto of fotos) {
            compressed.push({
                nome: foto.nome,
                url: await compressPhoto(foto.url, 0.7)
            });
        }

        for (let i = 0; i < compressed.length; i++) {
            const foto = compressed[i];
            const shouldBreak = i > 0 && i % 2 === 0;
            if (shouldBreak) {
                addNewPage();
                drawSection('📷 FOTOS DO VEÍCULO (continuação)');
            }

            ensureSpace(72);
            const imgX = marginLeft;
            const imgY = y;
            const imgW = contentWidth;
            const imgH = 64;
            doc.setDrawColor(210, 210, 210);
            doc.rect(imgX, imgY, imgW, imgH);
            doc.addImage(foto.url, 'JPEG', imgX + 1, imgY + 1, imgW - 2, imgH - 2, undefined, 'FAST');
            y += imgH + 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(foto.nome || `Foto ${i + 1}`, marginLeft, y);
            y += 5;
        }
    }

    drawSignatures();
    addFooter();

    // Página 2+ - peças e serviços
    doc.addPage();
    startPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`ORDEM DE SERVIÇO: ${osNum}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    drawDivider();

    const drawMoneyTable = (titulo, itens, totalLabel) => {
        const tableHeaderHeight = 6;
        const rowHeight = 5;
        const colDesc = marginLeft;
        const colValor = pageWidth - marginRight - 45;

        drawSection(titulo);

        const drawHeaderRow = () => {
            ensureSpace(tableHeaderHeight + 2);
            doc.setDrawColor(170, 170, 170);
            doc.rect(marginLeft, y, contentWidth, tableHeaderHeight);
            doc.line(colValor, y, colValor, y + tableHeaderHeight);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text('DESCRIÇÃO', colDesc + 2, y + 4);
            doc.text('VALOR', colValor + 2, y + 4);
            y += tableHeaderHeight;
        };

        drawHeaderRow();

        let total = 0;
        itens.forEach((item, idx) => {
            if (y + rowHeight > pageHeight - marginBottom - 10) {
                addNewPage();
                drawSection(`${titulo} (continuação)`);
                drawHeaderRow();
            }

            const valor = Number(item.valor || 0);
            total += valor;
            doc.setDrawColor(210, 210, 210);
            doc.rect(marginLeft, y, contentWidth, rowHeight);
            doc.line(colValor, y, colValor, y + rowHeight);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            const desc = item.descricao || `Item ${idx + 1}`;
            const descLine = doc.splitTextToSize(desc, colValor - colDesc - 3)[0] || '-';
            doc.text(descLine, colDesc + 2, y + 3.5);
            doc.text(formatCurrency(valor), colValor + 2, y + 3.5);
            y += rowHeight;
        });

        ensureSpace(8);
        doc.setDrawColor(120, 120, 120);
        doc.rect(marginLeft, y, contentWidth, 6);
        doc.line(colValor, y, colValor, y + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(totalLabel, marginLeft + 2, y + 4);
        doc.text(formatCurrency(total), colValor + 2, y + 4);
        y += 10;
        return total;
    };

    const totalPecas = drawMoneyTable('PEÇAS', pecas, 'TOTAL PEÇAS');
    const totalServicos = drawMoneyTable('SERVIÇOS', servicos, 'TOTAL SERVIÇOS');

    ensureSpace(18);
    drawDivider();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`### TOTAL GERAL: ${formatCurrency(totalPecas + totalServicos)}`, marginLeft, y);
    y += 10;

    drawSignatures();
    addFooter();

    doc.save(`OS-${placa}-${dataArquivo}_CHECKLIST.pdf`);
    showToast('PDF profissional gerado com sucesso!', 'success');
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
