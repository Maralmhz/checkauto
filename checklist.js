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
    const margin = 15;
    const headerHeight = 24;
    const footerHeight = 14;
    const contentTop = headerHeight + 8;
    const contentBottom = pageHeight - footerHeight - 6;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const oficinaNome = 'OFICINA FASTCAR';
    const oficinaCnpj = '12.345.678/0001-90';
    const oficinaEndereco = 'Av. Principal, 123 - Vila Pérola - MG';

    const osNum = document.getElementById('checklistNumeroOS')?.textContent?.trim() || 'SEM-OS';
    const cliente = document.getElementById('checklistClienteNome')?.value?.trim() || 'Não informado';
    const cpf = document.getElementById('checklistClienteCPF')?.value?.trim() || '-';
    const placa = (document.getElementById('checklistVeiculoPlaca')?.value || '').toUpperCase().trim() || '-';
    const modelo = document.getElementById('checklistVeiculoModelo')?.value?.trim() || 'Não informado';
    const hodometro = document.getElementById('hodometro')?.value?.trim() || '-';
    const combustivelNivel = document.getElementById('nivelCombustivel')?.value || '0';
    const combustivelTipos = Array.from(document.querySelectorAll('.combustivel-btn.active'))
        .map(btn => btn.textContent.trim())
        .filter(Boolean);
    const luzesAtivas = Array.from(document.querySelectorAll('.luz-painel-btn')).map(btn => ({
        nome: btn.textContent.replace(/\s+/g, ' ').trim(),
        ativo: btn.classList.contains('active')
    }));
    const observacoes = document.getElementById('observacoes')?.value?.trim() || 'Nenhuma observação registrada.';
    const inspecaoVisual = {
        Lataria: document.getElementById('inspecaoLataria')?.value?.trim() || '-',
        Pneus: document.getElementById('inspecaoPneus')?.value?.trim() || '-',
        Vidros: document.getElementById('inspecaoVidros')?.value?.trim() || '-',
        Interior: document.getElementById('inspecaoInterior')?.value?.trim() || '-'
    };
    const statusRegulacao = document.getElementById('statusRegulacao')?.value || 'pendente';
    const seguradora = document.getElementById('seguradora')?.value?.trim() || '-';
    const regulador = document.getElementById('regulador')?.value?.trim() || '-';
    const dataRegulacao = document.getElementById('dataRegulacao')?.value || '-';

    const itensEntrada = Array.from(document.querySelectorAll('.checklist-item')).map(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label')?.textContent?.trim() || checkbox?.id || 'Item';
        return {
            label,
            marcado: !!checkbox?.checked
        };
    });

    const servicos = coletarServicos();
    const pecas = coletarPecas();
    const fotos = ChecklistState.checklistAtual?.fotos || [];

    let pageNumber = 1;
    let y = contentTop;

    function addHeader() {
        doc.setFillColor(0, 76, 153);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, 4, 14, 14, 2, 2, 'F');
        doc.setTextColor(0, 76, 153);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('FC', margin + 7, 13, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(oficinaNome, margin + 18, 10);
        doc.setFontSize(8.5);
        doc.setFont(undefined, 'normal');
        doc.text(`CNPJ: ${oficinaCnpj}`, margin + 18, 15);
        doc.text(oficinaEndereco, margin + 18, 19);
        doc.text(`Data emissão: ${dataAtual}`, pageWidth - margin, 10, { align: 'right' });
    }

    function addFooter() {
        doc.setDrawColor(0, 76, 153);
        doc.setLineWidth(0.4);
        doc.line(0, pageHeight - footerHeight, pageWidth, pageHeight - footerHeight);
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        doc.text(`OS: ${osNum} | Cliente: ${cliente} | CNPJ: ${oficinaCnpj}`, margin, pageHeight - 6);
        doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    function ensureSpace(neededHeight) {
        if (y + neededHeight <= contentBottom) return;
        addFooter();
        doc.addPage();
        pageNumber += 1;
        addHeader();
        y = contentTop;
    }

    function formatCurrency(valor) {
        return `R$ ${(Number(valor) || 0).toFixed(2).replace('.', ',')}`;
    }

    function drawSectionTitle(title) {
        ensureSpace(10);
        doc.setTextColor(0, 52, 104);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text(title, margin, y);
        y += 6;
        doc.setDrawColor(214, 224, 234);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
    }

    function drawKeyValue(label, value) {
        ensureSpace(6);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`${label}:`, margin, y);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(String(value), pageWidth - margin * 2 - 26);
        doc.text(lines, margin + 26, y);
        y += Math.max(5, lines.length * 4.5);
    }

    function drawItensTabela(titulo, itens) {
        drawSectionTitle(titulo);
        const colGap = 6;
        const colWidth = (pageWidth - margin * 2 - colGap) / 2;
        let rowY = y;

        for (let i = 0; i < itens.length; i += 2) {
            ensureSpace(8);
            const left = itens[i];
            const right = itens[i + 1];

            doc.rect(margin, rowY - 4.5, colWidth, 6);
            doc.setFontSize(8.5);
            doc.text(`${left.marcado ? '☑' : '☐'} ${left.label}`, margin + 2, rowY);

            if (right) {
                doc.rect(margin + colWidth + colGap, rowY - 4.5, colWidth, 6);
                doc.text(`${right.marcado ? '☑' : '☐'} ${right.label}`, margin + colWidth + colGap + 2, rowY);
            }

            rowY += 7;
            y = rowY;
        }
        y += 2;
    }

    function drawTabelaFinanceira(titulo, itens) {
        drawSectionTitle(titulo);
        const cols = {
            descricao: margin,
            valor: 135,
            regulado: 172,
            right: pageWidth - margin
        };

        function drawHeaderTabela(sufixo = '') {
            ensureSpace(8);
            if (sufixo) {
                doc.setFontSize(8.5);
                doc.setTextColor(90, 90, 90);
                doc.text(sufixo, margin, y - 2);
                y += 2;
            }
            doc.setFillColor(240, 245, 250);
            doc.rect(margin, y - 4.5, cols.right - margin, 6, 'F');
            doc.setDrawColor(210, 220, 230);
            doc.rect(margin, y - 4.5, cols.right - margin, 6);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(0, 0, 0);
            doc.text('Descrição', cols.descricao + 2, y);
            doc.text('Valor', cols.valor + 2, y);
            doc.text('Regulado', cols.regulado + 2, y);
            y += 7;
        }

        drawHeaderTabela();
        let total = 0;

        if (!itens.length) {
            ensureSpace(6);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8.5);
            doc.text('Sem itens cadastrados.', margin + 2, y);
            y += 6;
        }

        itens.forEach((item, index) => {
            ensureSpace(6);
            if (y + 6 > contentBottom) {
                addFooter();
                doc.addPage();
                pageNumber += 1;
                addHeader();
                y = contentTop;
                drawHeaderTabela(`${titulo} (continuação)`);
            }

            const descricao = item.descricao || `Item ${index + 1}`;
            const valor = Number(item.valor) || 0;
            total += valor;

            doc.setDrawColor(230, 230, 230);
            doc.line(margin, y + 1.5, cols.right, y + 1.5);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8.3);
            const descLinhas = doc.splitTextToSize(descricao, cols.valor - cols.descricao - 4);
            doc.text(descLinhas[0], cols.descricao + 2, y);
            doc.text(formatCurrency(valor), cols.valor + 2, y);
            doc.text(item.regulado ? '✓' : '☐', cols.regulado + 10, y, { align: 'center' });
            y += 5;
        });

        ensureSpace(8);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.line(margin, y, cols.right, y);
        y += 5;
        doc.text(`TOTAL ${titulo.toUpperCase()}`, margin + 2, y);
        doc.text(formatCurrency(total), cols.valor + 2, y);
        y += 7;
    }

    showToast('Gerando PDF profissional...');

    addHeader();
    y = contentTop + 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(19);
    doc.text('CHECKLIST DE ENTRADA', pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Veículo: ${modelo}`, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.text(`Placa: ${placa}`, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.text(`Cliente: ${cliente}`, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.text(`Data: ${dataAtual}`, pageWidth / 2, y, { align: 'center' });
    addFooter();

    doc.addPage();
    pageNumber += 1;
    addHeader();
    y = contentTop;

    drawSectionTitle('DADOS DO VEÍCULO');
    drawKeyValue('Placa', placa);
    drawKeyValue('Modelo', modelo);
    drawKeyValue('Cliente', cliente);
    drawKeyValue('CPF', cpf);
    drawKeyValue('Hodômetro', `${hodometro} km`);
    drawKeyValue('Combustível', `${combustivelTipos.join(', ') || 'Não informado'} (${combustivelNivel}/8)`);

    drawSectionTitle('INSPEÇÃO VISUAL');
    Object.entries(inspecaoVisual).forEach(([label, valor]) => drawKeyValue(label, valor));

    drawSectionTitle('LUZES DO PAINEL');
    const luzesTexto = luzesAtivas.map(l => `${l.ativo ? '[X]' : '[ ]'} ${l.nome}`);
    ensureSpace(14);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(luzesTexto.slice(0, 4).join('   '), margin, y);
    y += 6;
    doc.text(luzesTexto.slice(4, 8).join('   '), margin, y);
    y += 4;
    addFooter();

    doc.addPage();
    pageNumber += 1;
    addHeader();
    y = contentTop;
    drawItensTabela('ITENS DE ENTRADA DO VEÍCULO', itensEntrada);
    addFooter();

    for (const [index, foto] of fotos.entries()) {
        doc.addPage();
        pageNumber += 1;
        addHeader();
        y = contentTop;
        drawSectionTitle(`FOTOS DO VEÍCULO (${index + 1}/${fotos.length})`);

        const xFoto = margin;
        const yFoto = y + 2;
        const largura = 180;
        const altura = 120;
        doc.setDrawColor(210, 220, 230);
        doc.rect(xFoto, yFoto, largura, altura);

        if (foto?.url) {
            const formato = foto.url.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(foto.url, formato, xFoto + 2, yFoto + 2, largura - 4, altura - 4, undefined, 'FAST');
        }

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(foto?.nome || `Foto ${index + 1}`, xFoto, yFoto + altura + 7);
        addFooter();
    }

    doc.addPage();
    pageNumber += 1;
    addHeader();
    y = contentTop;
    drawTabelaFinanceira('Serviços orçados', servicos);
    drawTabelaFinanceira('Peças orçadas', pecas);
    drawKeyValue('Status de regulação', statusRegulacao);
    drawKeyValue('Seguradora / Associação', seguradora);
    drawKeyValue('Regulador', regulador);
    drawKeyValue('Data da regulação', dataRegulacao);
    addFooter();

    doc.addPage();
    pageNumber += 1;
    addHeader();
    y = contentTop;
    drawSectionTitle('OBSERVAÇÕES IMPORTANTES');
    const obsLinhas = doc.splitTextToSize(observacoes, pageWidth - margin * 2 - 4);
    ensureSpace(obsLinhas.length * 4.5 + 14);
    doc.setDrawColor(210, 220, 230);
    doc.rect(margin, y - 2, pageWidth - margin * 2, obsLinhas.length * 4.5 + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(obsLinhas, margin + 2, y + 2);
    y += obsLinhas.length * 4.5 + 16;

    drawSectionTitle('ASSINATURAS DIGITAIS');
    ensureSpace(55);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y + 28, margin + 70, y + 28);
    doc.line(margin + 105, y + 28, pageWidth - margin, y + 28);
    doc.setFontSize(9);
    doc.text('Cliente', margin + 30, y + 33, { align: 'center' });
    doc.text('Técnico Recebedor', margin + 140, y + 33, { align: 'center' });
    doc.text(`Data: ${dataAtual}`, margin + 30, y + 39, { align: 'center' });
    doc.text(`Data: ${dataAtual}`, margin + 140, y + 39, { align: 'center' });

    const assinaturaCliente = document.getElementById('canvasAssinaturaCliente')?.toDataURL('image/png');
    const assinaturaTecnico = document.getElementById('canvasAssinaturaTecnico')?.toDataURL('image/png');
    if (assinaturaCliente) {
        doc.addImage(assinaturaCliente, 'PNG', margin + 5, y + 8, 60, 18, undefined, 'FAST');
    }
    if (assinaturaTecnico) {
        doc.addImage(assinaturaTecnico, 'PNG', margin + 110, y + 8, 60, 18, undefined, 'FAST');
    }
    addFooter();

    doc.save(`CHECKLIST_${osNum}.pdf`);
    showToast('PDF multi-página gerado com sucesso!', 'success');
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
