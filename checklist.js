// GERENCIAMENTO DE CHECKLISTS
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

function setAbaAtiva(aba) { ChecklistState.abaAtiva = aba; }
function getAbaAtiva() { return ChecklistState.abaAtiva || 'pecas'; }

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
        tbody.appendChild(aba === 'servicos' ? criarLinhaServico({ id: Date.now() + Math.random(), descricao, valor }) : criarLinhaPeca({ id: Date.now() + Math.random(), descricao, valor }));
    });
    showToast(`${linhas.length} ${aba === 'servicos' ? 'servico(s)' : 'peca(s)'} importado(s) via OCR.`, 'success');
    atualizarResumoFinanceiro();
}

async function abrirOCRCamera() {
    const aba = getAbaAtiva();
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'; input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) { document.body.removeChild(input); return; }
        showToast(`Processando OCR -> ${aba === 'servicos' ? 'SERVICOS' : 'PECAS'}...`, 'info');
        if (typeof Tesseract !== 'undefined') {
            try { const r = await Tesseract.recognize(file, 'por', { logger: () => {} }); iniciarOCRContextual(r.data.text); }
            catch (err) { showToast('Erro no OCR: ' + err.message, 'danger'); }
        } else { showToast('Tesseract nao carregado.', 'info'); }
        document.body.removeChild(input);
    };
    input.click();
}

function initChecklist(osId = null, veiculoId = null, clienteId = null) {
    if (osId) {
        const existe = AppState.data.checklists?.find(c => c.osId === osId);
        if (existe) { ChecklistState.checklistAtual = existe; preencherFormularioChecklist(); }
        else criarNovoChecklist(osId, veiculoId, clienteId);
    } else criarNovoChecklist(null, veiculoId, clienteId);
    setupAutoComplete(); setupNavigacaoTeclado(); setupUploadFotos(); setupAssinaturaCanvas();
    atualizarResumoFinanceiro(); popularSelectsChecklist(); _setupAbaListeners();
}

function _setupAbaListeners() {
    document.querySelectorAll('[data-aba]').forEach(btn => btn.addEventListener('click', () => setAbaAtiva(btn.dataset.aba)));
    document.querySelectorAll('.tab-pecas,[href="#pecas"],[onclick*="pecas"]').forEach(el => el.addEventListener('click', () => setAbaAtiva('pecas')));
    document.querySelectorAll('.tab-servicos,[href="#servicos"],[onclick*="servicos"]').forEach(el => el.addEventListener('click', () => setAbaAtiva('servicos')));
}

function popularSelectsChecklist() {}
function atualizarVeiculosChecklist() {}

function gerarNumeroOS() {
    const placaInput = document.getElementById('checklistVeiculoPlaca');
    if (!placaInput) return;
    const placa = placaInput.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (placa.length < 3) return;
    const h = new Date();
    const numeroOSEl = document.getElementById('checklistNumeroOS');
    if (numeroOSEl) numeroOSEl.textContent = `${placa}-${String(h.getDate()).padStart(2,'0')}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getFullYear()).slice(-2)}`;
}

function preencherFormularioChecklist() {
    if (!ChecklistState.checklistAtual) return;
    const c = ChecklistState.checklistAtual;
    const cliente = (AppState.data.clientes || []).find(x => x.id == c.clienteId);
    const veiculo = (AppState.data.veiculos || []).find(x => x.id == c.veiculoId);
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    s('checklistClienteNome', cliente?.nome || c.clienteNome);
    s('checklistClienteCPF', cliente?.cpf || c.clienteCPF);
    s('checklistVeiculoPlaca', veiculo?.placa || c.veiculoPlaca);
    s('checklistVeiculoModelo', veiculo?.modelo || c.veiculoModelo);
    s('hodometro', c.hodometro); s('observacoes', c.observacoes);
    const nc = document.getElementById('nivelCombustivel');
    if (nc && typeof c.nivelCombustivel === 'number') nc.value = c.nivelCombustivel;
    const nos = document.getElementById('checklistNumeroOS');
    if (nos) { if (c.numeroOS) nos.textContent = c.numeroOS; else gerarNumeroOS(); }
    if (c.itens) Object.entries(c.itens).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.checked = !!v; });
}

function preencherNomeCliente(nome) {
    if (!nome) return;
    const norm = t => (t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const cliente = (AppState.data.clientes||[]).find(c => norm(c.nome) === norm(nome));
    if (!cliente) return;
    const cpf = document.getElementById('checklistClienteCPF');
    if (cpf && !cpf.value) cpf.value = cliente.cpf || '';
    const veiculo = (AppState.data.veiculos||[]).find(v => v.clienteId === cliente.id);
    if (veiculo) {
        const p = document.getElementById('checklistVeiculoPlaca'), m = document.getElementById('checklistVeiculoModelo');
        if (p && !p.value) p.value = veiculo.placa || '';
        if (m && !m.value) m.value = veiculo.modelo || '';
        gerarNumeroOS();
    }
}

function criarNovoChecklist(osId=null, veiculoId=null, clienteId=null) {
    ChecklistState.checklistAtual = {
        id: Date.now(), osId, veiculoId, clienteId, dataEntrada: new Date().toISOString(),
        hodometro: '', nivelCombustivel: 4, tipoCombustivel: [],
        itens: { estepe:false,macaco:false,chaveRoda:false,triangulo:false,extintor:false,radio:false,antena:false,acendedor:false,vidroEletrico:false,travaEletrica:false,buzina:false,bateria:false,rodasLiga:false,protetorCarter:false,chaveSegredo:false,tapetes:false,ar:false,abs:false,airbag:false,automatico:false,direcaoHidraulica:false,alarme:false },
        luzesAvarias:[], inspecaoVisual:{lataria:'',pneus:'',vidros:'',interior:''},
        observacoes:'', fotos:[], assinaturaCliente:null, assinaturaTecnico:null, status:'rascunho'
    };
}

function setupAutoComplete() {
    setupAutoCompleteGenerico('.input-peca-desc', ChecklistState.pecasComuns);
    setupAutoCompleteGenerico('.input-servico-desc', ChecklistState.servicosComuns);
}

function setupAutoCompleteGenerico(sel, lista) {
    document.addEventListener('input', e => {
        if (!e.target.matches(sel)) return;
        const v = removerAcentos(e.target.value.toLowerCase());
        if (v.length < 2) return;
        mostrarSugestoes(e.target, lista.filter(i => removerAcentos(i.toLowerCase()).includes(v)));
    });
}

function removerAcentos(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

function mostrarSugestoes(input, sugestoes) {
    input.parentElement.querySelector('.autocomplete-sugestoes')?.remove();
    if (!sugestoes.length) return;
    const div = document.createElement('div');
    div.className = 'autocomplete-sugestoes';
    div.style.cssText = `position:absolute;background:white;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.1);max-height:200px;overflow-y:auto;z-index:1000;width:${input.offsetWidth}px;margin-top:2px;`;
    sugestoes.slice(0,5).forEach(s => {
        const item = document.createElement('div');
        item.textContent = s;
        item.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;';
        item.addEventListener('mouseenter', () => item.style.background='#f5f5f5');
        item.addEventListener('mouseleave', () => item.style.background='white');
        item.addEventListener('click', () => { input.value = s; div.remove(); input.focus(); });
        div.appendChild(item);
    });
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(div);
    setTimeout(() => document.addEventListener('click', function rem(e) {
        if (!div.contains(e.target) && e.target !== input) { div.remove(); document.removeEventListener('click', rem); }
    }), 100);
}

function setupNavigacaoTeclado() {
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const t = e.target;
        if (t.classList.contains('input-peca-valor')) { e.preventDefault(); adicionarLinhaPeca(); }
        else if (t.classList.contains('input-servico-valor')) { e.preventDefault(); adicionarLinhaServico(); }
        else if (t.classList.contains('input-peca-desc') || t.classList.contains('input-servico-desc')) {
            e.preventDefault();
            const next = t.parentElement.parentElement.querySelector(t.classList.contains('input-peca-desc') ? '.input-peca-valor' : '.input-servico-valor');
            if (next) next.focus();
        }
    });
}

function adicionarLinhaServico() {
    const tbody = document.getElementById('tabelaServicos');
    const l = criarLinhaServico(); tbody.appendChild(l);
    l.querySelector('.input-servico-desc')?.focus(); atualizarResumoFinanceiro();
}

function adicionarLinhaPeca() {
    const tbody = document.getElementById('tabelaPecas');
    const l = criarLinhaPeca(); tbody.appendChild(l);
    l.querySelector('.input-peca-desc')?.focus(); atualizarResumoFinanceiro();
}

function criarLinhaServico(s=null) {
    const tr = document.createElement('tr'), id = s?.id||Date.now();
    tr.innerHTML = `<td><input type="text" class="input-servico-desc" placeholder="Descricao do servico" value="${s?.descricao||''}" data-id="${id}"></td><td><input type="text" class="input-servico-valor" placeholder="0,00" value="${s?.valor||''}" data-id="${id}" oninput="formatarValorInput(this);atualizarResumoFinanceiro();"></td><td style="text-align:center;"><input type="checkbox" ${s?.regulado?'checked':''} onchange="atualizarResumoFinanceiro()"></td><td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaServico(this)"><i class="fas fa-trash"></i></button></td>`;
    return tr;
}

function criarLinhaPeca(p=null) {
    const tr = document.createElement('tr'), id = p?.id||Date.now();
    tr.innerHTML = `<td><input type="text" class="input-peca-desc" placeholder="Descricao da peca" value="${p?.descricao||''}" data-id="${id}"></td><td><input type="text" class="input-peca-valor" placeholder="0,00" value="${p?.valor||''}" data-id="${id}" oninput="formatarValorInput(this);atualizarResumoFinanceiro();"></td><td style="text-align:center;"><input type="checkbox" ${p?.regulado?'checked':''} onchange="atualizarResumoFinanceiro()"></td><td style="text-align:center;"><button class="btn-icon btn-danger" onclick="removerLinhaPeca(this)"><i class="fas fa-trash"></i></button></td>`;
    return tr;
}

function removerLinhaServico(btn) { btn.closest('tr').remove(); atualizarResumoFinanceiro(); }
function removerLinhaPeca(btn) { btn.closest('tr').remove(); atualizarResumoFinanceiro(); }

function formatarValorInput(input) {
    const v = input.value.replace(/\D/g,'');
    input.value = v ? (parseInt(v)/100).toFixed(2) : '';
}

function atualizarResumoFinanceiro() {
    const sv = coletarServicos(), pc = coletarPecas();
    const ts = sv.reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    const tp = pc.reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    const tr2 = sv.filter(x=>x.regulado).reduce((s,x)=>s+(parseFloat(x.valor)||0),0) + pc.filter(x=>x.regulado).reduce((s,x)=>s+(parseFloat(x.valor)||0),0);
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=formatMoney(v); };
    set('totalServicos',ts); set('totalPecas',tp); set('totalRegulado',tr2);
    set('totalPendente',ts+tp-tr2); set('totalGeral',ts+tp);
}

function coletarServicos() {
    return Array.from(document.querySelectorAll('#tabelaServicos tr'))
        .map(tr=>({descricao:tr.querySelector('.input-servico-desc')?.value, valor:parseFloat(tr.querySelector('.input-servico-valor')?.value)||0, regulado:tr.querySelector('input[type="checkbox"]')?.checked||false}))
        .filter(s=>s.descricao);
}

function coletarPecas() {
    return Array.from(document.querySelectorAll('#tabelaPecas tr'))
        .map(tr=>({descricao:tr.querySelector('.input-peca-desc')?.value, valor:parseFloat(tr.querySelector('.input-peca-valor')?.value)||0, regulado:tr.querySelector('input[type="checkbox"]')?.checked||false}))
        .filter(p=>p.descricao);
}

function setupUploadFotos() {
    document.getElementById('inputFotos')?.addEventListener('change', e => {
        Array.from(e.target.files).forEach(f => { if(f.type.startsWith('image/')) comprimirEAdicionarFoto(f); });
    });
}

function comprimirEAdicionarFoto(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW=800, maxH=600;
            let w=img.width, h=img.height;
            if(w>h){if(w>maxW){h*=maxW/w;w=maxW;}}else{if(h>maxH){w*=maxH/h;h=maxH;}}
            canvas.width=w; canvas.height=h;
            canvas.getContext('2d').drawImage(img,0,0,w,h);
            adicionarFotoNaGaleria(canvas.toDataURL('image/jpeg',0.7),file.name);
        };
        img.src=e.target.result;
    };
    reader.readAsDataURL(file);
}

function adicionarFotoNaGaleria(dataUrl, nome) {
    const galeria = document.getElementById('galeriaFotos');
    const div = document.createElement('div');
    div.className='foto-preview'; div.style.cssText='position:relative;display:inline-block;margin:5px;';
    div.innerHTML=`<img src="${dataUrl}" style="width:120px;height:90px;object-fit:cover;border-radius:4px;"><button onclick="removerFoto(this)" style="position:absolute;top:2px;right:2px;background:red;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;">x</button>`;
    galeria.appendChild(div);
    if(!ChecklistState.checklistAtual.fotos) ChecklistState.checklistAtual.fotos=[];
    ChecklistState.checklistAtual.fotos.push({url:dataUrl,nome});
}

function removerFoto(btn) { btn.parentElement.remove(); }

function setupAssinaturaCanvas() { setupCanvas('canvasAssinaturaCliente'); setupCanvas('canvasAssinaturaTecnico'); }

function setupCanvas(canvasId) {
    const canvas=document.getElementById(canvasId); if(!canvas) return;
    const ctx=canvas.getContext('2d'); let d=false;
    canvas.addEventListener('mousedown',e=>{d=true;const r=canvas.getBoundingClientRect();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);});
    canvas.addEventListener('mouseup',()=>d=false);
    canvas.addEventListener('mouseleave',()=>d=false);
    canvas.addEventListener('mousemove',e=>{if(!d)return;const r=canvas.getBoundingClientRect();ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#000';ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);});
}

function limparAssinatura(canvasId) { const c=document.getElementById(canvasId); c.getContext('2d').clearRect(0,0,c.width,c.height); }
function toggleLuzPainel() { event.target.closest('.luz-painel-btn').classList.toggle('active'); }
function toggleCombustivel() { event.target.closest('.combustivel-btn').classList.toggle('active'); }

function salvarChecklist() {
    const gv = id => document.getElementById(id)?.value?.trim()||'';
    const clienteNome=gv('checklistClienteNome'), clienteCPF=gv('checklistClienteCPF');
    const veiculoPlaca=(document.getElementById('checklistVeiculoPlaca')?.value||'').toUpperCase().trim();
    const veiculoModelo=gv('checklistVeiculoModelo');
    let cliente=(AppState.data.clientes||[]).find(c=>c.nome?.trim().toLowerCase()===clienteNome.toLowerCase());
    if(!cliente&&clienteNome){cliente={id:Date.now(),nome:clienteNome,cpf:clienteCPF,telefone:'',email:'',endereco:''};AppState.data.clientes.push(cliente);}
    let veiculo=(AppState.data.veiculos||[]).find(v=>v.placa?.toUpperCase()===veiculoPlaca);
    if(!veiculo&&veiculoPlaca&&cliente){veiculo={id:Date.now()+1,placa:veiculoPlaca,modelo:veiculoModelo||'Nao informado',clienteId:cliente.id,chassis:'',ano:'',cor:''};AppState.data.veiculos.push(veiculo);}
    const checklist={...ChecklistState.checklistAtual,clienteId:cliente?.id||null,clienteNome,clienteCPF,veiculoId:veiculo?.id||null,veiculoPlaca,veiculoModelo,numeroOS:document.getElementById('checklistNumeroOS')?.textContent,hodometro:gv('hodometro'),nivelCombustivel:parseInt(document.getElementById('nivelCombustivel')?.value),observacoes:gv('observacoes'),itens:coletarItensChecklist(),assinaturaCliente:document.getElementById('canvasAssinaturaCliente')?.toDataURL(),assinaturaTecnico:document.getElementById('canvasAssinaturaTecnico')?.toDataURL(),status:'completo'};
    ChecklistState.checklistAtual=checklist;
    const sp={servicos:coletarServicos(),pecas:coletarPecas(),statusRegulacao:document.getElementById('statusRegulacao')?.value,seguradora:document.getElementById('seguradora')?.value,regulador:document.getElementById('regulador')?.value,dataRegulacao:document.getElementById('dataRegulacao')?.value};
    if(!AppState.data.checklists) AppState.data.checklists=[];
    const idx=AppState.data.checklists.findIndex(c=>c.id===checklist.id);
    if(idx>=0) AppState.data.checklists[idx]=checklist; else AppState.data.checklists.push(checklist);
    if(!AppState.data.servicosEPecas) AppState.data.servicosEPecas=[];
    sp.checklistId=checklist.id;
    const idxSP=AppState.data.servicosEPecas.findIndex(x=>x.checklistId===checklist.id);
    if(idxSP>=0) AppState.data.servicosEPecas[idxSP]=sp; else AppState.data.servicosEPecas.push(sp);
    saveToLocalStorage();
    if(typeof renderClientes==='function') renderClientes();
    if(typeof renderVeiculos==='function') renderVeiculos();
    if(typeof updateDashboard==='function') updateDashboard();
    showToast('Checklist salvo com sucesso!');
}

function coletarItensChecklist() {
    const itens={};
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb=>{itens[cb.id]=cb.checked;});
    return itens;
}

function gerarImagemMockChecklist(titulo, corFundo='#0b5ed7') {
    const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=800;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=corFundo; ctx.fillRect(0,0,1200,800);
    ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fillRect(60,60,1080,680);
    ctx.fillStyle='#1f2937'; ctx.font='bold 56px Arial'; ctx.fillText('FASTCAR',110,180);
    ctx.fillStyle='#374151'; ctx.font='36px Arial'; ctx.fillText(titulo,110,250);
    ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=8; ctx.strokeRect(110,300,980,360);
    ctx.fillStyle='#6b7280'; ctx.font='30px Arial'; ctx.fillText('Imagem demonstrativa',150,500);
    return canvas.toDataURL('image/jpeg',0.75);
}

function preencherChecklistDemoCompleto(gerarPdfAoFinal=true) {
    if(!document.getElementById('page-checklist')) return;
    const sv=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
    sv('checklistClienteNome','Joao Silva de Almeida'); sv('checklistClienteCPF','123.456.789-00');
    sv('checklistVeiculoPlaca','ABC-1234'); sv('checklistVeiculoModelo','Fiat Uno 1.0 Fire Flex 2012');
    sv('hodometro','152364'); sv('nivelCombustivel','4');
    sv('inspecaoLataria','Risco na porta dianteira esquerda.'); sv('inspecaoPneus','4 pneus Pirelli 80%.');
    sv('inspecaoVidros','Trinca no para-brisa.'); sv('inspecaoInterior','Banco com desgaste.');
    sv('observacoes','Veiculo para orcamento.'); sv('statusRegulacao','parcial');
    sv('seguradora','Porto Seguro'); sv('regulador','Carlos Menezes');
    sv('dataRegulacao',new Date().toISOString().slice(0,10));
    gerarNumeroOS();
    document.querySelectorAll('.combustivel-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes('flex')));
    document.querySelectorAll('.luz-painel-btn').forEach(b=>b.classList.toggle('active',['motor','freio','abs'].some(c=>b.textContent.toLowerCase().includes(c))));
    Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]')).forEach((cb,i)=>{cb.checked=i%3===0||i%5===0;});
    const tServ=document.getElementById('tabelaServicos'), tPec=document.getElementById('tabelaPecas');
    if(tServ) tServ.innerHTML=''; if(tPec) tPec.innerHTML='';
    ['Mao de obra pintura','Mao de obra funilaria','Troca de oleo','Alinhamento 4 rodas','Balanceamento','Diagnostico eletronico','Higienizacao interna','Polimento tecnico','Revisao freios','Troca fluido freio','Limpeza bicos','Regulagem farois','Calibracao pneus','Revisao ar-cond','Inspecao estrutural','Reaperto suspensao','Geometria','Reparo eletrico','Teste de rodagem','Troca bateria','Retifica tambor','Troca correia','Servico cambio','Troca pastilha','Limpeza borboleta','Escaneamento ECU','Troca fluido dir','Carga gas ar-cond','Lavagem externa','Lavagem motor'].forEach((d,i)=>{
        tServ?.appendChild(criarLinhaServico({id:Date.now()+i,descricao:d,valor:(120+i*17.35).toFixed(2),regulado:i%2===0}));
    });
    ['Parachoque dianteiro','Parachoque traseiro','Farol esquerdo','Lanterna traseira dir','Retrovisor esq','Para-lama esq','Capo original','Porta dianteira esq','Pastilha freio','Disco freio par','Bateria 60Ah','Filtro oleo','Filtro ar','Kit correia','Vela NGK iridium','Oleo 5W30 4L','Pneu 175/65 R14','Amortecedor esq','Radiador','Alternador','Kit embreagem','Bomba dagua','Terminal direcao','Rolamento diant','Sensor ABS','Coxim motor','Pivo esquerdo','Bucha bandeja','Cabo vela jogo','Tampa oleo'].forEach((d,i)=>{
        tPec?.appendChild(criarLinhaPeca({id:Date.now()+100+i,descricao:d,valor:(180+i*26.7).toFixed(2),regulado:i%3===0}));
    });
    const galeria=document.getElementById('galeriaFotos');
    if(galeria) galeria.innerHTML='';
    if(!ChecklistState.checklistAtual) criarNovoChecklist();
    ChecklistState.checklistAtual.fotos=[];
    ['Vista frontal','Lateral esquerda','Lateral direita','Traseira','Interior'].forEach((t,i)=>{
        adicionarFotoNaGaleria(gerarImagemMockChecklist(t,['#0b5ed7','#198754','#6f42c1','#fd7e14','#dc3545'][i]),'foto.jpg');
    });
    const assinar=(id,nome)=>{
        const c=document.getElementById(id); if(!c) return;
        const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
        ctx.strokeStyle='#111827'; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(16,90); ctx.bezierCurveTo(60,20,120,130,190,70); ctx.bezierCurveTo(210,55,235,85,275,45); ctx.stroke();
        ctx.font='12px Arial'; ctx.fillStyle='#4b5563'; ctx.fillText(nome,12,140);
    };
    assinar('canvasAssinaturaCliente','Joao Silva'); assinar('canvasAssinaturaTecnico','Rafael Tecnico');
    atualizarResumoFinanceiro();
    if(gerarPdfAoFinal) gerarPDF();
}

function getWhatsAppIconDataURL(size=32) {
    const canvas=document.createElement('canvas'); canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d'), s=size/32;
    ctx.fillStyle='#25D366'; ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#FFFFFF'; ctx.beginPath();
    ctx.moveTo(16*s,5*s); ctx.arc(16*s,16*s,11*s,-Math.PI*0.9,Math.PI*0.9);
    ctx.arc(16*s,16*s,11*s,Math.PI*0.9,Math.PI*1.1); ctx.lineTo(7*s,27*s);
    ctx.arc(16*s,16*s,11*s,Math.PI*1.1,-Math.PI*0.9); ctx.fill();
    ctx.fillStyle='#25D366'; ctx.beginPath(); ctx.arc(16*s,16*s,8.5*s,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#FFFFFF'; ctx.font=`bold ${Math.round(12*s)}px Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('\u2706',16*s,16*s);
    return canvas.toDataURL('image/png');
}

function normalizarTelefoneWhatsApp(t) {
    if(!t) return null;
    let n=t.replace(/\D/g,'');
    if(!n||n.length<8) return null;
    if(!n.startsWith('55')&&(n.length===10||n.length===11)) n='55'+n;
    return n;
}

function abrirWhatsAppComPDF(nomeArquivo, telefone, osNum) {
    const msg=encodeURIComponent(`Ola! Segue o PDF da OS *${osNum}* da Fast Car.\nArquivo: *${nomeArquivo}*\nQualquer duvida, estamos a disposicao!`);
    const n=normalizarTelefoneWhatsApp(telefone);
    window.open(n?`https://wa.me/${n}?text=${msg}`:`https://wa.me/?text=${msg}`,'_blank','noopener,noreferrer');
}

// ═══════════════════════════════════════════════════════════════════════════
//  gerarPDF — usa jsPDF-AutoTable para colunas REALMENTE independentes
//  PEÇAS (esq) | SERVICOS (dir) — cada uma seleciona texto separado no PDF
//  Total de cada coluna logo abaixo do ultimo item (nao no fim da pagina)
//  Total Geral na mesma pagina, logo abaixo dos dois totais
//  Maximo 30 linhas por pagina por coluna
// ═══════════════════════════════════════════════════════════════════════════
async function gerarPDF() {
    if (typeof window.jspdf === 'undefined') { showToast('Biblioteca jsPDF nao carregada', 'info'); return; }
    if (typeof window.jspdf.jsPDF.API.autoTable === 'undefined' && typeof autoTable === 'undefined') {
        showToast('jsPDF-AutoTable nao carregado', 'info'); return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const oficina = { nome:'FAST CAR CENTRO AUTOMOTIVO', endereco:'AV. REGULUS, 248 - JARDIM RIACHO DAS PEDRAS, CONTAGEM - MG, 32241-210', telefone:'(31) 2342-1699', cnpj:'60.516.882/0001-74' };

    const gv = id => document.getElementById(id)?.value?.trim()||'';
    const osNum       = document.getElementById('checklistNumeroOS')?.textContent?.trim()||'SEM-OS';
    const clienteNome = gv('checklistClienteNome')||'NAO INFORMADO';
    const cpf         = gv('checklistClienteCPF')||'-';
    const telCliente  = gv('telefoneCliente');
    const placa       = (document.getElementById('checklistVeiculoPlaca')?.value||'').toUpperCase().trim()||'SEMPLACA';
    const modelo      = gv('checklistVeiculoModelo')||'-';
    const chassis     = gv('chassisVeiculo')||'-';
    const hodometro   = gv('hodometro')||'-';
    const combustNivel= document.getElementById('nivelCombustivel')?.value||'0';
    const combustTipos= Array.from(document.querySelectorAll('.combustivel-btn.active')).map(b=>b.textContent.trim()).filter(Boolean);
    const inspVisual  = { lataria:gv('inspecaoLataria')||'-', pneus:gv('inspecaoPneus')||'-', vidros:gv('inspecaoVidros')||'-', interior:gv('inspecaoInterior')||'-' };
    const itensEntrada= Array.from(document.querySelectorAll('.checklist-item')).map(item=>({label:(item.querySelector('label')||item.querySelector('.badge')||item.querySelector('span'))?.textContent?.trim()||item.querySelector('input')?.id||'Item', marcado:!!item.querySelector('input[type="checkbox"]')?.checked}));

    const servicos = coletarServicos();
    const pecas    = coletarPecas();
    const fotos    = (ChecklistState.checklistAtual?.fotos||[]).slice(0,9);
    const assinCli = document.getElementById('canvasAssinaturaCliente')?.toDataURL('image/png');
    const assinTec = document.getElementById('canvasAssinaturaTecnico')?.toDataURL('image/png');

    const now          = new Date();
    const dataEmissao  = now.toLocaleDateString('pt-BR');
    const horaEmissao  = now.toLocaleTimeString('pt-BR');
    const dataValidade = new Date(now.getTime()+15*24*60*60*1000).toLocaleDateString('pt-BR');
    const nomeArquivo  = 'OS-'+placa+'-'+dataEmissao.replace(/\//g,'-')+'_CHECKLIST.pdf';
    const fmtCur       = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

    const PAGE_W=210, MARGIN=12, CX=22, CW=166, CT=44, CB=268;
    const waIcon = getWhatsAppIconDataURL(64);

    // Colunas lado a lado
    const GAP=4, COL_W=(CW-GAP)/2;
    const XP=CX, XS=CX+COL_W+GAP; // X peças, X serviços

    const LINHAS_PAG = 30;
    const ROW_H      = 6;   // altura de cada linha na tabela AutoTable

    const drawBase = () => { doc.setDrawColor(210,210,210); doc.rect(MARGIN,10,PAGE_W-MARGIN*2,277); };

    const drawHeader = () => {
        doc.setDrawColor(225,225,225); doc.line(22,17,188,17);
        doc.setFillColor(255,255,255); doc.setDrawColor(225,225,225); doc.roundedRect(22,22,20,14,1,1,'FD');
        doc.setFont('helvetica','bold'); doc.setTextColor(205,25,25); doc.setFontSize(8); doc.text('FAST CAR',32,30,{align:'center'});
        doc.setFontSize(10.5); doc.text(oficina.nome,45,25);
        doc.setTextColor(110,110,110); doc.setFont('helvetica','normal'); doc.setFontSize(6.3);
        doc.text(oficina.endereco,45,29); doc.addImage(waIcon,'PNG',45,30.2,3.2,3.2); doc.text(oficina.telefone,49.5,32.5); doc.text('CNPJ: '+oficina.cnpj,45,36);
        doc.setFont('helvetica','bold'); doc.setTextColor(120,120,120); doc.setFontSize(6.4); doc.text('ORDEM DE SERVICO',188,31,{align:'right'});
        doc.setTextColor(205,25,25); doc.setFontSize(12); doc.text(osNum,188,36.5,{align:'right'});
        doc.setDrawColor(220,40,40); doc.setLineWidth(0.7); doc.line(22,40.5,188,40.5); doc.setLineWidth(0.2);
    };

    const drawFooter = (comAssin=false) => {
        if (comAssin) {
            doc.setDrawColor(190,190,190); doc.line(22,248,188,248);
            doc.setDrawColor(160,160,160); doc.line(22,260,95,260); doc.line(115,260,188,260);
            if(assinCli) doc.addImage(assinCli,'PNG',27,248,62,11,undefined,'FAST');
            if(assinTec) doc.addImage(assinTec,'PNG',120,248,62,11,undefined,'FAST');
            doc.setFont('helvetica','normal'); doc.setTextColor(140,140,140); doc.setFontSize(5.6);
            doc.text('ASSINATURA DO CLIENTE',55,264,{align:'center'}); doc.text('ASSINATURA DO TECNICO',155,264,{align:'center'});
        }
        doc.setDrawColor(190,190,190); doc.line(22,270,188,270);
        doc.setFont('helvetica','normal'); doc.setTextColor(140,140,140); doc.setFontSize(5.6);
        doc.text('DOCUMENTO GERADO POR '+oficina.nome+' | CNPJ: '+oficina.cnpj+' | '+dataEmissao+' '+horaEmissao,105,275,{align:'center'});
    };

    const drawBox = (x,y,w,h,title,lines=[]) => {
        doc.setDrawColor(215,215,215); doc.setFillColor(250,250,250); doc.roundedRect(x,y,w,h,1.5,1.5,'FD');
        doc.setFont('helvetica','bold'); doc.setTextColor(45,45,45); doc.setFontSize(6.5); doc.text(title.toUpperCase(),x+2,y+5);
        doc.setDrawColor(235,235,235); doc.line(x+1.5,y+6.5,x+w-1.5,y+6.5);
        doc.setFont('helvetica','normal'); doc.setTextColor(70,70,70); doc.setFontSize(8);
        let ly=y+11;
        lines.forEach(line=>doc.splitTextToSize(line,w-4).forEach(p=>{if(ly<y+h-1){doc.text(p,x+2,ly);ly+=3.8;}}));
    };

    const drawBadges = (x,y,w,h,items) => {
        doc.setDrawColor(215,215,215); doc.setFillColor(250,250,250); doc.roundedRect(x,y,w,h,1.5,1.5,'FD');
        doc.setFont('helvetica','bold'); doc.setTextColor(45,45,45); doc.setFontSize(6.5); doc.text('INSPECAO DE ENTRADA',x+2,y+5);
        doc.setDrawColor(235,235,235); doc.line(x+1.5,y+6.5,x+w-1.5,y+6.5);
        const bH=4.5,bPad=2,gap=1.5; let cx=x+2,cy=y+10; doc.setFontSize(5.8);
        items.forEach(item=>{
            const bw=doc.getTextWidth(item.label)+bPad*2+4;
            if(cx+bw>x+w-2){cx=x+2;cy+=bH+gap;} if(cy+bH>y+h-2) return;
            item.marcado?(doc.setFillColor(25,135,84),doc.setTextColor(255,255,255)):(doc.setFillColor(220,220,220),doc.setTextColor(100,100,100));
            doc.roundedRect(cx,cy,bw,bH,1,1,'F');
            doc.setFont('helvetica','bold'); doc.text(item.marcado?'+':'-',cx+1.5,cy+3.3);
            doc.setFont('helvetica','normal'); doc.text(item.label,cx+4.5,cy+3.3);
            cx+=bw+gap;
        });
    };

    const compressPhoto = dataUrl => new Promise(resolve=>{
        const img=new Image();
        img.onload=()=>{
            const canvas=document.createElement('canvas'), maxW=640, scale=Math.min(1,maxW/img.width);
            canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
            canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
            resolve(canvas.toDataURL('image/jpeg',0.7));
        };
        img.onerror=()=>resolve(dataUrl); img.src=dataUrl;
    });

    const drawTermo = (x,y,w) => {
        const h=58;
        doc.setDrawColor(200,200,200); doc.setFillColor(252,252,252); doc.roundedRect(x,y,w,h,2,2,'FD');
        doc.setFillColor(240,240,240); doc.roundedRect(x,y,w,7,2,2,'F'); doc.rect(x,y+3.5,w,3.5,'F');
        doc.setFont('helvetica','bold'); doc.setTextColor(50,50,50); doc.setFontSize(7); doc.text('APROVACAO E CIENCIA DO CLIENTE',x+w/2,y+5.2,{align:'center'});
        doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60); doc.setFontSize(6.2);
        let ty=y+10;
        ['Declaro estar ciente e de acordo com os servicos e pecas relacionados neste orcamento,','autorizando a Fast Car Centro Automotivo a executar os servicos descritos acima.','ATENCAO: Este orcamento e valido por 15 dias ('+dataEmissao+'), vencendo em '+dataValidade+'.','Apos aprovacao, podem ocorrer complementos de orcamento durante a desmontagem,','situacao em que o cliente sera previamente comunicado para nova autorizacao.']
            .forEach(l=>{doc.text(l,x+w/2,ty,{align:'center'});ty+=4;});
        const al=y+36, cw3=(w-10)/3;
        [0,1,2].forEach(i=>{const cx=x+4+i*(cw3+1);doc.setDrawColor(150,150,150);doc.setLineWidth(0.4);doc.line(cx,al,cx+cw3,al);doc.setLineWidth(0.2);});
        doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100); doc.setFontSize(5.8);
        ['Aprovado por / Assinatura do Cliente','Responsavel Tecnico / Aprovador','Data e Hora da Aprovacao'].forEach((l,i)=>{const cx=x+4+i*(cw3+1);doc.text(l,cx+cw3/2,al+5,{align:'center'});});
        doc.setFont('helvetica','italic'); doc.setTextColor(130,130,130); doc.setFontSize(5.2);
        doc.text('"Estou ciente dos termos acima e autorizo a execucao dos servicos."',x+w/2,y+h-2,{align:'center'});
    };

    // ── PÁGINA 1: dados + inspeção + fotos ────────────────────────────────
    drawBase(); drawHeader();
    drawBox(22,44,82,20,'CLIENTE',['NOME: '+clienteNome,'CPF/CNPJ: '+cpf+'  |  TEL: '+(telCliente||'Nao informado')]);
    drawBox(107,44,81,20,'VEICULO',[modelo+'  '+placa,'KM: '+hodometro+'  |  '+(combustTipos.join('/')||'Combustivel')+' ('+combustNivel+%)',\'CHASSI: '+chassis]);
    drawBox(22,67,166,13,'SERVICOS SOLICITADOS',servicos.length?servicos.map(s=>s.descricao):['-']);
    drawBadges(22,83,166,30,itensEntrada);
    drawBox(22,116,166,16,'OBSERVACOES DA INSPECAO',['Lataria: '+inspVisual.lataria,'Pneus: '+inspVisual.pneus,'Vidros: '+inspVisual.vidros,'Interior: '+inspVisual.interior]);
    const fotosComp=[];
    for(const f of fotos) fotosComp.push({nome:f.nome,url:await compressPhoto(f.url)});
    drawBox(22,135,166,100,'FOTOS DO VEICULO',[]);
    if(fotosComp.length>0){
        fotosComp.slice(0,3).forEach((f,i)=>{const fx=24+i*53,fy=143;doc.setDrawColor(200,40,40);doc.roundedRect(fx,fy,51,36,1,1);doc.addImage(f.url,'JPEG',fx+0.5,fy+0.5,50,35,undefined,'FAST');});
        fotosComp.slice(3,9).forEach((f,i)=>{const fx=24+i*27.2,fy=182;doc.setDrawColor(200,40,40);doc.roundedRect(fx,fy,25,18,1,1);doc.addImage(f.url,'JPEG',fx+0.5,fy+0.5,24,17,undefined,'FAST');});
    }
    drawFooter(true);

    // ── PÁGINAS DE PEÇAS + SERVIÇOS com jsPDF-AutoTable ───────────────────
    //
    // ESTRATÉGIA:
    //   - autoTable com startY=CT, margin para que a tabela ocupe só metade da largura
    //   - Peças: tabela na coluna esquerda  (startX=XP, tableWidth=COL_W)
    //   - Serviços: tabela na coluna direita (startX=XS, tableWidth=COL_W)
    //   - pageBreak: 'auto' cuida da paginação automaticamente
    //   - Cada tabela independente = seleção de texto separada no PDF
    //   - Total de cada tabela: rowStyles na ultima linha (foot)
    //   - Total Geral: calculado e posicionado logo após a maior tabela
    //
    const totalPec = pecas.reduce((s,p)=>s+(Number(p.valor)||0),0);
    const totalSrv = servicos.reduce((s,v)=>s+(Number(v.valor)||0),0);
    const totalGeral = totalPec + totalSrv;

    const atStyles = {
        font: 'helvetica', fontSize: 6.5, cellPadding: 1.5,
        overflow: 'ellipsize', lineColor: [220,220,220], lineWidth: 0.2
    };

    const headStylePec = { fillColor:[20,105,200], textColor:255, fontStyle:'bold', fontSize:7 };
    const headStyleSrv = { fillColor:[220,40,40],  textColor:255, fontStyle:'bold', fontSize:7 };
    const footStylePec = { fillColor:[20,105,200], textColor:255, fontStyle:'bold', fontSize:8 };
    const footStyleSrv = { fillColor:[220,40,40],  textColor:255, fontStyle:'bold', fontSize:8 };

    const pecasRows    = pecas.map(p=>[p.descricao, fmtCur(p.valor)]);
    const servicosRows = servicos.map(s=>[s.descricao, fmtCur(s.valor)]);

    // Adiciona nova página para as tabelas
    doc.addPage(); drawBase(); drawHeader();

    // ── Tabela PEÇAS (coluna esquerda) ────────────────────────────────────
    doc.autoTable({
        head: [['PECAS', 'VALOR']],
        body: pecasRows,
        foot: [['TOTAL PECAS', fmtCur(totalPec)]],
        startY: CT,
        margin: { left: XP, right: PAGE_W - XP - COL_W },
        tableWidth: COL_W,
        showFoot: 'lastPage',
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        styles: atStyles,
        headStyles: headStylePec,
        footStyles: footStylePec,
        columnStyles: { 0: { cellWidth: COL_W * 0.65 }, 1: { cellWidth: COL_W * 0.35, halign:'right' } },
        didDrawPage: (data) => { drawBase(); drawHeader(); drawFooter(false); }
    });

    const finalYPec = doc.lastAutoTable.finalY;

    // ── Tabela SERVIÇOS (coluna direita, mesma página inicial) ────────────
    doc.autoTable({
        head: [['SERVICOS', 'VALOR']],
        body: servicosRows,
        foot: [['TOTAL SERVICOS', fmtCur(totalSrv)]],
        startY: CT,
        margin: { left: XS, right: PAGE_W - XS - COL_W },
        tableWidth: COL_W,
        showFoot: 'lastPage',
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        styles: atStyles,
        headStyles: headStyleSrv,
        footStyles: footStyleSrv,
        columnStyles: { 0: { cellWidth: COL_W * 0.65 }, 1: { cellWidth: COL_W * 0.35, halign:'right' } },
        didDrawPage: (data) => { drawBase(); drawHeader(); drawFooter(false); }
    });

    const finalYSrv = doc.lastAutoTable.finalY;

    // ── TOTAL GERAL logo abaixo da maior tabela ───────────────────────────
    // Calcula a página e Y final de cada tabela para posicionar o total
    // O autoTable finalY já está na página correta após o último draw
    const totalY = Math.max(finalYPec, finalYSrv) + 4;

    // Verifica se cabe na página atual
    const precisaNovaPag = totalY + 58 + 25 > CB;
    if (precisaNovaPag) { doc.addPage(); drawBase(); drawHeader(); drawFooter(false); }
    const tyUsed = precisaNovaPag ? CT : totalY;

    // Bloco TOTAL GERAL centralizado
    doc.setFillColor(22,163,74); doc.roundedRect(CX, tyUsed, CW, 13, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255); doc.setFontSize(12);
    doc.text('TOTAL GERAL DO ORCAMENTO:', CX+4, tyUsed+9);
    doc.setFontSize(13); doc.text(fmtCur(totalGeral), CX+CW-4, tyUsed+9, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80); doc.setFontSize(6);
    doc.text('Emissao: '+dataEmissao+' '+horaEmissao+'   |   Validade: '+dataValidade, CX+CW/2, tyUsed+17, {align:'center'});

    // Termo de aprovação
    let termoY = tyUsed + 22;
    if (termoY + 58 > CB) { doc.addPage(); drawBase(); drawHeader(); drawFooter(false); termoY = CT; }
    drawTermo(CX, termoY, CW);
    drawFooter(false);

    // ── Salvar + WhatsApp ─────────────────────────────────────────────────
    doc.save(nomeArquivo);
    showToast('PDF gerado e enviado via WhatsApp!', 'success');
    setTimeout(()=>abrirWhatsAppComPDF(nomeArquivo, telCliente, osNum), 600);
}

if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('page-checklist')) initChecklist();});
}else{
    if(document.getElementById('page-checklist')) initChecklist();
}
