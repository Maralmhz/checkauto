// GERENCIAMENTO DE ESTADO GLOBAL
const AppState = {
    currentPage: 'dashboard',
    user: null,
    oficina: {
        nome: 'OFICINA FASTCAR',
        endereco: 'Rua das Oficinas, 123 - Centro',
        telefone: '(31) 99999-9999',
        cnpj: '00.000.000/0000-00',
        logo: 'https://via.placeholder.com/40'
    },
    data: {
        ordensServico: [
            {
                id: 'OS-001',
                numero: '000001',
                clienteId: 1,
                cliente: 'Joao Silva',
                veiculoId: 1,
                veiculo: 'Fiat Uno - ABC-1234',
                status: 'em_andamento',
                data: '2026-03-06',
                valorTotal: 850.00,
                descricao: 'Troca de oleo e filtro',
                servicos: [
                    { id: 1, descricao: 'Troca de oleo', valor: 450.00 },
                    { id: 2, descricao: 'Filtro de oleo', valor: 200.00 },
                    { id: 3, descricao: 'Filtro de ar', valor: 200.00 }
                ]
            },
            {
                id: 'OS-002',
                numero: '000002',
                clienteId: 2,
                cliente: 'Maria Santos',
                veiculoId: 2,
                veiculo: 'Honda Civic - XYZ-5678',
                status: 'aguardando',
                data: '2026-03-06',
                valorTotal: 1200.00,
                descricao: 'Revisao completa',
                servicos: [
                    { id: 1, descricao: 'Revisao 10000km', valor: 1200.00 }
                ]
            },
            {
                id: 'OS-003',
                numero: '000003',
                clienteId: 3,
                cliente: 'Pedro Costa',
                veiculoId: 3,
                veiculo: 'VW Gol - DEF-9012',
                status: 'concluida',
                data: '2026-03-05',
                dataConclusao: '2026-03-05',
                valorTotal: 450.00,
                descricao: 'Alinhamento e balanceamento',
                servicos: [
                    { id: 1, descricao: 'Alinhamento', valor: 200.00 },
                    { id: 2, descricao: 'Balanceamento', valor: 250.00 }
                ]
            },
            {
                id: 'OS-004',
                numero: '000004',
                clienteId: 4,
                cliente: 'Ana Paula',
                veiculoId: 4,
                veiculo: 'Toyota Corolla - GHI-3456',
                status: 'em_andamento',
                data: '2026-03-04',
                valorTotal: 2500.00,
                descricao: 'Troca de embreagem',
                servicos: [
                    { id: 1, descricao: 'Kit embreagem', valor: 1800.00 },
                    { id: 2, descricao: 'Mao de obra', valor: 700.00 }
                ]
            },
            {
                id: 'OS-005',
                numero: '000005',
                clienteId: 5,
                cliente: 'Carlos Eduardo',
                veiculoId: 5,
                veiculo: 'Chevrolet Onix - JKL-7890',
                status: 'concluida',
                data: '2026-03-01',
                dataConclusao: '2026-03-01',
                valorTotal: 320.00,
                descricao: 'Troca de pastilhas de freio',
                servicos: [
                    { id: 1, descricao: 'Pastilhas dianteiras', valor: 220.00 },
                    { id: 2, descricao: 'Mao de obra', valor: 100.00 }
                ]
            }
        ],
        clientes: [
            { id: 1, nome: 'Joao Silva', cpf: '123.456.789-00', telefone: '(31) 99999-1111' },
            { id: 2, nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(31) 99999-2222' },
            { id: 3, nome: 'Pedro Costa', cpf: '111.222.333-44', telefone: '(31) 99999-3333' },
            { id: 4, nome: 'Ana Paula', cpf: '444.555.666-77', telefone: '(31) 99999-4444' },
            { id: 5, nome: 'Carlos Eduardo', cpf: '777.888.999-00', telefone: '(31) 99999-5555' }
        ],
        veiculos: [
            { id: 1, placa: 'ABC-1234', modelo: 'Fiat Uno', clienteId: 1, chassis: '9BWZZZ377VT004251', ano: '2020', cor: 'Branco' },
            { id: 2, placa: 'XYZ-5678', modelo: 'Honda Civic', clienteId: 2, chassis: '19XFC2F59KE000001', ano: '2021', cor: 'Prata' },
            { id: 3, placa: 'DEF-9012', modelo: 'VW Gol', clienteId: 3, chassis: '9BWAA05U38P000001', ano: '2019', cor: 'Preto' },
            { id: 4, placa: 'GHI-3456', modelo: 'Toyota Corolla', clienteId: 4, chassis: 'JTNKARFK7J3000001', ano: '2022', cor: 'Vermelho' },
            { id: 5, placa: 'JKL-7890', modelo: 'Chevrolet Onix', clienteId: 5, chassis: '9BGKS69TOXG000001', ano: '2020', cor: 'Azul' }
        ],
        agendamentos: [
            {
                id: 1,
                clienteId: 1,
                veiculoId: 1,
                data: '2026-03-06',
                hora: '14:00',
                tipoServico: 'Revisao',
                status: 'confirmado',
                observacoes: 'Cliente prefere horario da tarde',
                criadoEm: '2026-03-01T10:00:00Z'
            },
            {
                id: 2,
                clienteId: 2,
                veiculoId: 2,
                data: '2026-03-06',
                hora: '16:00',
                tipoServico: 'Troca de oleo',
                status: 'confirmado',
                observacoes: '',
                criadoEm: '2026-03-02T14:00:00Z'
            },
            {
                id: 3,
                clienteId: 3,
                veiculoId: 3,
                data: '2026-03-07',
                hora: '09:00',
                tipoServico: 'Alinhamento',
                status: 'pendente',
                observacoes: 'Cliente mencionou barulho na suspensao',
                criadoEm: '2026-03-03T11:30:00Z'
            },
            {
                id: 4,
                clienteId: 4,
                veiculoId: 4,
                data: '2026-03-08',
                hora: '10:30',
                tipoServico: 'Troca de pneus',
                status: 'confirmado',
                observacoes: '',
                criadoEm: '2026-03-04T09:00:00Z'
            },
            {
                id: 5,
                clienteId: 5,
                veiculoId: 5,
                data: '2026-03-08',
                hora: '15:00',
                tipoServico: 'Diagnostico eletrico',
                status: 'pendente',
                observacoes: 'Problema com central de injecao',
                criadoEm: '2026-03-05T16:45:00Z'
            },
            {
                id: 6,
                clienteId: 1,
                veiculoId: 1,
                data: '2026-03-10',
                hora: '11:00',
                tipoServico: 'Troca de bateria',
                status: 'confirmado',
                observacoes: '',
                criadoEm: '2026-03-05T13:20:00Z'
            },
            {
                id: 7,
                clienteId: 2,
                veiculoId: 2,
                data: '2026-03-12',
                hora: '14:30',
                tipoServico: 'Revisao 20000km',
                status: 'pendente',
                observacoes: 'Revisao preventiva agendada com antecedencia',
                criadoEm: '2026-03-06T10:00:00Z'
            },
            {
                id: 8,
                clienteId: 3,
                veiculoId: 3,
                data: '2026-03-05',
                hora: '13:00',
                tipoServico: 'Troca de freios',
                status: 'atendido',
                observacoes: 'Agendamento convertido em OS',
                criadoEm: '2026-03-01T08:30:00Z'
            }
        ],
        contasReceber: [
            { id: 1, osId: 'OS-001', osNumero: '000001', cliente: 'Joao Silva', pagadorTipo: 'cliente', pagadorNome: 'Joao Silva', formaPagamento: 'pix', parcelasTotal: 1, parcelasRecebidas: 0, valor: 850.00, valorRecebido: 0, vencimento: '2026-03-10', status: 'aberta' },
            { id: 2, osId: 'OS-002', osNumero: '000002', cliente: 'Maria Santos', pagadorTipo: 'seguradora', pagadorNome: 'Seguradora Alpha', formaPagamento: 'boleto', parcelasTotal: 2, parcelasRecebidas: 0, valor: 1200.00, valorRecebido: 0, vencimento: '2026-03-15', status: 'aberta' }
        ],
        contasPagar: [
            { id: 1, fornecedor: 'Fornecedor de Pecas', valor: 3500.00, vencimento: '2026-03-12', status: 'aberta', categoria: 'Pecas' },
            { id: 2, fornecedor: 'Aluguel', valor: 2000.00, vencimento: '2026-03-08', status: 'aberta', categoria: 'Estrutura' }
        ],
        contasFixas: []
    }
};

function initApp() {
    console.log('Perplexity v5.0 - FASE 5: Sistema de Agendamento + Dashboard Interativo');
    
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    loadFromLocalStorage();
    updateDashboard();
    updateOficinaNome();
    renderRecentOS();
    updateUserInfo();
    renderClientes();
    renderVeiculos();
    renderOrdensServico();
    if (typeof initFinanceiro === 'function') {
        try {
            initFinanceiro();
        } catch (error) {
            console.error('Falha ao inicializar modulo financeiro:', error);
        }
    }
    
    // ATIVAR CARDS CLICAVEIS DO DASHBOARD
    if (typeof setupDashboardCards === 'function') {
        setupDashboardCards();
        console.log('Cards do dashboard configurados para serem clicaveis!');
    }
    
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
    
    console.log('Sistema inicializado - FASE 5 ativa!');
}

function checkAuth() {
    const user = localStorage.getItem('perplexity_user') || sessionStorage.getItem('perplexity_user');
    if (!user) return false;
    try {
        AppState.user = JSON.parse(user);
        return true;
    } catch (e) {
        return false;
    }
}

function updateUserInfo() {
    if (AppState.user) {
        const userNameEl = document.querySelector('.user-name');
        const userRoleEl = document.querySelector('.user-role');
        if (userNameEl) userNameEl.textContent = AppState.user.name;
        if (userRoleEl) userRoleEl.textContent = AppState.user.role;
    }
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (activeLink) activeLink.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        AppState.currentPage = page;
        
        // Renderizar dados especificos da pagina
        if (page === 'ordens-servico') {
            renderOrdensServico();
        } else if (page === 'agendamento') {
            renderAgendamentos();
        } else if (page === 'financeiro' && typeof renderFinanceiroDashboard === 'function') {
            renderFinanceiroDashboard();
            renderContasPagar();
            renderContasReceber();
            renderContasFixas();
            renderFluxoCaixa();
        }
    }
    
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function updateDashboard() {
    const { ordensServico, clientes, veiculos, agendamentos } = AppState.data;
    
    const osAbertasEl = document.getElementById('osAbertas');
    const osHojeEl = document.getElementById('osHoje');
    const totalClientesEl = document.getElementById('totalClientes');
    const totalVeiculosEl = document.getElementById('totalVeiculos');
    
    if (osAbertasEl) osAbertasEl.textContent = ordensServico.filter(os => os.status !== 'concluida').length;
    if (osHojeEl) osHojeEl.textContent = ordensServico.filter(os => isToday(os.data)).length;
    if (totalClientesEl) totalClientesEl.textContent = clientes.length;
    if (totalVeiculosEl) totalVeiculosEl.textContent = veiculos.length;
    
    const contasReceberList = AppState.data.contasReceber || [];
    const contasPagarList = AppState.data.contasPagar || [];
    const totalReceber = contasReceberList
        .filter(c => ['aberta', 'parcial', 'atrasada', 'pendente'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Math.max(0, Number(c.valor || 0) - Number(c.valorRecebido || 0)), 0);
    const totalPagar = contasPagarList
        .filter(c => ['aberta', 'atrasada', 'pendente'].includes(c.status || 'aberta'))
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    
    const contasReceberEl = document.getElementById('contasReceber');
    const contasPagarEl = document.getElementById('contasPagar');
    
    if (contasReceberEl) contasReceberEl.textContent = formatMoney(totalReceber);
    if (contasPagarEl) contasPagarEl.textContent = formatMoney(totalPagar);
    
    const agendamentosHojeCount = agendamentos.filter(a => isToday(a.data) && a.status !== 'atendido').length;
    const agendamentosHojeEl = document.getElementById('agendamentosHoje');
    if (agendamentosHojeEl) agendamentosHojeEl.textContent = agendamentosHojeCount;
    
    const faturamento = ordensServico
        .filter(os => isCurrentMonth(os.data) && os.status === 'concluida')
        .reduce((sum, os) => sum + os.valorTotal, 0);
    
    const faturamentoMesEl = document.getElementById('faturamentoMes');
    if (faturamentoMesEl) faturamentoMesEl.textContent = formatMoney(faturamento);
}

function renderRecentOS() {
    const tbody = document.getElementById('recentOSTable');
    if (!tbody) return;
    
    const ordensServico = AppState.data.ordensServico.slice().reverse().slice(0, 5);
    
    if (ordensServico.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma OS registrada ainda</td></tr>';
        return;
    }
    
    tbody.innerHTML = ordensServico.map(os => `
        <tr>
            <td><strong>${os.numero}</strong></td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td>${getStatusBadge(os.status)}</td>
            <td>${formatDate(os.data)}</td>
            <td>
                <button class="btn-icon" onclick="viewOS('${os.id}')" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const badges = {
        'aguardando': '<span class="badge badge-warning">Aguardando</span>',
        'em_andamento': '<span class="badge badge-info">Em Andamento</span>',
        'concluida': '<span class="badge badge-success">Concluida</span>',
        'cancelada': '<span class="badge badge-danger">Cancelada</span>'
    };
    return badges[status] || status;
}

function showToast(message, type = 'info') {
    alert(message);
}

function updateOficinaNome() {
    const nomeElement = document.getElementById('oficinaNome');
    if (nomeElement && AppState.oficina.nome) {
        nomeElement.textContent = AppState.oficina.nome;
    }
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('perplexity_user');
        sessionStorage.removeItem('perplexity_user');
        window.location.href = 'login.html';
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('perplexity_data');
    
    if (!savedData) {
        console.log('Primeira execucao - Salvando dados de exemplo');
        saveToLocalStorage();
        return;
    }
    
    try {
        const parsed = JSON.parse(savedData);
        if (!parsed.ordensServico || parsed.ordensServico.length === 0) {
            console.log('LocalStorage vazio - Usando dados de exemplo');
            saveToLocalStorage();
        } else {
            AppState.data = parsed;
            if (AppState.data.financeiro) {
                AppState.data.contasReceber = AppState.data.contasReceber || AppState.data.financeiro.contasReceber || [];
                AppState.data.contasPagar = AppState.data.contasPagar || AppState.data.financeiro.contasPagar || [];
                delete AppState.data.financeiro;
            }

            AppState.data.contasReceber = AppState.data.contasReceber || AppState.data.contas_a_receber || [];
            AppState.data.contasPagar = AppState.data.contasPagar || AppState.data.contas_a_pagar || [];
            AppState.data.contasFixas = AppState.data.contasFixas || AppState.data.contas_fixas || [];

            delete AppState.data.contas_a_receber;
            delete AppState.data.contas_a_pagar;
            delete AppState.data.contas_fixas;
            console.log('Dados carregados do LocalStorage');
        }
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('perplexity_data', JSON.stringify(AppState.data));
        console.log('Dados salvos');
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
    }
}

function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isCurrentMonth(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

setInterval(saveToLocalStorage, 30000);
